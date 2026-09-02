import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();

// Guarantee 1: Top-Level Request Deserialization Ordering
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy/Safe Google GenAI Client with dynamic API key reload
let cachedApiKey = '';
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const currentKey = process.env.GEMINI_API_KEY || '';
  if (!genAIClient || cachedApiKey !== currentKey) {
    cachedApiKey = currentKey;
    if (!currentKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. Falling back to local mindful companion if unauthenticated.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Fallback Model Ladder with official supported models from @google/genai ordered by availability & latency
const TEXT_FALLBACK_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
];

const TRANSCRIBE_FALLBACK_MODELS = [
  'gemini-3.5-transcribe',
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

interface FallbackOptions {
  contents: unknown;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  models?: string[];
}

function isUnrecoverableAuthError(err: any): boolean {
  if (!err) return false;
  const str = String(err?.message || err) + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '');
  return (
    str.includes('401') ||
    str.includes('UNAUTHENTICATED') ||
    str.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
    str.includes('invalid authentication credentials') ||
    str.includes('API_KEY_INVALID')
  );
}

function extractErrorSummary(err: any): { summary: string; details: string; code: number | string } {
  if (!err) return { summary: 'Unknown Error', details: 'Unknown Gemini API error', code: 'UNKNOWN' };
  const message = String(err?.message || err);
  
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('credits are depleted') || message.includes('quota')) {
    return {
      summary: 'Gemini API Credits / Quota Depleted (429)',
      details: 'Your Gemini API prepayment credits or quota are exhausted. Manage billing or update your API key in Google AI Studio Settings.',
      code: 429,
    };
  }
  if (message.includes('401') || message.includes('UNAUTHENTICATED') || message.includes('invalid authentication') || message.includes('API_KEY_INVALID')) {
    return {
      summary: 'Gemini API Authentication Failed (401)',
      details: 'The configured GEMINI_API_KEY is invalid or unauthenticated. Please provide a valid key in Settings.',
      code: 401,
    };
  }
  if (message.includes('404') || message.includes('NOT_FOUND')) {
    return {
      summary: 'Gemini Model Not Found (404)',
      details: message,
      code: 404,
    };
  }
  if (message.includes('503') || message.includes('UNAVAILABLE')) {
    return {
      summary: 'Gemini Service Temporarily Unavailable (503)',
      details: 'Google AI services are temporarily busy. Please retry in a moment.',
      code: 503,
    };
  }
  return {
    summary: 'Gemini API Error',
    details: message.length > 200 ? message.slice(0, 197) + '...' : message,
    code: 500,
  };
}

/**
 * Sanitizes multi-turn chat contents for Gemini API:
 * 1. Ensures role is strictly 'user' or 'model'.
 * 2. Merges consecutive messages with the same role.
 * 3. Drops any initial 'model' message so conversation starts with 'user'.
 * 4. Ensures conversation ends with 'user'.
 */
function sanitizeGeminiContents(rawContents: Array<{ role: string; parts: Array<{ text: string }> }>): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  if (!Array.isArray(rawContents) || rawContents.length === 0) {
    return [];
  }

  const cleaned: Array<{ role: 'user' | 'model'; text: string }> = [];

  for (const item of rawContents) {
    if (!item) continue;
    const role: 'user' | 'model' = (item.role === 'model' || item.role === 'assistant') ? 'model' : 'user';
    let text = '';
    if (Array.isArray(item.parts)) {
      text = item.parts.map((p) => (typeof p?.text === 'string' ? p.text.trim() : '')).filter(Boolean).join('\n');
    }
    if (text) {
      cleaned.push({ role, text });
    }
  }

  if (cleaned.length === 0) return [];

  // Drop leading model turns
  while (cleaned.length > 0 && cleaned[0].role === 'model') {
    cleaned.shift();
  }

  if (cleaned.length === 0) return [];

  // Merge consecutive turns of identical roles
  const merged: Array<{ role: 'user' | 'model'; text: string }> = [];
  for (const turn of cleaned) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) {
      last.text = `${last.text}\n\n${turn.text}`;
    } else {
      merged.push({ role: turn.role, text: turn.text });
    }
  }

  // Ensure last turn is 'user'
  while (merged.length > 0 && merged[merged.length - 1].role === 'model') {
    merged.pop();
  }

  return merged.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const ai = getGenAI();
  let lastError: unknown = null;
  const modelsToTry = options.models && options.models.length > 0 ? options.models : TEXT_FALLBACK_MODELS;

  for (const modelName of modelsToTry) {
    try {
      const config: Record<string, unknown> = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (typeof options.temperature === 'number') {
        config.temperature = options.temperature;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      console.info(`[Gemini API] Requesting generation via model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents as any,
        config,
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0 || modelName === modelsToTry[modelsToTry.length - 1]) {
        console.info(`[Gemini API] Success with model: ${modelName}`);
        return { text: responseText, modelUsed: modelName };
      }
    } catch (err: any) {
      console.error(`[Gemini API] Model ${modelName} failed:`, err?.message || err);
      if (isUnrecoverableAuthError(err)) {
        // Fast-fail authentication errors to prevent cascading redundant API failures
        throw new Error(`Gemini API authentication failed (401): ${err?.message || 'Invalid or unsupported API key'}`);
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate content across all Gemini fallback models.');
}

// Advanced Semantic Analysis & Cognitive Reasoning Engine
interface CognitiveAnalysis {
  theme: 'conflict_work' | 'burnout_stress' | 'decision_crossroads' | 'progress_win' | 'gratitude_peace' | 'relationship_interpersonal' | 'creative_problem' | 'learning_growth' | 'emotional_processing' | 'general';
  sentiment: 'positive' | 'reflective' | 'challenging' | 'conflicted' | 'grounded';
  detectedDistortion?: 'perfectionism' | 'hyper_responsibility' | 'catastrophizing' | 'imposter_syndrome' | 'boundary_conflict' | 'unexpressed_needs';
  entities: string[];
  keyDilemma: string;
  specificQuote: string;
  turnCount: number;
}

function analyzeTextSemantics(text: string, history: Array<{ role: string; content?: string; text?: string; parts?: Array<{ text: string }> }> = []): CognitiveAnalysis {
  // Strip role prefixes if present
  const clean = text.replace(/^(User:|Assistant:|Model:|assistant:|model:|user:)\s*/i, '').trim();
  const lower = clean.toLowerCase();

  // Extract entities & subjects
  const entities: string[] = [];
  if (/boss|manager|lead|director|supervisor|executive/i.test(lower)) entities.push('work leadership');
  if (/colleague|coworker|team|peer|stakeholder/i.test(lower)) entities.push('colleagues/team');
  if (/partner|spouse|husband|wife|boyfriend|girlfriend/i.test(lower)) entities.push('romantic partner');
  if (/friend|friends/i.test(lower)) entities.push('friendship');
  if (/family|parent|mother|father|mom|dad|sister|brother|child|kids/i.test(lower)) entities.push('family');
  if (/deadline|launch|project|deliverable|presentation|client|meeting/i.test(lower)) entities.push('project deliverable');
  if (/interview|job|career|promotion|salary|resume|offer/i.test(lower)) entities.push('career transition');
  if (/sleep|wake|morning|alarm|routine|workout|gym|health|tired|exhausted|body|energy/i.test(lower)) entities.push('daily routine & physical well-being');
  if (/exam|study|class|grade|course|assignment/i.test(lower)) entities.push('academic studies');
  if (/habit|consistency|focus|procrastinat|discipline/i.test(lower)) entities.push('habits & consistency');

  // Detect Theme & Cognitive patterns
  let theme: CognitiveAnalysis['theme'] = 'general';
  let sentiment: CognitiveAnalysis['sentiment'] = 'reflective';
  let detectedDistortion: CognitiveAnalysis['detectedDistortion'] = undefined;

  if (/argument|disagree|conflict|fight|tension|unappreciated|undervalued|criticiz|confrontation|rude/i.test(lower)) {
    theme = 'conflict_work';
    sentiment = 'challenging';
    detectedDistortion = 'boundary_conflict';
  } else if (/burnout|exhaust|overwhelm|drowning|too much|cannot handle|anxious|anxiety|panic|stressed|heavy/i.test(lower)) {
    theme = 'burnout_stress';
    sentiment = 'challenging';
    detectedDistortion = 'hyper_responsibility';
  } else if (/should i|decid|choice|crossroad|torn between|unsure whether|which path|what to do|confus|control/i.test(lower)) {
    theme = 'decision_crossroads';
    sentiment = 'conflicted';
  } else if (/finish|accomplish|succeed|won|delivered|solved|promoted|proud|progress|proud of|got done|momentum/i.test(lower)) {
    theme = 'progress_win';
    sentiment = 'positive';
  } else if (/grateful|gratitude|thankful|peace|serene|calm|quiet|joy|blessed|appreciate/i.test(lower)) {
    theme = 'gratitude_peace';
    sentiment = 'grounded';
  } else if (/relationship|talked to|conversation with|hurt my feelings|misunderstood|love|lonely|distance/i.test(lower)) {
    theme = 'relationship_interpersonal';
    sentiment = 'conflicted';
    detectedDistortion = 'unexpressed_needs';
  } else if (/idea|design|build|create|brainstorm|write|innovat|stuck on/i.test(lower)) {
    theme = 'creative_problem';
    sentiment = 'reflective';
  } else if (/lesson|realiz|growth|taught me|understand myself|learning|perspective/i.test(lower)) {
    theme = 'learning_growth';
    sentiment = 'reflective';
  } else if (/feel|sad|angry|afraid|scared|guilt|shame|frustrat/i.test(lower)) {
    theme = 'emotional_processing';
    sentiment = 'challenging';
  }

  // Detect specific cognitive distortions
  if (/must be perfect|not good enough|flaw|failed completely|never good|make a mistake/i.test(lower)) {
    detectedDistortion = 'perfectionism';
  } else if (/i don't belong|fraud|imposter|fooling everyone|luck/i.test(lower)) {
    detectedDistortion = 'imposter_syndrome';
  } else if (/everything is ruined|worst thing|catastrophe|disaster|end of the world/i.test(lower)) {
    detectedDistortion = 'catastrophizing';
  }

  // Extract a high-salience snippet or phrase to quote directly, preserving numbers and colons (like 6:30 am)
  // Split on sentence boundaries without breaking numbers or time formats
  const cleanOneLine = clean.replace(/\r?\n+/g, ' ').trim();
  const sentences = cleanOneLine.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter((s) => s.length > 5);
  const specificQuote = sentences.length > 0 ? (sentences[0].length > 120 ? sentences[0].slice(0, 115) + '...' : sentences[0]) : (cleanOneLine.length > 120 ? cleanOneLine.slice(0, 115) + '...' : cleanOneLine);

  // Formulate key dilemma summary
  let keyDilemma = specificQuote;
  if (entities.length > 0) {
    keyDilemma = `Navigating ${entities.join(' & ')}: "${specificQuote}"`;
  }

  return {
    theme,
    sentiment,
    detectedDistortion,
    entities,
    keyDilemma,
    specificQuote,
    turnCount: history.length,
  };
}

/**
 * Generates an analytical, insightful, and highly relevant cognitive reflection
 * that directly quotes, reasons through, and analyzes the user's specific text.
 */
function generateMindfulFallbackReply(
  latestPrompt: string,
  mode: string,
  mood?: string,
  userName?: string,
  lang: string = 'en',
  turnIndex: number = 1,
  history: Array<any> = []
): string {
  const name = userName ? ` ${userName}` : '';
  const analysis = analyzeTextSemantics(latestPrompt, history);
  const quote = analysis.specificQuote;
  const entities = analysis.entities.length > 0 ? analysis.entities.join(', ') : 'this experience';
  const isFollowUp = history.length > 1;

  // Extract prior user statement for contextual contrast if in a multi-turn conversation
  let priorUserQuote = '';
  if (isFollowUp) {
    for (let i = history.length - 2; i >= 0; i--) {
      const h = history[i];
      const role = h.role === 'model' || h.role === 'assistant' ? 'model' : 'user';
      if (role === 'user') {
        const text = typeof h.content === 'string' ? h.content : (typeof h.text === 'string' ? h.text : (h.parts && h.parts[0]?.text) || '');
        if (text && text.trim()) {
          const priorAnalysis = analyzeTextSemantics(text);
          priorUserQuote = priorAnalysis.specificQuote;
          break;
        }
      }
    }
  }

  // 1. SPANISH (es)
  if (lang === 'es') {
    if (mode === 'summarize') {
      return `### Análisis Cognitivo & Resumen de Reflexión\n\nAl examinar tu reflexión: *"\\"${quote}\\""*\n\n- **Dinámica Principal**: ${analysis.theme === 'conflict_work' ? 'Tensión interpersonal y necesidad de validación/límites' : analysis.theme === 'burnout_stress' ? 'Sobrecarga de responsabilidades y necesidad de recuperación' : analysis.theme === 'progress_win' ? 'Consolidación de logros y reafirmación de capacidades' : 'Introspección activa y clarificación de prioridades'}.\n- **Tono y Clima Emocional**: ${mood || (analysis.sentiment === 'positive' ? 'Grounded & Proactivo' : analysis.sentiment === 'challenging' ? 'Vulnerable & Resiliente' : 'Reflexivo')}.\n- **Patrón Detectado**: ${analysis.detectedDistortion === 'perfectionism' ? 'Exigencia de estándares implacables vs. aceptación compasiva' : analysis.detectedDistortion === 'boundary_conflict' ? 'Defensa de límites personales frente a demandas externas' : 'Búsqueda de coherencia entre valores y acciones'}.\n- **Realización Central**: Expresar esta vivencia con exactitud desactiva el ruido mental y abre espacio a una acción deliberada.`;
    }
    if (mode === 'action_items') {
      return `### Plan de Acción & Estrategias Cognitivas\n\nBasado en tu situación (*"${quote}"*):\n\n1. **Inmediato (Próximas 2 horas)**: Separa lo que está bajo tu control directo de lo que depende de las reacciones ajenas.\n2. **Comunicación & Límites**: Formula tu necesidad o postura en una frase clara y sin disculpas innecesarias.\n3. **Cuidado de tu Energía**: Permítete un intervalo de 10 minutos sin pantallas para procesar la tensión antes de responder.`;
    }
    if (mode === 'brainstorm') {
      return `### Nuevas Perspectivas & Experimentos de Pensamiento\n\nExplorando tu experiencia (*"${quote}"*):\n\n- **El Reencuadre**: Si esta situación fuera un maestro inesperado sobre tus límites, ¿qué lección clave te está regalando?\n- **Perspectiva a 1 Año**: Mirando hacia atrás dentro de doce meses, ¿qué decisión honrará mejor tu tranquilidad a largo plazo?\n- **El Experimento Opuesto**: ¿Qué sucedería si no intentaras complacer las expectativas externas y actuases con absoluta calma?`;
    }
    return `### Análisis & Perspectiva de Reflexión\n\nAl leer tus palabras: *"\\"${quote}\\""*\n\nEs comprensible que esto despierte emociones intensas${name}. En situaciones que involucran ${entities}, suele surgir una tensión entre lo que esperamos de los demás y los límites que necesitamos proteger.\n\n**Observaciones Clave:**\n- **Validación del Impacto**: Nombrar lo sucedido con esta precisión demuestra claridad sobre lo que toleras y lo que valoras.\n- **Enfoque de Control**: Gran parte de la fricción emocional proviene de intentar controlar el desenlace en lugar de enfocarte en tu propia respuesta.\n\n**Preguntas para Profundizar:**\n1. ¿Qué necesidad o valor tuyo no fue respetado o reconocido en esta situación?\n2. Si abordaras el siguiente paso desde tu mayor serenidad en vez del resentimiento o la prisa, ¿cómo actuarías?\n\n*¿Qué aspecto de esto sientes más urgente aclarar ahora?*`;
  }

  // 2. FRENCH (fr)
  if (lang === 'fr') {
    if (mode === 'summarize') {
      return `### Synthèse Analytique & Points Clés\n\nEn analysant vos mots : *"\\"${quote}\\""*\n\n- **Dynamique Centrale**: ${analysis.theme === 'conflict_work' ? 'Gestion des tensions relationnelles et affirmation des limites' : analysis.theme === 'burnout_stress' ? 'Pression cognitive et régulation de l\'énergie' : 'Clarification des intentions et introspection'}.\n- **Climat Émotionnel**: ${mood || (analysis.sentiment === 'positive' ? 'Aligné et constructif' : 'Lucide et exigeant')}.\n- **Enjeu de Fond**: Transformer un ressenti diffus en un constat clair pour reprendre le contrôle de votre trajectoire.`;
    }
    if (mode === 'action_items') {
      return `### Pistes d'Action Ciblées\n\nÀ partir de votre partage (*"${quote}"*) :\n\n1. **Prise de Recul Immédiate**: Identifiez ce qui relève de votre responsabilité directe et ce qui appartient à autrui.\n2. **Posture & Clarté**: Rédigez en une phrase l'intention bienveillante mais ferme que vous souhaitez adopter.\n3. **Régénération**: Accordez-vous un moment de silence pour ancrer votre sérénité avant toute réaction.`;
    }
    return `### Analyse & Perspective de Réflexion\n\nÀ la lecture de ce que vous avez partagé : *"\\"${quote}\\""*\n\nCe que vous décrivez soulève des questions fondamentales${name}. Face à des situations touchant ${entities}, il est naturel de ressentir une dissonance entre nos attentes et la réalité du moment.\n\n**Points d'Analyse :**\n- **Prise de Conscience**: Mettre en lumière cette situation avec tant d'honnêteté vous permet d'en extraire les véritables leviers.\n- **Alignement Intérieur**: La clé réside souvent dans la distinction entre ce que nous subissons et la posture que nous choisissons d'adopter.\n\n**Pistes d'Exploration :**\n1. Quel besoin essentiel demande à être entendu ou réaffirmé dans ce contexte ?\n2. Si vous choisissiez d'agir avec une totale bienveillance envers vous-même, quelle serait votre prochaine étape ?\n\n*Quel élément résonne le plus profondément en vous en cet instant ?*`;
  }

  // 3. HINDI (hi)
  if (lang === 'hi') {
    if (mode === 'summarize') {
      return `### वैचारिक विश्लेषण एवं सारांश\n\nआपके इन विचारों पर मनन करते हुए: *"\\"${quote}\\""*\n\n- **मुख्य संदर्भ**: ${analysis.theme === 'conflict_work' ? 'व्यक्तिगत सीमाएं, संवाद और आत्म-सम्मान' : analysis.theme === 'burnout_stress' ? 'मानसिक तनाव और आंतरिक शांति की आवश्यकता' : 'आत्म-बोध और प्राथमिकताओं का निर्धारण'}.\n- **मनोस्थिति**: ${mood || 'गहन चिंतनशील और स्पष्ट'}.\n- **मुख्य निष्कर्ष**: परिस्थितियों को स्पष्ट शब्दों में व्यक्त करना मन के संशय को दूर कर नए दृष्टिकोण प्रदान करता है।`;
    }
    return `### विचार और दृष्टिकोण\n\nआपने जो व्यक्त किया है: *"\\"${quote}\\""*\n\nयह स्थिति स्वाभाविक रूप से मानसिक उथल-पुथल पैदा कर सकती है${name}। जब बात ${entities} से जुड़ी होती है, तो हमारी अपेक्षाओं और वास्तविक परिस्थितियों के बीच संतुलन बनाना आवश्यक हो जाता है।\n\n**मुख्य विश्लेषण:**\n- **आत्म-जागरूकता**: अपनी इस भावना को इतनी स्पष्टता से पहचानना आपके विवेक का प्रमाण है।\n- **नियंत्रण का दायरा**: अक्सर तनाव इस बात से बढ़ता है कि हम दूसरों की प्रतिक्रियाओं को नियंत्रित करना चाहते हैं, जबकि शांति हमारे अपने दृष्टिकोण में है।\n\n**मनन के लिए प्रश्न:**\n1. इस परिस्थिति में आपकी कौन सी मूल भावना या प्राथमिकता सबसे अधिक प्रभावित हुई है?\n2. यदि आप बिना किसी तनाव या क्रोध के विचार करें, तो कौन सा संतुलित कदम आपके मन को शांति देगा?\n\n*इस विषय में आप और क्या अनुभव कर रहे हैं?*`;
  }

  // 4. TAMIL (ta)
  if (lang === 'ta') {
    return `### சிந்தனை மற்றும் பகுப்பாய்வு\n\nநீங்கள் பகிர்ந்த பதிவு: *"\\"${quote}\\""*\n\nஇந்த சூழ்நிலையை இவ்வளவு தெளிவாகப் பதிவு செய்திருப்பது பாராட்டுக்குரியது${name}. ${entities} தொடர்பான நிகழ்வுகளில் நமது எல்லைகளையும் மன அமைதியையும் காப்பது மிகவும் முக்கியமானது.\n\n**முக்கிய அவதானிப்புகள்:**\n- **உள்நோக்கு தெளிவு**: உங்கள் உணர்வுகளை துல்லியமாக அடையாளம் காண்பது தீர்வுக்கான முதல் படியாகும்.\n- **கட்டுப்பாட்டு எல்லை**: பிறரின் செயல்களை விட, இந்த சூழ்நிலைக்கு நாம் அளிக்கும் அமைதியான எதிர்வினையே மன அமைதியைத் தரும்.\n\n**ஆராய்வதற்கான வினாக்கள்:**\n1. இந்த நிகழ்வில் உங்களுக்கு மிகவும் அவசியமான தேவை அல்லது மதிப்பு எது?\n2. அமைதியான மனநிலையோடு அணுகினால், அடுத்ததாக நீங்கள் எடுக்கக்கூடிய சிறந்த முடிவு என்ன?\n\n*இந்த சிந்தனையில் மேலும் எதைப் பற்றி நீங்கள் ஆராய விரும்புகிறீர்கள்?*`;
  }

  // 5. ENGLISH (en - Default)
  if (mode === 'summarize') {
    return `### Cognitive Digest & Reflection Summary

Analyzing your thoughts on: *"${quote}"*

- **Core Dynamic & Theme**: ${
      analysis.theme === 'conflict_work'
        ? 'Interpersonal friction, boundary assertion, and navigating authority/validation'
        : analysis.theme === 'burnout_stress'
        ? 'Cognitive overwhelm, hyper-responsibility, and urgent capacity restoration'
        : analysis.theme === 'decision_crossroads'
        ? 'Values alignment versus external expectations at a pivotal inflection point'
        : analysis.theme === 'progress_win'
        ? 'Consolidation of meaningful progress and reinforcing self-efficacy'
        : analysis.theme === 'relationship_interpersonal'
        ? 'Relational expectations, unexpressed needs, and emotional vulnerability'
        : 'Active self-inquiry, mental decluttering, and priority realignment'
    }.
- **Emotional Climate**: ${mood || (analysis.sentiment === 'positive' ? 'Grounded & Victorious' : analysis.sentiment === 'challenging' ? 'Vulnerable & Resilient' : 'Reflective & Perceptive')}.
- **Underlying Pattern**: ${
      analysis.detectedDistortion === 'perfectionism'
        ? 'Perfectionistic standards colliding with real-world complexity'
        : analysis.detectedDistortion === 'boundary_conflict'
        ? 'The friction between protecting your peace and meeting external demands'
        : analysis.detectedDistortion === 'hyper_responsibility'
        ? 'Carrying emotional or operational weight that exceeds your personal control'
        : 'Seeking authentic harmony between your core values and current realities'
    }.
- **Transformative Realization**: Naming this specific dynamic strips away ambient mental fog, turning reactive friction into actionable clarity.`;
  }

  if (mode === 'action_items') {
    return `### Actionable Next Steps & Cognitive Strategies

Derived specifically from your situation: *"${quote}"*

1. **Locus of Control Audit (Immediate)**: Draw a clean mental line between what is strictly within your direct sphere of influence (your communication, your boundaries, your pacing) versus what belongs to external actors or unpredictable timelines.
2. **Precision Framing & Boundaries**: Formulate one clear, neutral statement of your position or need that requires no defensive rationalization.
3. **Capacity Protection Exercise**: Schedule a deliberate 10-minute buffer today to disengage from problem-solving so your nervous system can down-regulate before your next conversation.`;
  }

  if (mode === 'brainstorm') {
    return `### Lateral Angles & Creative Thought Experiments

Sitting with your reflection on *"${quote}"*:

- **The Contrarian Angle**: *What if the resistance or friction you are experiencing is actually a healthy signal highlighting a boundary that is long overdue?*
- **The "Advice to a Friend" Test**: *If a respected peer described this exact scenario with ${entities}, what compassionate yet pragmatic counsel would you give them without hesitation?*
- **The 6-Month Horizon**: *Looking back at this moment from six months in the future, what choice will you be proudest of having made regarding how you held your composure and values?*`;
  }

  // Follow-up specific handling in multi-turn conversation
  if (isFollowUp) {
    const isControlQuestion = /control|within my control|what can i do|how can i|what is one thing|next step/i.test(latestPrompt);
    if (isControlQuestion) {
      return `### Exploring Your Sphere of Control

In response to your question: *"${quote}"*${priorUserQuote ? ` *(continuing our exploration of "${priorUserQuote}")*` : ''}

When we look at this situation through the lens of agency${name}:

**What Is Fully Within Your Control:**
1. **Your Micro-Boundaries**: The immediate friction in *"${priorUserQuote || quote}"* often feels heavy when we try to solve everything at once. You have 100% ownership over your response cadence, your personal boundaries, and the baseline standards you accept for yourself today.
2. **Your Attention & Pacing**: You cannot control unexpected external friction, but you can control whether you approach it with hurried reactivity or calm, steady composure.

**The Highest-Leverage Move Right Now:**
Focus solely on the next single 30-minute block. Decide what one outcome serves your peace of mind and complete only that before taking on anything else.

*Does narrowing your focus to just this one concrete element help reduce the immediate tension?*`;
    }

    return `### Deepening the Reflection: Next Layer

Responding to your follow-up: *"${quote}"*${priorUserQuote ? `\n\n*Building upon your earlier reflection on "${priorUserQuote}"*: ` : ''}

Taking this conversation one step deeper${name}:
- **The Core Shift**: In moving from the initial thought to your question *"${quote}"*, you are actively searching for leverage and actionable clarity rather than remaining in reactive friction.
- **Cognitive Perspective**: When dealing with ${entities}, the most sustainable answers come from aligning your actions with what you value most, even when circumstances around you are turbulent.

**Two Inquiries to Continue Unpacking:**
1. If you trusted your own judgment completely right now without seeking outside validation, what would you do?
2. What is one small expectation you can release today to give yourself more mental breathing room?

*Where would you like to direct our focus next?*`;
  }

  // DEFAULT 'reflect' MODE - HIGH COGNITIVE REASONING & RELEVANCE (First Turn)
  return `### Thoughtful Reflection & Perspective

Examining what you shared: *"${quote}"*

Navigating situations involving ${entities} often surfaces complex tensions between external demands and our internal equilibrium${name}. 

**Cognitive Analysis & Observations:**
- **Context & Subtext**: You are dealing with real friction here—not just an abstract thought. When situations like *"${quote}"* occur, they often challenge our sense of agency, fairness, or personal pacing.
- **The Underlying Dynamic**: ${
    analysis.theme === 'conflict_work'
      ? 'Notice the interplay between wanting your contributions acknowledged and the practical need to protect your professional boundaries. When others push timelines or criticism, the natural reaction is defensive fatigue.'
      : analysis.theme === 'burnout_stress'
      ? 'Notice if you are holding yourself to an unsustainable standard of carrying every detail. High-stakes pressure frequently blurs the line between high commitment and self-sacrificing overextension.'
      : analysis.theme === 'decision_crossroads'
      ? 'Crossroads often feel heavy because each path requires sacrificing something comfortable. Clarity comes not from finding a risk-free choice, but from choosing the challenge that aligns with your core identity.'
      : analysis.theme === 'progress_win'
      ? 'Pausing to actively consolidate this milestone prevents hedonic adaptation—the trap of immediately moving the goalposts before honoring the discipline it took to get here.'
      : 'Articulating this openly is how you transition from feeling overwhelmed by thoughts to actively understanding the mechanics behind them.'
  }
- **Reframing the Tension**: ${
    analysis.detectedDistortion === 'perfectionism'
      ? 'Consider whether you are expecting a flawless outcome in an inherently messy environment. Releasing the demand for perfection allows you to act with clarity.'
      : analysis.detectedDistortion === 'boundary_conflict'
      ? 'Setting a boundary is rarely comfortable in the moment, but the short-term discomfort of saying "no" or clarifying limits is far healthier than the long-term resentment of silent compliance.'
      : 'Your reaction here is a direct reflection of what you deeply value. Let that clarity guide your next step rather than reactive urgency.'
  }

**Perceptive Inquiries for You:**
1. **Core Value Alignment**: What is the most fundamental principle or boundary you want to hold firm in this situation?
2. **The Calmer Response**: If you stepped back and responded with unhurried composure rather than pressure, what is the single most constructive move you could make next?

*What feels like the most critical piece of this puzzle for you right now?*`;
}

function generateFallbackSummary(textContent: string, lang: string = 'en') {
  const words = textContent.trim().split(/\s+/).filter(Boolean).length;
  const lines = textContent.split('\n').filter((l) => l.trim().length > 0);
  const snippet = lines.find((l) => !l.startsWith('Assistant:') && !l.startsWith('model:')) || 'A personal reflection';
  const cleanSnippet = snippet.replace(/^(User:|assistant:|model:)\s*/i, '').trim();
  const analysis = analyzeTextSemantics(textContent);
  const tags = analysis.entities.length > 0 ? analysis.entities : ['reflection', 'mindset', 'clarity'];

  if (lang === 'es') {
    return {
      summary: cleanSnippet.length > 10 ? cleanSnippet.slice(0, 140) + (cleanSnippet.length > 140 ? '...' : '') : 'Una reflexión personal que captura momentos de pausa, autoconciencia y serenidad.',
      keyInsights: [
        `Exploración consciente de "${cleanSnippet.slice(0, 45)}..." a lo largo de ${words} palabras`,
        analysis.theme === 'progress_win' ? 'Reconocimiento explícito del progreso logrado y consolidación de metas' : 'Espacio dedicado a ordenar prioridades y clarificar emociones',
        'Compromiso constante con el bienestar personal y la introspección',
      ],
      detectedMood: analysis.sentiment === 'positive' ? 'Motivado y Enfocado' : analysis.sentiment === 'challenging' ? 'Reflexivo y Resiliente' : 'Sereno',
      brainstormIdeas: [
        'Realiza una pausa de 5 minutos para asentar tus ideas con calma',
        'Formula en una sola frase la prioridad esencial para tu tranquilidad',
        'Vuelve a leer esta reflexión en unos días para observar tu progreso',
      ],
      tags: tags,
      modelUsed: 'Inkwell Insights',
      isFallback: true,
    };
  }

  if (lang === 'fr') {
    return {
      summary: cleanSnippet.length > 10 ? cleanSnippet.slice(0, 140) + (cleanSnippet.length > 140 ? '...' : '') : 'Une réflexion personnelle consignant des instants de pause, de clarté et de sérénité.',
      keyInsights: [
        `Exploration attentive de "${cleanSnippet.slice(0, 45)}..." sur ${words} mots`,
        analysis.theme === 'progress_win' ? 'Célébration des étapes franchies et renforcement de l\'alignement personnel' : 'Temps dédié à l\'écoute de vos ressentis et à la clarification de vos priorités',
        'Engagement continu envers votre équilibre émotionnel et votre présence',
      ],
      detectedMood: analysis.sentiment === 'positive' ? 'Accompli et Inspiré' : 'Réflexif et Paisible',
      brainstormIdeas: [
        'Faites une courte pause au calme pour laisser vos pensées s\'apaiser',
        'Identifiez une action concrète et bienveillante pour aujourd\'hui',
        'Relisez cette réflexion prochainement pour mesurer l\'évolution de votre regard',
      ],
      tags: tags,
      modelUsed: 'Inkwell Insights',
      isFallback: true,
    };
  }

  if (lang === 'hi') {
    return {
      summary: cleanSnippet.length > 10 ? cleanSnippet.slice(0, 140) + (cleanSnippet.length > 140 ? '...' : '') : 'आत्म-चिंतन और मानसिक स्पष्टता की एक विचारशील प्रविष्टि।',
      keyInsights: [
        `"${cleanSnippet.slice(0, 40)}..." पर लगभग ${words} शब्दों में अपने विचारों का गहन अवलोकन`,
        analysis.theme === 'progress_win' ? 'आज की प्रगति को पहचानना और आत्मविश्वास को सुदृढ़ करना' : 'भावनाओं को समझने और प्राथमिकताओं को स्पष्ट करने का सार्थक समय',
        'दैनिक माइंडफुलनेस और आंतरिक शांति के प्रति निरंतर समर्पण',
      ],
      detectedMood: analysis.sentiment === 'positive' ? 'उत्साहित व संतुष्ट' : 'चिंतनशील व शांत',
      brainstormIdeas: [
        'थोड़ी देर टहलें या गहरी सांसें लेकर मन को विश्राम दें',
        'इस चिंतन से जुड़ी एक ऐसी बात लिखें जिसके लिए आप आभारी हैं',
        'कुछ दिनों बाद इसे पढ़कर अपने विचारों में आए बदलाव को देखें',
      ],
      tags: ['चिंतन', 'माइंडफुलनेस', 'डायरी'],
      modelUsed: 'Inkwell Insights',
      isFallback: true,
    };
  }

  if (lang === 'ta') {
    return {
      summary: cleanSnippet.length > 10 ? cleanSnippet.slice(0, 140) + (cleanSnippet.length > 140 ? '...' : '') : 'மன அமைதி, சுய விழிப்புணர்வு மற்றும் தெளிவை வெளிப்படுத்தும் ஒரு தனிப்பட்ட பதிவு.',
      keyInsights: [
        `"${cleanSnippet.slice(0, 40)}..." பற்றிய ${words} சொற்களில் உங்கள் உள்மன உணர்வுகளின் விரிவான வெளிப்பாடு`,
        analysis.theme === 'progress_win' ? 'இன்றைய முன்னேற்றத்தை உணர்ந்து தன்னம்பிக்கையை வளர்த்துக் கொள்ளுதல்' : 'முன்னுரிமைகளைத் தெளிவுபடுத்தி மன அமைதி பெற ஒதுக்கிய பயனுள்ள நேரம்',
        'தொடர்ச்சியான மனநலம் மற்றும் சுய முன்னேற்றத்திற்கான ஈடுபாடு',
      ],
      detectedMood: analysis.sentiment === 'positive' ? 'நம்பிக்கை மற்றும் நிறைவு' : 'ஆழ்ந்த சிந்தனை மற்றும் அமைதி',
      brainstormIdeas: [
        'மனதை அமைதிப்படுத்த ஒரு சிறிய நடைப்பயிற்சி அல்லது மூச்சுப்பயிற்சி செய்யுங்கள்',
        'இந்த சிந்தனையிலிருந்து நீங்கள் நன்றியுணர்வுடன் உணரும் ஒரு விஷயத்தை எழுதுங்கள்',
        'சில நாட்கள் கழித்து இதை மீண்டும் வாசித்து உங்கள் மாற்றத்தைக் கவனியுங்கள்',
      ],
      tags: ['பிரதிபலிப்பு', 'நினைவாற்றல்', 'டைரி'],
      modelUsed: 'Inkwell Insights',
      isFallback: true,
    };
  }

  return {
    summary: cleanSnippet.length > 10 ? cleanSnippet.slice(0, 140) + (cleanSnippet.length > 140 ? '...' : '') : 'A thoughtful personal reflection recording moments of pause, emotional awareness, and self-discovery.',
    keyInsights: [
      `In-depth exploration of "${cleanSnippet.slice(0, 50)}..." spanning ${words} words`,
      analysis.theme === 'progress_win' ? 'Active recognition of forward progress and intentional milestone consolidation' : 'Dedicated space to organize priorities and clarify emotional states',
      'Ongoing commitment to personal growth, mindfulness, and inner alignment',
    ],
    detectedMood: analysis.sentiment === 'positive' ? 'Accomplished & Grounded' : analysis.sentiment === 'challenging' ? 'Resilient & Thoughtful' : 'Calm & Reflective',
    brainstormIdeas: [
      'Take a short reflective pause to ground these realizations physically',
      'Write down one specific micro-habit that reinforces what you noticed today',
      'Revisit this journal entry in a few days to track how your perspective evolves',
    ],
    tags: tags,
    modelUsed: 'Inkwell Insights',
    isFallback: true,
  };
}

// Health Check API
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Reflect / Converse Endpoint
app.post('/api/gemini/reflect', async (req: Request, res: Response): Promise<void> => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = typeof body.mode === 'string' ? body.mode : 'reflect';
    const entryTitle = typeof body.entryTitle === 'string' ? body.entryTitle : '';
    const language = typeof body.language === 'string' ? body.language : 'en';
    const rawList = Array.isArray(body.messages) ? body.messages : (Array.isArray(body.history) ? body.history : []);
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    // Format contents with multi-turn history or messages list
    const rawContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const item of rawList) {
      if (!item) continue;
      const role = (item.role === 'model' || item.role === 'assistant') ? 'model' : 'user';
      let contentText = '';
      if (typeof item.content === 'string') {
        contentText = item.content.trim();
      } else if (typeof item.text === 'string') {
        contentText = item.text.trim();
      } else if (Array.isArray(item.parts) && item.parts[0]?.text) {
        contentText = item.parts[0].text.trim();
      }

      if (contentText) {
        rawContents.push({
          role,
          parts: [{ text: contentText }],
        });
      }
    }

    // If prompt is provided separately and not already the last message
    if (prompt) {
      const lastItem = rawContents[rawContents.length - 1];
      const isAlreadyLast = lastItem && lastItem.role === 'user' && lastItem.parts[0]?.text === prompt;
      if (!isAlreadyLast) {
        rawContents.push({
          role: 'user',
          parts: [{ text: prompt }],
        });
      }
    }

    const contents = sanitizeGeminiContents(rawContents);

    if (contents.length === 0 && !prompt) {
      res.status(400).json({ error: 'Prompt or conversation history is required.' });
      return;
    }

    const langName = language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : 'English';

    let systemInstruction = `You are Inkwell's Cognitive Reflection Companion—an exceptionally perceptive, empathetic, and intellectually rigorous AI thinking partner.
Your role is to deeply analyze the user's journal entries, thought logs, dilemmas, and experiences, demonstrating clear "thinking capability" and insightful reasoning.

Core Directives:
1. SPECIFICITY & GROUNDING: Always anchor your response directly in the specific details, named people, quotes, or dilemmas the user shared. Avoid generic conversational filler, hollow affirmations, or repetitive clichés.
2. COGNITIVE REASONING: Unpack the underlying dynamics, cognitive patterns, emotional tensions, and trade-offs in what was shared. Ask: *Why is this situation presenting friction or meaning for the user? What underlying values, expectations, or boundaries are interacting here?*
3. SOCRATIC INQUIRY: Pose 2 perceptive, high-leverage reflective questions that challenge assumptions and open up fresh clarity.
4. ACTIONABLE PERSPECTIVE: Offer a grounded mental model, re-framing angle, or micro-step tailored to their exact dilemma.
5. TONE: Warm, deeply attentive, psychologically astute, and composed. Never lecture or provide clinical diagnosis.

Language Directive:
- Always respond fluently and completely in ${langName}.`;

    if (mode === 'summarize') {
      systemInstruction += `\nMode: COGNITIVE DIGEST. Structure output with:
- Core Dilemma & Theme
- Underlying Pattern / Psychological Dynamic
- Notable Realization or Shift
- Recommended Reflection Focus`;
    } else if (mode === 'brainstorm') {
      systemInstruction += `\nMode: THOUGHT EXPERIMENTS & LATERAL ANGLES. Provide 3-4 distinct, creative, and constructive angles or counter-intuitive perspectives on the user's specific topic.`;
    } else if (mode === 'action_items') {
      systemInstruction += `\nMode: COGNITIVE STRATEGIES & NEXT STEPS. Extract 3 high-impact, prioritized, practical actions categorized by immediate grounding, clear communication/boundaries, and energy protection.`;
    }

    if (metadata.mood) {
      systemInstruction += `\nUser's stated emotional state: ${metadata.mood}.`;
    }
    if (entryTitle) {
      systemInstruction += `\nCurrent Entry Title: "${entryTitle}".`;
    }

    // Find the latest user message for prompt awareness in fallbacks
    let latestUserMsg = prompt;
    if (!latestUserMsg) {
      for (let i = contents.length - 1; i >= 0; i--) {
        if (contents[i].role === 'user' && contents[i].parts[0]?.text) {
          latestUserMsg = contents[i].parts[0].text;
          break;
        }
      }
    }
    const primaryUserPrompt = latestUserMsg || '';

    let text = '';
    let modelUsed = 'gemini-3.7-flash';
    let isFallback = false;
    let warning: string | undefined = undefined;
    let errorDetails: string | undefined = undefined;

    try {
      const result = await generateContentWithFallback({
        contents,
        systemInstruction,
        temperature: mode === 'brainstorm' ? 0.85 : 0.65,
      });
      text = result.text;
      modelUsed = result.modelUsed;
    } catch (genError: any) {
      console.error('[Gemini API Reflection Failed]:', genError?.message || genError);
      const errInfo = extractErrorSummary(genError);
      warning = errInfo.summary;
      errorDetails = errInfo.details;
      modelUsed = `Offline Reflection (${errInfo.summary})`;
      isFallback = true;

      // Transparent diagnostic notice banner so users are never misled
      const offlineNotice = `> ⚠️ **Gemini Live AI Notice: ${errInfo.summary}**
> *${errInfo.details}*

---

`;
      const fallbackAnalysis = generateMindfulFallbackReply(primaryUserPrompt, mode, metadata.mood, body.userName, language, rawContents.length, rawList);
      text = offlineNotice + fallbackAnalysis;
    }

    // Generate lightweight smart tags / detected mood suggestion if needed
    let detectedMood = metadata.mood;
    let suggestedTitle = entryTitle;

    // If there is no title yet or this is early in the entry, suggest a title and tags
    if (!isFallback && (!entryTitle || entryTitle === 'New Reflection') && primaryUserPrompt.length > 15) {
      try {
        const metaGen = await generateContentWithFallback({
          contents: `Based on this journal entry, provide a JSON object with:
1. "title": A short, elegant 3-6 word title in ${langName}.
2. "detectedMood": A single word describing the emotional tone (e.g. "Calm", "Reflective", "Optimistic", "Challenged", "Inspired", "Grateful", "Anxious").
3. "tags": An array of 2-4 lowercase topic tags.

User's entry:
"""
${primaryUserPrompt}
"""`,
          responseMimeType: 'application/json',
          temperature: 0.3,
        });

        const parsed = JSON.parse(metaGen.text);
        if (parsed.title) suggestedTitle = parsed.title;
        if (parsed.detectedMood && !detectedMood) detectedMood = parsed.detectedMood;
      } catch (metaErr) {
        // Non-fatal metadata extraction fallback
      }
    }

    res.json({
      reply: text,
      response: text,
      modelUsed,
      suggestedTitle,
      detectedMood,
      isFallback,
      warning,
      errorDetails,
    });
  } catch (error: any) {
    console.error('API /api/gemini/reflect error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate reflection response.',
    });
  }
});

// Summarize & Brainstorm Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const textContent = typeof body.textContent === 'string' ? body.textContent.trim() : '';
    const language = typeof body.language === 'string' ? body.language : 'en';

    if (!textContent) {
      res.status(400).json({ error: 'Journal text content is required for summarization.' });
      return;
    }

    const langName = language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : 'English';

    const prompt = `Analyze this journal entry and return a JSON object in ${langName} with:
- "summary": A well-crafted 2-3 sentence executive reflection summary in ${langName}.
- "keyInsights": Array of 3 key realizations or takeaways from the thoughts shared in ${langName}.
- "detectedMood": The primary emotional vibe/tone in one or two words.
- "brainstormIdeas": Array of 3 creative suggestions, questions to ponder, or next steps in ${langName}.
- "tags": Array of 3-5 lowercase categorization tags.

Journal text:
"""
${textContent}
"""`;

    try {
      const { text, modelUsed } = await generateContentWithFallback({
        contents: prompt,
        responseMimeType: 'application/json',
        systemInstruction: `You are an insightful analytical assistant. Output strictly valid JSON matching the requested schema in ${langName}.`,
        temperature: 0.5,
      });

      const parsed = JSON.parse(text);
      res.json({
        ...parsed,
        modelUsed,
        isFallback: false,
      });
    } catch (sumErr: any) {
      console.error('[Gemini Summarize API Failed]:', sumErr?.message || sumErr);
      const errInfo = extractErrorSummary(sumErr);
      const fallbackData = generateFallbackSummary(textContent, language);
      res.json({
        ...fallbackData,
        modelUsed: `Offline Summary (${errInfo.summary})`,
        isFallback: true,
        warning: errInfo.summary,
        errorDetails: errInfo.details,
      });
    }
  } catch (error: any) {
    console.error('API /api/gemini/summarize error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to summarize journal entry.',
    });
  }
});

// Audio Speech-to-Text Transcription Endpoint
app.post('/api/gemini/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'audio/webm';
    const language = typeof body.language === 'string' ? body.language : 'en';

    if (!audioBase64) {
      res.status(400).json({ error: 'Audio data (audioBase64) is required.' });
      return;
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const languageHint = language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : 'English or the user\'s spoken language';

    const transcriptionPrompt = `Listen to this audio clip and transcribe the spoken words accurately.
Guidelines:
- Transcribe in the original spoken language (${languageHint}).
- Output ONLY the exact transcribed text words.
- Do NOT output timestamps, formatting artifacts, quotes, or meta commentary like "Here is the transcription:".
- If no speech or only background silence is detected, return an empty string.`;

    try {
      const { text, modelUsed } = await generateContentWithFallback({
        models: TRANSCRIBE_FALLBACK_MODELS,
        contents: [
          {
            inlineData: {
              mimeType: mimeType.split(';')[0] || 'audio/webm',
              data: cleanBase64,
            },
          },
          {
            text: transcriptionPrompt,
          },
        ],
        temperature: 0.1,
      });

      const cleanText = (text || '').trim().replace(/^["']|["']$/g, '');

      res.json({
        transcription: cleanText,
        modelUsed,
      });
    } catch (transcribeError: any) {
      console.info('[Voice Transcription]: Audio transcription fallback.');
      res.json({
        transcription: '',
        modelUsed: 'none',
        warning: 'Voice transcription is temporarily unavailable. You can type your thoughts directly into the editor.',
      });
    }
  } catch (error: any) {
    console.error('API /api/gemini/transcribe error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to transcribe audio.',
    });
  }
});

// Google Calendar Events Proxy
app.get('/api/calendar/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string || '');

    if (!token) {
      res.status(401).json({ error: 'OAuth Bearer access token required for Google Calendar.' });
      return;
    }

    const timeMin = typeof req.query.timeMin === 'string' ? req.query.timeMin : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const timeMax = typeof req.query.timeMax === 'string' ? req.query.timeMax : new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    const gcalResponse = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!gcalResponse.ok) {
      const errText = await gcalResponse.text();
      console.warn(`[Google Calendar API] Upstream error status ${gcalResponse.status}: ${errText}`);
      res.status(gcalResponse.status).json({
        error: `Google Calendar API error (${gcalResponse.status})`,
        details: errText,
      });
      return;
    }

    const data: any = await gcalResponse.json();
    const items = Array.isArray(data.items) ? data.items : [];

    res.json({
      events: items,
      count: items.length,
    });
  } catch (error: any) {
    console.error('API /api/calendar/events error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to fetch Google Calendar events.',
    });
  }
});

// Helper to generate a grounded fallback day synthesis when Gemini API is offline
function sanitizeCleanText(val: any): string {
  if (!val || typeof val !== 'string') return '';
  return val
    .replace(/\u00a0/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, ' ')
    .replace(/\\\\/g, '')
    // Strip accidental leading markdown headers, bullets, or numbers
    .replace(/^(#+\s*|[-*•]\s*|\d+[\.\)]\s*)+/g, '')
    // Strip wrapping quotes
    .replace(/^["'`]+|["'`]+$/g, '')
    // Strip accidental markdown asterisks wrapping text like "**Hello**"
    .replace(/^\*+([^*]+)\*+$/g, '$1')
    .trim();
}

function generateFallbackDayReview(
  calendarEvents: any[],
  journalEntries: any[],
  dateStr: string,
  userName?: string
): any {
  const eventsCount = calendarEvents.length;
  const journalCount = journalEntries.length;
  const greetingName = userName ? userName : 'Friend';

  const eventTitles = calendarEvents.map((e) => `${e.startTimeFormatted || e.timeDisplay || ''} ${e.summary || 'Event'}`).filter(Boolean);
  const eventsListText = eventTitles.length > 0 ? eventTitles.join(', ') : 'open flow';

  const summary = `Today on ${dateStr}, your schedule centered around ${eventsCount > 0 ? `${eventsCount} scheduled milestones (${eventsListText})` : 'an unscheduled self-directed rhythm'}. You recorded ${journalCount > 0 ? `${journalCount} reflective journal logs` : 'moments of contemplation'}. You balanced active engagement with meaningful introspection.`;

  const breakdown = calendarEvents.map((e) => ({
    time: sanitizeCleanText(e.startTimeFormatted || e.timeDisplay) || 'Scheduled',
    event: sanitizeCleanText(e.summary) || 'Calendar Event',
    reflection: sanitizeCleanText(e.description ? `Focused on: ${e.description}` : 'Engaged with intentional presence during this session.'),
  }));

  const highlights = [
    eventsCount > 0 ? `Successfully navigated ${eventsCount} scheduled sessions including ${calendarEvents[0]?.summary || 'morning commitments'}.` : 'Maintained mindful flexibility throughout the day.',
    journalCount > 0 ? 'Documented key emotional signals and conscious reflections in Inkwell.' : 'Took deliberate pauses for self-awareness.',
    'Closed the day with mindful alignment between outer obligations and inner calm.',
  ];

  const dayTheme = 'Balanced Engagement & Purposeful Progress';
  const detectedMood = 'Focused & Grounded';
  const groundingThought = 'Celebrate both the tasks accomplished on your calendar and the quiet realizations captured in your thoughts.';
  const tomorrowIntention = 'Carry forward the momentum of today while holding space for intentional breath and rest.';

  const fullMarkdown = `### 🌅 Day Review: ${dateStr}

**Theme**: ${dayTheme}  
**Emotional Arc**: ${detectedMood}

#### 📝 Executive Day Summary
${summary}

#### 📅 Schedule & Timeline Reflections
${breakdown.map((e) => `- **${e.time}** — **${e.event}**\n  *${e.reflection}*`).join('\n\n') || '- *Open unscheduled day*'}

#### ✨ Key Realizations & Breakthroughs
${highlights.map((h) => `- ${h}`).join('\n')}

#### 🌿 Evening Grounding
> "${groundingThought}"

#### 🎯 Tomorrow's Intention
*${tomorrowIntention}*`;

  return {
    summary,
    fullMarkdown,
    dayTheme,
    detectedMood,
    keyHighlights: highlights,
    scheduleBreakdown: breakdown,
    groundingThought,
    tomorrowIntention,
    modelUsed: 'Inkwell Day Engine',
    isFallback: true,
  };
}

// Google Calendar + Journal Day Synthesis ("How was my day?")
app.post('/api/calendar/synthesize-day', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const dateStr = typeof body.date === 'string' ? body.date : 'Today';
    const calendarEvents: any[] = Array.isArray(body.calendarEvents) ? body.calendarEvents : [];
    const journalEntries: any[] = Array.isArray(body.journalEntries) ? body.journalEntries : [];
    const language = typeof body.language === 'string' ? body.language : 'en';
    const userName = typeof body.userName === 'string' ? body.userName : undefined;

    const langName = language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : 'English';

    // Format calendar events safely for LLM context
    const calendarFormatted = calendarEvents.map((ev, i) => {
      const time = ev.startTimeFormatted || ev.timeDisplay || 'Time unspecified';
      const summary = (ev.summary || 'Untitled Event').replace(/[<>]/g, '');
      const desc = ev.description ? ` (Details: ${(ev.description || '').replace(/[<>]/g, '').slice(0, 150)})` : '';
      const loc = ev.location ? ` [Location: ${(ev.location || '').replace(/[<>]/g, '')}]` : '';
      return `${i + 1}. ${time} — ${summary}${loc}${desc}`;
    }).join('\n');

    // Format journal entries safely for LLM context
    const journalFormatted = journalEntries.map((entry, i) => {
      const title = entry.title ? `"${entry.title}"` : `Entry #${i + 1}`;
      const text = (entry.text || '').replace(/[<>]/g, '').slice(0, 800);
      const mood = entry.mood ? ` [Mood: ${entry.mood}]` : '';
      return `--- Entry ${title}${mood} ---\n${text}`;
    }).join('\n\n');

    const prompt = `You are Inkwell's Master Day Synthesizer and Mindful Reflection Companion.
The user is asking: "How was my day?"

Context for ${dateStr}:
<calendar_schedule>
${calendarFormatted || 'No calendar events recorded for today (open schedule).'}
</calendar_schedule>

<journal_reflections>
${journalFormatted || 'No journal entries recorded for today.'}
</journal_reflections>

Task:
Analyze and synthesize the user's day by cross-referencing what was scheduled on their Google Calendar (e.g. meetings, classes, reviews, appointments) with what they actually experienced, felt, and reflected upon in their journal entries.

IMPORTANT FORMATTING RULES:
- Do NOT use markdown symbols, asterisks (** or *), or escape slashes (\\) inside string fields.
- Do NOT prefix "keyHighlights" with bullet points, hyphens, numbers, or dashes; return clean, natural prose statements.
- "dayTheme" should be a clean, inspiring title (4-8 words).
- "detectedMood" should be 1-2 words (e.g. "Focused & Grounded").
- "summary" should be a beautifully written 2-3 sentence executive synthesis in natural flowing text.
- "groundingThought" should be a gentle, warm closing insight without quote marks or asterisks.
- "tomorrowIntention" should be a concise, mindful intention for tomorrow.

Respond with a JSON object in ${langName} with keys:
1. "dayTheme": string
2. "detectedMood": string
3. "summary": string
4. "keyHighlights": array of 3-4 clean strings
5. "scheduleBreakdown": array of objects { "time": string, "event": string, "reflection": string }
6. "groundingThought": string
7. "tomorrowIntention": string
8. "fullMarkdown": string (A neatly structured Markdown presentation with headers, schedule bullets, and grounding block)`;

    try {
      const { text, modelUsed } = await generateContentWithFallback({
        contents: prompt,
        responseMimeType: 'application/json',
        systemInstruction: `You are Inkwell's Day Synthesizer. Connect Google Calendar schedules with personal journal reflections to provide empathetic, perceptive, and inspiring daily reviews. Answer the question "How was my day?" with neat formatting and warmth in ${langName}. Avoid markdown formatting tags inside plain string fields.`,
        temperature: 0.4,
      });

      const parsed = JSON.parse(text);

      const dayTheme = sanitizeCleanText(parsed.dayTheme) || 'Balanced Flow & Purpose';
      const detectedMood = sanitizeCleanText(parsed.detectedMood) || 'Grounded & Reflective';
      const summary = sanitizeCleanText(parsed.summary) || 'A meaningful day marked by conscious progress and personal reflection.';
      const groundingThought = sanitizeCleanText(parsed.groundingThought) || 'Rest peacefully knowing that each moment today nurtured your resilience.';
      const tomorrowIntention = sanitizeCleanText(parsed.tomorrowIntention) || 'Begin tomorrow with clarity, focus, and mindful calm.';

      const keyHighlights = (Array.isArray(parsed.keyHighlights) ? parsed.keyHighlights : [])
        .map(sanitizeCleanText)
        .filter(Boolean);

      const scheduleBreakdown = (Array.isArray(parsed.scheduleBreakdown) ? parsed.scheduleBreakdown : [])
        .map((item: any) => ({
          time: sanitizeCleanText(item.time) || 'Scheduled',
          event: sanitizeCleanText(item.event) || 'Milestone',
          reflection: sanitizeCleanText(item.reflection) || '',
        }))
        .filter((item: any) => Boolean(item.event));

      const cleanFullMarkdown = `### 🌅 Day Review: ${dateStr}

**Theme**: ${dayTheme}  
**Emotional Arc**: ${detectedMood}

#### 📝 Executive Day Summary
${summary}

#### 📅 Schedule & Timeline Reflections
${scheduleBreakdown.map((s: any) => `- **${s.time}** — **${s.event}**\n  *${s.reflection}*`).join('\n\n') || '- *Unscheduled self-directed day*'}

#### ✨ Key Realizations & Breakthroughs
${keyHighlights.map((h: string) => `- ${h}`).join('\n')}

#### 🌿 Evening Grounding
> "${groundingThought}"

#### 🎯 Tomorrow's Intention
*${tomorrowIntention}*`.trim();

      res.json({
        dayTheme,
        detectedMood,
        summary,
        keyHighlights,
        scheduleBreakdown,
        groundingThought,
        tomorrowIntention,
        fullMarkdown: cleanFullMarkdown,
        modelUsed,
        isFallback: false,
      });
    } catch (genErr: any) {
      console.error('[Gemini Day Synthesis Failed]:', genErr?.message || genErr);
      const errInfo = extractErrorSummary(genErr);
      const fallback = generateFallbackDayReview(calendarEvents, journalEntries, dateStr, userName);
      res.json({
        ...fallback,
        modelUsed: `Offline Day Synthesis (${errInfo.summary})`,
        isFallback: true,
        warning: errInfo.summary,
        errorDetails: errInfo.details,
      });
    }
  } catch (error: any) {
    console.error('API /api/calendar/synthesize-day error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to synthesize day.',
    });
  }
});

// Google Places API (New) Autocomplete Proxy with Key Isolation & Rate/Cost Protection
app.post('/api/places/autocomplete', async (req: Request, res: Response) => {
  try {
    const rawInput = req.body?.input;
    const input = typeof rawInput === 'string' ? rawInput.trim().slice(0, 150) : '';
    const sessionToken = req.body?.sessionToken || `session-${Date.now()}`;

    if (!input) {
      return res.json({ predictions: [] });
    }

    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.PLACES_API_KEY || '';

    if (placesApiKey) {
      try {
        // Call Google Places API (New) Autocomplete REST endpoint
        const placesRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': placesApiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
          },
          body: JSON.stringify({
            input,
            sessionToken,
          }),
        });

        if (placesRes.ok) {
          const placesData = await placesRes.json();
          const suggestions = (placesData.suggestions || []).map((s: any) => {
            const p = s.placePrediction;
            return {
              placeId: p?.placeId || p?.place || `place-${Math.random().toString(36).substr(2, 6)}`,
              name: p?.structuredFormat?.mainText?.text || p?.text?.text || input,
              formattedAddress: p?.text?.text || p?.structuredFormat?.secondaryText?.text || input,
              locality: p?.structuredFormat?.secondaryText?.text,
            };
          });

          return res.json({ predictions: suggestions });
        } else {
          console.warn('[Places API] Google Places API response status:', placesRes.status);
        }
      } catch (apiErr) {
        console.warn('[Places API] Call error, delegating to client fallback:', apiErr);
      }
    }

    return res.json({ predictions: [] });
  } catch (err: any) {
    console.error('API /api/places/autocomplete error:', err);
    res.status(500).json({ error: err?.message || 'Failed to autocomplete places' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.includes(path.sep + 'assets' + path.sep) || filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));

    // Prevent SPA fallback for missing assets or JS/CSS files so they do not return HTML with 200 MIME error
    app.get('/assets/*', (req: Request, res: Response) => {
      res.status(404).type('text/plain').send('Asset not found');
    });

    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
