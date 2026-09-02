import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Feather,
  Smile, 
  Tag, 
  BrainCircuit, 
  CheckSquare, 
  Lightbulb, 
  MessageSquare, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Loader2, 
  Plus, 
  X, 
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Download,
  Maximize2,
  Minimize2,
  Trash2,
  ChevronDown,
  MoreVertical,
  Sparkles,
  Pencil,
  TrendingUp,
  MapPin,
  CloudSun
} from 'lucide-react';
import { JournalEntry, JournalMessage, ReflectionMode, LocationMemory, WeatherData } from '../types';
import { saveJournalEntry } from '../lib/firestoreService';
import { fetchCurrentWeather } from '../lib/weatherService';
import { InsightsModal, InsightsData } from './InsightsModal';
import { ExportVaultModal } from './ExportVaultModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { LocationPickerModal } from './LocationPickerModal';
import { usePreferences } from '../context/PreferencesContext';

interface JournalEditorProps {
  userId: string;
  userName?: string;
  entry: JournalEntry;
  onEntryUpdated: (updated: JournalEntry) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenMoodTrends?: () => void;
}

// Sentence Case formatting helper for personalized greeting
function formatSentenceCaseName(raw?: string): string {
  if (!raw || !raw.trim()) return 'there';
  const cleaned = raw.trim();

  // Split on common delimiters (spaces, dots, underscores, hyphens)
  const tokens = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (tokens.length === 0) return 'there';

  // If first token is a common title, pick the next token
  let nameToken = tokens[0];
  if (tokens.length > 1 && /^(prof|professor|dr|mr|mrs|ms)$/i.test(tokens[0])) {
    nameToken = tokens[1];
  }

  // Handle single-word handles with prefixes like "professorpradeeps"
  if (/^professor/i.test(nameToken) && nameToken.length > 9) {
    let sub = nameToken.substring(9);
    if (sub.toLowerCase().endsWith('s') && sub.length > 3) {
      sub = sub.slice(0, -1);
    }
    if (sub) nameToken = sub;
  }

  // Remove any digits
  nameToken = nameToken.replace(/\d+/g, '');
  if (!nameToken) return 'there';

  // Return formatted sentence case (e.g. "Pradeep")
  return nameToken.charAt(0).toUpperCase() + nameToken.slice(1).toLowerCase();
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  userName,
  entry,
  onEntryUpdated,
  onDeleteEntry,
  focusMode = false,
  onToggleFocusMode,
  onOpenMoodTrends,
}) => {
  const { t, language, weatherEnabled } = usePreferences();
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('reflect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Weather state
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [showWeatherGeoBanner, setShowWeatherGeoBanner] = useState(false);
  const [, setWeatherFetchError] = useState<string | null>(null);

  // Voice dictation & recording state
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const baseTextRef = useRef<string>('');
  const speechReceivedRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<any>(null);
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(entry.title);

  // Modular Tag input state
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Insights Modal state
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback & Speech synthesis
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');

  // Location Picker Modal state
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  // Dropdown States for grouped options
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isModeOpen, setIsModeOpen] = useState(false);

  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const moodDropdownRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
      if (moodDropdownRef.current && !moodDropdownRef.current.contains(event.target as Node)) {
        setIsMoodOpen(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOptionsOpen(false);
        setIsMoodOpen(false);
        setIsModeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Preloaded voices for TTS
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commonMoods = [
    { label: t.moodCalm, emoji: '😌' },
    { label: t.moodGrateful, emoji: '🙏' },
    { label: t.moodOptimistic, emoji: '✨' },
    { label: t.moodInspired, emoji: '💡' },
    { label: t.moodReflective, emoji: '🤔' },
    { label: t.moodEnergized, emoji: '⚡' },
    { label: t.moodAnxious, emoji: '🌊' },
    { label: t.moodChallenged, emoji: '🧗' },
  ];

  const promptSuggestions = [
    t.promptUnpack,
    t.promptPatterns,
    t.promptBrainstorm,
    t.promptActionSteps,
  ];

  // Draft autosave & restore logic
  useEffect(() => {
    setTitleValue(entry.title);
    
    // Restore draft for this entry if available
    try {
      const savedDraft = localStorage.getItem(`inkwell_draft_${entry.id}`);
      if (savedDraft && savedDraft.trim() && !inputText) {
        setInputText(savedDraft);
      }
    } catch {
      // ignore
    }
  }, [entry.id, entry.title]);

  // Persist draft to local storage on typing
  useEffect(() => {
    try {
      if (inputText.trim()) {
        localStorage.setItem(`inkwell_draft_${entry.id}`, inputText);
      } else {
        localStorage.removeItem(`inkwell_draft_${entry.id}`);
      }
    } catch {
      // ignore
    }
  }, [inputText, entry.id]);

  // Preload TTS voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

  // Dynamically auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(34, Math.min(textareaRef.current.scrollHeight, 140))}px`;
    }
  }, [inputText]);

  // Ambient Weather: Quiet auto-fetch if permission is granted, or show gentle prompt if new reflection
  useEffect(() => {
    if (!weatherEnabled || entry.metadata?.weather) return;

    let isMounted = true;

    const checkAndAutoAttach = async () => {
      // 1. If entry has place coordinates, fetch weather without requiring device geolocation
      if (entry.metadata?.placeLocation?.lat && entry.metadata?.placeLocation?.lng) {
        const w = await fetchCurrentWeather(entry.metadata.placeLocation.lat, entry.metadata.placeLocation.lng);
        if (w && isMounted) {
          const updated: JournalEntry = {
            ...entry,
            metadata: {
              ...entry.metadata,
              weather: w,
            },
          };
          await persistEntry(updated);
        }
        return;
      }

      // 2. Check browser geolocation permission status
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                if (!isMounted) return;
                const w = await fetchCurrentWeather(pos.coords.latitude, pos.coords.longitude);
                if (w && isMounted) {
                  const updated: JournalEntry = {
                    ...entry,
                    metadata: {
                      ...entry.metadata,
                      weather: w,
                    },
                  };
                  await persistEntry(updated);
                }
              },
              () => {},
              { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false }
            );
          } else if (status.state === 'prompt') {
            try {
              const dismissed = localStorage.getItem('inkwell_weather_geo_dismissed');
              if (dismissed !== 'true' && entry.messages.length === 0) {
                setShowWeatherGeoBanner(true);
              }
            } catch {}
          }
        } catch {
          // Permissions API may not support geolocation query in older browsers
        }
      }
    };

    checkAndAutoAttach();

    return () => {
      isMounted = false;
    };
  }, [entry.id, weatherEnabled]);

  // Clean up all audio recording, playback & speech recognition resources
  const cleanupAudioResources = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setSpeakingMessageId(null);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, [entry.id, cleanupAudioResources]);

  // Helper to map app language to SpeechRecognition / TTS BCP-47 tag
  const getLanguageTag = (lang: string): string => {
    switch (lang) {
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'hi': return 'hi-IN';
      case 'ta': return 'ta-IN';
      case 'en':
      default: return 'en-US';
    }
  };

  // Convert Blob to Base64 String
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = (reader.result as string) || '';
        const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Toggle voice recognition dictation
  const toggleVoiceInput = async () => {
    // If Read Aloud is active, cancel it before starting voice dictation
    if (speakingMessageId) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
    }

    if (isListening) {
      setIsListening(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    setVoiceToast(null);
    baseTextRef.current = inputText;
    speechReceivedRef.current = false;
    setRecordingDuration(0);
    audioChunksRef.current = [];

    // 1. Request microphone access
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err: any) {
      console.warn('Microphone permission / access error:', err);
      setIsListening(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setVoiceToast('Microphone access denied. Please click the lock/settings icon in your browser URL bar to allow microphone access.');
      } else {
        setVoiceToast(t.speechNotSupported);
      }
      setTimeout(() => setVoiceToast(null), 5500);
      return;
    }

    // 2. Set up MediaRecorder for high-fidelity audio capture & Gemini fallback
    try {
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        // If web speech already transcribed the speech successfully into the box, no need to call Gemini STT
        if (speechReceivedRef.current && inputText.trim().length > (baseTextRef.current.trim().length)) {
          return;
        }

        if (chunks && chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          if (audioBlob.size > 300) {
            try {
              setIsTranscribing(true);
              const base64Data = await blobToBase64(audioBlob);
              const res = await fetch('/api/gemini/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioBase64: base64Data,
                  mimeType: audioBlob.type || 'audio/webm',
                  language,
                }),
              });

              if (res.ok) {
                const data = await res.json();
                if (data.transcription && data.transcription.trim()) {
                  const base = baseTextRef.current ? baseTextRef.current.trim() + ' ' : '';
                  const combined = (base + data.transcription.trim()).replace(/\s+/g, ' ');
                  setInputText(combined);
                  if (textareaRef.current) {
                    textareaRef.current.value = combined;
                    textareaRef.current.focus();
                  }
                }
              }
            } catch (transcribeErr) {
              console.warn('Gemini audio transcription fallback error:', transcribeErr);
            } finally {
              setIsTranscribing(false);
            }
          }
        }
      };

      mediaRecorder.start(250);
    } catch (recErr) {
      console.warn('MediaRecorder could not start:', recErr);
    }

    // 3. Start timer interval
    const startTimestamp = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTimestamp) / 1000));
    }, 1000);

    // 4. Concurrently initialize Web Speech API for instantaneous real-time transcription
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLanguageTag(language);

        recognition.onresult = (event: any) => {
          let finalTrans = '';
          let interimTrans = '';

          for (let i = 0; i < event.results.length; ++i) {
            const result = event.results[i];
            const transcript = result[0]?.transcript || '';
            if (result.isFinal) {
              finalTrans += (finalTrans ? ' ' : '') + transcript.trim();
            } else {
              interimTrans += (interimTrans ? ' ' : '') + transcript.trim();
            }
          }

          if (finalTrans || interimTrans) {
            speechReceivedRef.current = true;
          }

          const base = baseTextRef.current ? baseTextRef.current.trim() + ' ' : '';
          const transcriptPart = finalTrans + (interimTrans ? (finalTrans ? ' ' : '') + interimTrans : '');
          const combined = (base + transcriptPart).replace(/\s+/g, ' ');
          setInputText(combined);
          if (textareaRef.current) {
            textareaRef.current.value = combined;
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Web Speech API note:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (speechErr) {
        console.warn('Web Speech API initialization note:', speechErr);
      }
    }

    setIsListening(true);
  };

  // Persist entry changes to Firestore
  const persistEntry = async (updated: JournalEntry) => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      await saveJournalEntry(userId, updated);
      onEntryUpdated(updated);
      setSaveStatus('saved');
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveStatus('error');
      setErrorMessage('Failed to save to Firestore. Click retry to preserve your entries.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    const newTitle = titleValue.trim() || t.untitledReflection;
    if (newTitle !== entry.title) {
      const updated = { 
        ...entry, 
        title: newTitle,
        editedAt: Date.now()
      };
      await persistEntry(updated);
    }
  };

  const handleMoodSelect = async (mood?: string) => {
    const currentMood = entry.metadata?.mood;
    const newMood = mood === undefined || currentMood === mood ? undefined : mood;
    const updated: JournalEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        mood: newMood,
      },
      editedAt: Date.now(),
    };
    await persistEntry(updated);
  };

  const handleCopyAllReflection = () => {
    if (!entry.messages || entry.messages.length === 0) return;
    const fullText = entry.messages
      .map(m => `${m.role === 'user' ? (userName ? formatSentenceCaseName(userName) : 'Me') : 'Inkwell AI'}:\n${m.content}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(fullText);
    setIsOptionsOpen(false);
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const cleanTag = newTag.trim().replace(/^#/, '');
    const currentTags = entry.metadata?.tags || [];
    if (!currentTags.includes(cleanTag)) {
      const updatedTags = [...currentTags, cleanTag];
      const updated: JournalEntry = {
        ...entry,
        metadata: {
          ...entry.metadata,
          tags: updatedTags,
        },
        editedAt: Date.now(),
      };
      await persistEntry(updated);
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const currentTags = entry.metadata?.tags || [];
    const updatedTags = currentTags.filter(t => t !== tagToRemove);
    const updated: JournalEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        tags: updatedTags,
      },
      editedAt: Date.now(),
    };
    await persistEntry(updated);
  };

  // Location Memory Handler
  const handleSelectLocation = async (placeLocation: LocationMemory | null) => {
    const updated: JournalEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        placeLocation: placeLocation || null,
      },
      editedAt: Date.now(),
    };
    await persistEntry(updated);

    // If a place with coordinates was attached and entry has no weather, offer or auto-fetch weather
    if (weatherEnabled && !entry.metadata?.weather && placeLocation?.lat && placeLocation?.lng) {
      handleAttachWeather({ lat: placeLocation.lat, lng: placeLocation.lng });
    }
  };

  // Weather Attachment Handlers
  const handleAttachWeather = async (customCoords?: { lat: number; lng: number }) => {
    if (isFetchingWeather) return;
    setIsFetchingWeather(true);
    setWeatherFetchError(null);

    try {
      let lat = customCoords?.lat;
      let lng = customCoords?.lng;

      // 1. Fallback to attached place coordinates if available
      if ((lat === undefined || lng === undefined) && entry.metadata?.placeLocation?.lat && entry.metadata?.placeLocation?.lng) {
        lat = entry.metadata.placeLocation.lat;
        lng = entry.metadata.placeLocation.lng;
      }

      // 2. Fallback to device location
      if (lat === undefined || lng === undefined) {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          throw new Error('Geolocation is not supported by your browser.');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 600000,
            enableHighAccuracy: false,
          });
        });

        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      const weatherData = await fetchCurrentWeather(lat, lng);
      if (!weatherData) {
        throw new Error('Could not retrieve current weather conditions from Open-Meteo.');
      }

      const updated: JournalEntry = {
        ...entry,
        metadata: {
          ...entry.metadata,
          weather: weatherData,
        },
        editedAt: Date.now(),
      };
      await persistEntry(updated);
      setShowWeatherGeoBanner(false);
    } catch (err: any) {
      console.warn('Weather attachment failed:', err);
      if (err?.code === 1 /* PERMISSION_DENIED */) {
        setShowWeatherGeoBanner(false);
        try {
          localStorage.setItem('inkwell_weather_geo_dismissed', 'true');
        } catch {}
      } else {
        setWeatherFetchError(err?.message || 'Could not fetch weather.');
        setTimeout(() => setWeatherFetchError(null), 4000);
      }
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const handleRemoveWeather = async () => {
    const updated: JournalEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        weather: null,
      },
      editedAt: Date.now(),
    };
    await persistEntry(updated);
  };

  const handleAcceptWeatherGeo = () => {
    handleAttachWeather();
  };

  const handleDeclineWeatherGeo = () => {
    setShowWeatherGeoBanner(false);
    try {
      localStorage.setItem('inkwell_weather_geo_dismissed', 'true');
    } catch {}
  };

  // Message Editing Handlers
  const handleStartEditMessage = (msg: JournalMessage) => {
    setEditingMessageId(msg.id);
    setEditMessageText(msg.content);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleSaveMessageEdit = async (messageId: string, regenerateAiResponse = false) => {
    if (!editMessageText.trim()) return;

    const msgIndex = entry.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const now = Date.now();
    const updatedMessage: JournalMessage = {
      ...entry.messages[msgIndex],
      content: editMessageText.trim(),
      editedAt: now,
    };

    if (!regenerateAiResponse) {
      // Default: Update wording only, keep subsequent conversations intact
      const updatedMessages = [...entry.messages];
      updatedMessages[msgIndex] = updatedMessage;

      const updatedEntry: JournalEntry = {
        ...entry,
        messages: updatedMessages,
        editedAt: now,
        updatedAt: now,
      };

      setEditingMessageId(null);
      setEditMessageText('');
      await persistEntry(updatedEntry);
    } else {
      // Regenerate: Update message, truncate conversation right after this message, and generate fresh Gemini reply
      const truncatedMessages = [...entry.messages.slice(0, msgIndex), updatedMessage];

      const updatedEntry: JournalEntry = {
        ...entry,
        messages: truncatedMessages,
        editedAt: now,
        updatedAt: now,
      };

      setEditingMessageId(null);
      setEditMessageText('');
      await persistEntry(updatedEntry);

      try {
        setIsGenerating(true);
        const res = await fetch('/api/gemini/reflect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: truncatedMessages,
            mode: updatedMessage.mode || selectedMode,
            language,
            userName,
            entryTitle: updatedEntry.title,
            metadata: updatedEntry.metadata,
          }),
        });

        if (!res.ok) {
          throw new Error('Could not reach Gemini reflection service.');
        }

        const data = await res.json();
        if (data.isFallback && data.warning) {
          setErrorMessage(`${data.warning}: ${data.errorDetails || 'Live Gemini API unavailable. Displaying offline reflection.'}`);
        }

        const assistantMessage: JournalMessage = {
          id: `msg-gemini-${Date.now()}`,
          role: 'model',
          content: data.reply || data.response || 'Thank you for sharing your thoughts.',
          timestamp: Date.now(),
          mode: updatedMessage.mode || selectedMode,
          isFallback: data.isFallback,
          modelUsed: data.modelUsed,
        };

        const finalUpdated: JournalEntry = {
          ...updatedEntry,
          messages: [...truncatedMessages, assistantMessage],
          summary: data.suggestedSummary || updatedEntry.summary,
          metadata: {
            ...updatedEntry.metadata,
            mood: data.detectedMood || updatedEntry.metadata?.mood,
            tags: Array.from(new Set([...(updatedEntry.metadata?.tags || []), ...(data.tags || [])])),
          },
        };

        await persistEntry(finalUpdated);
      } catch (err: any) {
        console.error('Gemini regenerate error:', err);
        setErrorMessage(err.message || 'Error communicating with Gemini.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isGenerating) return;

    // Clear local draft when sending
    try {
      localStorage.removeItem(`inkwell_draft_${entry.id}`);
    } catch {
      // ignore
    }

    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
      mode: selectedMode,
    };

    const newMessages = [...entry.messages, userMessage];

    // Optimistically update entry title if it's the very first message
    let newTitle = entry.title;
    if (entry.messages.length === 0 && entry.title === 'New Reflection' && textToSend.length > 0) {
      const firstLine = textToSend.split('\n')[0].trim();
      newTitle = firstLine.length > 120 ? firstLine.slice(0, 120).trim() : firstLine;
    }

    const optimisticEntry: JournalEntry = {
      ...entry,
      title: newTitle,
      messages: newMessages,
    };

    setInputText('');
    await persistEntry(optimisticEntry);

    // Call Gemini API through backend route
    try {
      setIsGenerating(true);
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          mode: selectedMode,
          language,
          userName,
          entryTitle: optimisticEntry.title,
          metadata: optimisticEntry.metadata,
        }),
      });

      if (!res.ok) {
        throw new Error('Could not reach Gemini reflection service.');
      }

      const data = await res.json();
      if (data.isFallback && data.warning) {
        setErrorMessage(`${data.warning}: ${data.errorDetails || 'Live Gemini API unavailable. Displaying offline reflection.'}`);
      }

      const assistantMessage: JournalMessage = {
        id: `msg-gemini-${Date.now()}`,
        role: 'model',
        content: data.reply || data.response || 'Thank you for sharing your thoughts.',
        timestamp: Date.now(),
        mode: selectedMode,
        isFallback: data.isFallback,
        modelUsed: data.modelUsed,
      };

      const finalUpdated: JournalEntry = {
        ...optimisticEntry,
        messages: [...newMessages, assistantMessage],
        summary: data.suggestedSummary || optimisticEntry.summary,
        metadata: {
          ...optimisticEntry.metadata,
          mood: data.detectedMood || optimisticEntry.metadata?.mood,
          tags: Array.from(new Set([...(optimisticEntry.metadata?.tags || []), ...(data.tags || [])])),
        },
      };

      await persistEntry(finalUpdated);
    } catch (err: any) {
      console.error('Gemini call error:', err);
      setErrorMessage(err.message || 'Error communicating with Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummarizeEntry = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;
    try {
      setIsSummarizing(true);
      const allText = entry.messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
      
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: allText, language }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate summary.');
      }

      const data = await res.json();
      setInsightsData(data);
      setShowInsightsModal(true);

      // Also persist the generated summary to the entry
      if (data.summary) {
        const updated: JournalEntry = {
          ...entry,
          summary: data.summary,
          metadata: {
            ...entry.metadata,
            mood: data.detectedMood || entry.metadata?.mood,
            tags: Array.from(new Set([...(entry.metadata?.tags || []), ...(data.tags || [])])),
          },
        };
        await persistEntry(updated);
      }
    } catch (err: any) {
      console.error('Summarize error:', err);
      setErrorMessage(err.message || 'Could not generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Strip Markdown symbols for natural audio speech synthesis
  const cleanMarkdownForSpeech = (markdown: string): string => {
    return markdown
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/>\s+/g, '')
      .replace(/---+/g, '')
      .trim();
  };

  // Toggle Read Aloud for any individual message (Fix for Non-English and TTS locale matching)
  const handleToggleReadAloud = (messageId: string, content: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceToast(t.ttsNotSupported);
      setTimeout(() => setVoiceToast(null), 4000);
      return;
    }

    const synth = window.speechSynthesis;

    // If currently playing this exact message, stop it
    if (speakingMessageId === messageId) {
      synth.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Cancel any previous speech playback and disable listening
    synth.cancel();
    if (isListening) {
      toggleVoiceInput();
    }

    const cleanText = cleanMarkdownForSpeech(content);
    if (!cleanText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLangTag = getLanguageTag(language);
      utterance.lang = targetLangTag;
      utterance.rate = 0.96;
      utterance.pitch = 1.0;

      // Select localized voice matching the selected language
      const voices = availableVoices.length > 0 ? availableVoices : synth.getVoices();
      if (voices && voices.length > 0) {
        // Priority 1: Exact tag match (e.g., 'ta-IN', 'hi-IN', 'es-ES', 'fr-FR')
        let matched = voices.find(v => v.lang.toLowerCase() === targetLangTag.toLowerCase());
        
        // Priority 2: Primary prefix match (e.g. 'ta', 'hi', 'es', 'fr')
        if (!matched) {
          matched = voices.find(v => v.lang.toLowerCase().startsWith(language.toLowerCase()));
        }

        // Priority 3: Name match on language
        if (!matched) {
          const langNames: Record<string, string[]> = {
            hi: ['hindi', 'हिन्दी', 'hemant', 'kalpana'],
            ta: ['tamil', 'தமிழ்', 'valluvar'],
            es: ['spanish', 'español', 'raul', 'sabina', 'monica'],
            fr: ['french', 'français', 'julie', 'paul', 'hortense'],
            en: ['english', 'david', 'zira', 'samantha', 'google']
          };
          const searchTokens = langNames[language] || [];
          matched = voices.find(v => searchTokens.some(tok => v.name.toLowerCase().includes(tok)));
        }

        if (matched) {
          utterance.voice = matched;
        } else if (language !== 'en') {
          console.warn(`[TTS] No native voice found for locale: ${language} (${targetLangTag}) on this device`);
          setVoiceToast(t.voiceNotAvailable);
          setTimeout(() => setVoiceToast(null), 5000);
        }
      }

      utterance.onstart = () => {
        setSpeakingMessageId(messageId);
      };

      utterance.onend = () => {
        setSpeakingMessageId(null);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        setSpeakingMessageId(null);
      };

      synth.speak(utterance);
    } catch (synthErr) {
      console.warn('Failed to start speech synthesis:', synthErr);
      setSpeakingMessageId(null);
      setVoiceToast(t.ttsNotSupported);
      setTimeout(() => setVoiceToast(null), 4000);
    }
  };

  const handleConfirmDeleteCurrent = async () => {
    try {
      setIsDeleting(true);
      await onDeleteEntry(entry.id);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`flex-1 min-h-0 flex flex-col h-full theme-bg-app theme-text-primary overflow-hidden transition-colors ${focusMode ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Journal Header & Metadata Bar */}
      <div className="relative z-30 p-2.5 sm:p-4 border-b theme-border theme-bg-surface backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Title Area */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 w-full max-w-md">
                <input
                  id="input-entry-title"
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') {
                      setTitleValue(entry.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="w-full px-2.5 py-1 text-sm sm:text-base font-gemini-display font-bold theme-bg-surface border border-[#1A73E8] dark:border-[#E8A33D] rounded-xl theme-text-primary focus:outline-none ring-2 ring-[#1A73E8]/20"
                />
                <button
                  onClick={handleTitleSubmit}
                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] text-xs font-bold transition-all shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <div 
                className="relative flex items-center gap-1.5 group cursor-pointer min-w-0" 
                onClick={() => setIsEditingTitle(true)}
              >
                <h2 
                  title={entry.title || t.untitledReflection}
                  className="text-sm sm:text-lg font-gemini-display font-bold theme-text-primary tracking-tight truncate hover:theme-accent-text transition-colors"
                >
                  {entry.title || t.untitledReflection}
                </h2>
                <span className="text-[10px] theme-text-secondary opacity-0 group-hover:opacity-100 transition-opacity theme-bg-subtle px-1.5 py-0.5 rounded-full border theme-border hidden sm:inline shrink-0">
                  Edit
                </span>

                {/* Floating Full Title Tooltip on Hover */}
                <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-50 p-2.5 max-w-sm sm:max-w-md w-max rounded-xl theme-bg-surface border theme-border shadow-2xl backdrop-blur-md pointer-events-none transition-all animate-in fade-in zoom-in-95">
                  <div className="text-[9px] font-bold uppercase tracking-wider theme-accent-text mb-0.5 flex items-center gap-1">
                    <span>Full Reflection Title</span>
                  </div>
                  <div className="text-xs font-semibold theme-text-primary leading-snug break-words">
                    {entry.title || t.untitledReflection}
                  </div>
                  <div className="mt-1 text-[9px] theme-text-secondary">
                    Click to edit title
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Toolbar Actions: Save status, Insights & Options Dropdown */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Edited badge if modified */}
            {entry.editedAt && (
              <div 
                title={`Modified on ${new Date(entry.editedAt).toLocaleDateString()} at ${new Date(entry.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] theme-bg-subtle theme-text-secondary border theme-border font-medium shadow-2xs"
              >
                <Pencil className="w-2.5 h-2.5 opacity-70 theme-accent-text" />
                <span>{t.edited}</span>
              </div>
            )}

            {/* Persistence state badge */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs theme-bg-subtle border theme-border shadow-xs">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 theme-accent-text animate-spin shrink-0" />
                  <span className="theme-accent-text font-medium text-[10px] sm:text-[11px] hidden xs:inline">{t.saveStatusSaving}</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="text-rose-500 font-medium text-[10px] sm:text-[11px] hidden xs:inline">{t.saveStatusError}</span>
                  <button
                    onClick={() => persistEntry(entry)}
                    className="ml-0.5 theme-accent-text underline hover:opacity-80 text-[10px] sm:text-[11px]"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="theme-text-secondary font-medium text-[10px] sm:text-[11px] hidden sm:inline">{t.saveStatusSaved}</span>
                </>
              )}
            </div>

            {/* Summarize & Insights primary button - always present for discoverability */}
            <button
              id="btn-summarize-insights"
              onClick={handleSummarizeEntry}
              disabled={isSummarizing || entry.messages.length === 0}
              title={
                entry.messages.length === 0
                  ? "Write thoughts or start a reflection to extract AI insights"
                  : "Extract summary & mindfulness insights"
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 hover:from-blue-500/20 hover:via-purple-500/20 hover:to-pink-500/20 theme-accent-text border border-blue-500/20 dark:border-amber-500/30 transition-all active:scale-95 disabled:opacity-40 shadow-2xs"
            >
              {isSummarizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BrainCircuit className="w-3.5 h-3.5" />
              )}
              <span>{t.insights || 'Insights'}</span>
            </button>

            {/* Grouped More Actions Dropdown */}
            <div className="relative" ref={optionsMenuRef}>
              <button
                id="btn-more-options-dropdown"
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                title="More Reflection Options"
                className={`p-1.5 rounded-full border transition-all active:scale-95 ${
                  isOptionsOpen
                    ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] border-transparent shadow-xs'
                    : 'theme-bg-subtle hover:theme-bg-hover theme-text-secondary hover:theme-text-primary theme-border'
                }`}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isOptionsOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-52 p-1.5 rounded-2xl theme-bg-surface border theme-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 theme-text-secondary">
                    Reflection Actions
                  </div>

                  {/* Export */}
                  <button
                    id="btn-opt-export"
                    onClick={() => {
                      setShowExportModal(true);
                      setIsOptionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors"
                  >
                    <Download className="w-4 h-4 theme-accent-text shrink-0" />
                    <div>
                      <div className="font-semibold">{t.export}</div>
                      <div className="text-[10px] theme-text-secondary">PDF, Markdown, Text, JSON</div>
                    </div>
                  </button>

                  {/* Mood Trends */}
                  {onOpenMoodTrends && (
                    <button
                      id="btn-opt-mood-trends"
                      onClick={() => {
                        onOpenMoodTrends();
                        setIsOptionsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-[#1A73E8] dark:text-[#E8A33D] shrink-0" />
                      <div>
                        <div className="font-semibold">{t.moodTrends}</div>
                        <div className="text-[10px] theme-text-secondary">Timeline & frequency patterns</div>
                      </div>
                    </button>
                  )}

                  {/* Focus Mode */}
                  {onToggleFocusMode && (
                    <button
                      id="btn-opt-focus-mode"
                      onClick={() => {
                        onToggleFocusMode();
                        setIsOptionsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors"
                    >
                      {focusMode ? (
                        <Minimize2 className="w-4 h-4 theme-accent-text shrink-0" />
                      ) : (
                        <Maximize2 className="w-4 h-4 theme-accent-text shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold">{focusMode ? t.exitFocusMode : t.focusMode}</div>
                        <div className="text-[10px] theme-text-secondary">{focusMode ? 'Return to normal view' : 'Distraction-free mode'}</div>
                      </div>
                    </button>
                  )}

                  {/* Copy All */}
                  {entry.messages.length > 0 && (
                    <button
                      id="btn-opt-copy-all"
                      onClick={handleCopyAllReflection}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left theme-text-primary hover:theme-bg-subtle transition-colors"
                    >
                      <Copy className="w-4 h-4 theme-accent-text shrink-0" />
                      <div>
                        <div className="font-semibold">Copy Dialogue</div>
                        <div className="text-[10px] theme-text-secondary">Copy all text to clipboard</div>
                      </div>
                    </button>
                  )}

                  <div className="border-t theme-border my-1" />

                  {/* Delete */}
                  <button
                    id="btn-opt-delete"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setIsOptionsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-semibold">{t.deleteEntry}</div>
                      <div className="text-[10px] opacity-80">Permanent removal</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Bar: Mood Dropdown and Tags */}
        <div id="journal-meta-toolbar" className="mt-2 pt-2 sm:mt-3 sm:pt-2.5 border-t theme-border flex items-center justify-between gap-2 text-xs">
          {/* Mood Dropdown and Location Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mood Dropdown Selector */}
            <div className="relative shrink-0" ref={moodDropdownRef}>
            {(() => {
              const isUnsetWithContent = !entry.metadata?.mood && (entry.messages.length > 0 || inputText.trim().length > 20);
              return (
                <button
                  id="btn-mood-dropdown"
                  onClick={() => setIsMoodOpen(!isMoodOpen)}
                  title={
                    entry.metadata?.mood
                      ? `Selected Mood: ${entry.metadata.mood}`
                      : isUnsetWithContent
                      ? 'Nudge: Select how you felt during this reflection to enable mood tracking & search filters'
                      : t.moodSelect
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 shadow-2xs ${
                    entry.metadata?.mood
                      ? 'bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] border-[#1A73E8]/30 dark:border-[#E8A33D]/30'
                      : isUnsetWithContent
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/15 ring-2 ring-amber-500/20'
                      : 'theme-bg-subtle hover:theme-bg-hover theme-text-secondary hover:theme-text-primary theme-border'
                  }`}
                >
                  {isUnsetWithContent ? (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                  ) : (
                    <Smile className="w-3.5 h-3.5 theme-accent-text" />
                  )}
                  <span>
                    {entry.metadata?.mood ? (
                      <>
                        <span className="mr-1">{commonMoods.find(m => m.label === entry.metadata?.mood)?.emoji || '✨'}</span>
                        <span className="font-semibold">{entry.metadata.mood}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.moodSelect}</span>
                        {isUnsetWithContent && (
                          <span className="text-[10px] opacity-80 font-normal hidden sm:inline ml-0.5">
                            (optional)
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoodOpen ? 'rotate-180' : ''}`} />
                </button>
              );
            })()}

            {isMoodOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-56 p-2 rounded-2xl theme-bg-surface border theme-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 theme-text-secondary">
                  {t.moodSelect}
                </div>
                <div className="grid grid-cols-2 gap-1 my-1">
                  {commonMoods.map((mood) => {
                    const isSelected = entry.metadata?.mood === mood.label;
                    return (
                      <button
                        key={mood.label}
                        onClick={() => {
                          handleMoodSelect(mood.label);
                          setIsMoodOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-semibold'
                            : 'hover:theme-bg-subtle theme-text-primary'
                        }`}
                      >
                        <span className="text-sm">{mood.emoji}</span>
                        <span className="truncate">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
                {entry.metadata?.mood && (
                  <button
                    onClick={() => {
                      handleMoodSelect(undefined);
                      setIsMoodOpen(false);
                    }}
                    className="w-full mt-1 pt-1.5 border-t theme-border text-[11px] text-center text-rose-500 hover:theme-bg-subtle py-1 rounded-lg transition-colors font-medium"
                  >
                    Clear Mood
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Weather Display / Attachment (Open-Meteo) */}
          {weatherEnabled && (
            <div id="container-weather-bar" className="flex items-center gap-1.5 shrink-0 pl-1">
              {entry.metadata?.weather ? (
                <div
                  id="chip-attached-weather"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-medium shadow-2xs group"
                  title={`Ambient Weather: ${entry.metadata.weather.condition} · ${entry.metadata.weather.temperature}°C · ${entry.metadata.weather.humidity}% humidity${entry.metadata.weather.isBackfilled ? ' (Historical Archive)' : ''}`}
                >
                  <span className="text-sm leading-none" role="img" aria-label={entry.metadata.weather.condition}>
                    {entry.metadata.weather.conditionEmoji || '⛅'}
                  </span>
                  <span className="font-semibold tracking-tight">
                    {entry.metadata.weather.temperature}°C
                  </span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">
                    · {entry.metadata.weather.humidity}% humidity
                  </span>
                  <button
                    id="btn-remove-weather-chip"
                    onClick={handleRemoveWeather}
                    className="opacity-60 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5 rounded-full hover:bg-rose-500/10 shrink-0 ml-0.5"
                    title="Remove weather from this reflection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-add-weather"
                  onClick={() => handleAttachWeather()}
                  disabled={isFetchingWeather}
                  title="Attach current ambient weather (Open-Meteo). Private & derived conditions only."
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium theme-text-secondary hover:text-sky-600 dark:hover:text-sky-400 hover:theme-bg-subtle border border-transparent hover:theme-border transition-colors whitespace-nowrap"
                >
                  {isFetchingWeather ? (
                    <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />
                  ) : (
                    <CloudSun className="w-3.5 h-3.5 text-sky-600/70 dark:text-sky-400/70" />
                  )}
                  <span className="hidden xs:inline">Weather</span>
                </button>
              )}
            </div>
          )}

          {/* Location Memory (Google Places - Opt-in) */}
          <div id="container-location-bar" className="flex items-center gap-1.5 shrink-0 pl-1">
            {entry.metadata?.placeLocation ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-medium shadow-2xs group">
                <button
                  onClick={() => setLocationPickerOpen(true)}
                  className="flex items-center gap-1.5 hover:underline max-w-[140px] sm:max-w-[200px] truncate"
                  title={`Attached Place: ${entry.metadata.placeLocation.name} (${entry.metadata.placeLocation.formattedAddress}). Click to change.`}
                  id="btn-edit-attached-location"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{entry.metadata.placeLocation.name}</span>
                </button>
                <button
                  onClick={() => handleSelectLocation(null)}
                  className="hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-rose-500/10 shrink-0 ml-0.5"
                  title="Remove location from this reflection"
                  id="btn-remove-location-chip"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                id="btn-add-location"
                onClick={() => setLocationPickerOpen(true)}
                title="Attach an optional real place to this reflection (Google Places). Fully private & opt-in."
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium theme-text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 hover:theme-bg-subtle border border-transparent hover:theme-border transition-colors whitespace-nowrap"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400/70" />
                <span className="hidden xs:inline">Add Location</span>
                <span className="xs:hidden">Location</span>
              </button>
            )}
          </div>
        </div>

          {/* Modular Tags */}
          <div id="container-tags-bar" className="flex items-center gap-1.5 shrink-0 pl-2 border-l theme-border">
            <Tag className="w-3 h-3 theme-text-secondary shrink-0" />
            {entry.metadata?.tags?.map((tg) => (
              <span
                key={tg}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full theme-bg-subtle theme-text-secondary text-[10px] sm:text-[11px] border theme-border whitespace-nowrap shrink-0"
              >
                <span>#{tg}</span>
                <button
                  onClick={() => handleRemoveTag(tg)}
                  className="hover:text-rose-500 transition-colors shrink-0"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}

            {showTagInput ? (
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  placeholder={t.enterTagPlaceholder}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setShowTagInput(false);
                  }}
                  autoFocus
                  className="px-2 py-0.5 text-[10px] sm:text-[11px] theme-bg-surface border border-[#1A73E8] dark:border-[#E8A33D] rounded-full theme-text-primary w-20 sm:w-24 focus:outline-none"
                />
                <button onClick={handleAddTag} className="theme-accent-text">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                id="btn-add-tag"
                onClick={() => setShowTagInput(true)}
                className="text-[10px] sm:text-[11px] font-medium theme-text-secondary hover:theme-accent-text flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:theme-bg-subtle border border-transparent hover:theme-border transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3 h-3" /> {t.addTag}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weather Geolocation Gentle Permission Banner */}
      {showWeatherGeoBanner && weatherEnabled && !entry.metadata?.weather && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          id="banner-weather-geo-prompt"
          className="px-4 py-2 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-900/50 text-sky-900 dark:text-sky-200 text-xs flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CloudSun className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="truncate sm:whitespace-normal font-medium">
              Inkwell can add local weather to your reflections — allow location access?
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-allow-weather-geo"
              onClick={handleAcceptWeatherGeo}
              disabled={isFetchingWeather}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors active:scale-95 flex items-center gap-1"
            >
              {isFetchingWeather ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              <span>Allow</span>
            </button>
            <button
              id="btn-decline-weather-geo"
              onClick={handleDeclineWeatherGeo}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-200/50 dark:hover:bg-sky-900/50 transition-colors"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/70 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Stream Container (Reading Canvas) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-6 space-y-2.5 sm:space-y-4">
        {entry.messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-2 sm:py-6"
          >
            <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white mb-2 sm:mb-4 shadow-md shadow-blue-500/15">
              <Feather className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            
            <h3 className="text-xl sm:text-3xl font-gemini-display font-bold tracking-tight">
              <span className="gemini-gradient-text">
                {`Hello, ${formatSentenceCaseName(userName)}`}
              </span>
            </h3>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm theme-text-secondary leading-relaxed max-w-md">
              Share what’s on your mind—experiences, dilemmas, gratitude, or quiet thoughts. Gemini provides empathetic reasoning and mindful perspectives.
            </p>

            {/* Reflection Starter Prompt Cards */}
            <div className="mt-4 sm:mt-7 w-full space-y-2 text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider theme-text-secondary px-1">
                {t.suggestedPrompts}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {promptSuggestions.map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(suggestion)}
                    className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl theme-bg-subtle border theme-border hover:border-[#1A73E8]/50 dark:hover:border-[#E8A33D]/50 text-xs theme-text-primary transition-colors text-left flex flex-col justify-between group shadow-xs hover:shadow-sm"
                  >
                    <span className="leading-relaxed font-medium text-[11.5px] sm:text-[12px]">{suggestion}</span>
                    <div className="mt-2 flex items-center justify-end">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full theme-bg-surface group-hover:bg-[#1A73E8] dark:group-hover:bg-[#E8A33D] flex items-center justify-center transition-colors shadow-xs">
                        <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3 theme-text-secondary group-hover:text-white dark:group-hover:text-[#171310] transition-colors" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {entry.messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCopied = copiedMessageId === msg.id;
              const isSpeaking = speakingMessageId === msg.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                  className={`flex gap-2 sm:gap-3 w-full max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  {/* Simplified Inkwell Monoline Quill Avatar */}
                  {!isUser && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl theme-bg-subtle border theme-border flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] shrink-0 mt-0.5 shadow-2xs">
                      <Feather className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2]" />
                    </div>
                  )}

                  <div
                    className={`relative rounded-2xl sm:rounded-3xl p-3 sm:p-5 transition-all ${
                      isUser
                        ? 'theme-bg-subtle border theme-border theme-text-primary rounded-tr-sm max-w-[94%] sm:max-w-xl shadow-xs'
                        : 'theme-bg-surface border theme-border theme-text-primary rounded-tl-sm flex-1 min-w-0 max-w-full sm:max-w-2xl shadow-sm'
                    } ${isSpeaking ? 'ring-2 ring-[#1A73E8]/40 dark:ring-[#E8A33D]/40 shadow-md' : ''}`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 sm:mb-2 sm:pb-1.5 border-b theme-border text-[10px] sm:text-[11px] theme-text-secondary">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-semibold theme-accent-text">
                          {isUser ? 'Your Thought' : msg.isFallback ? 'Offline Reflection' : 'Inkwell AI'}
                        </span>
                        {!isUser && msg.isFallback && (
                          <span 
                            title={msg.modelUsed || 'Live Gemini API unavailable - offline reflection'}
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            <span>Offline Mode</span>
                          </span>
                        )}
                        {isSpeaking && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] animate-pulse">
                            <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span>{t.readingAloud}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-[9px] sm:text-[10px]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Subtle Edited Indicator on Message */}
                        {msg.editedAt && (
                          <span 
                            title={`Edited on ${new Date(msg.editedAt).toLocaleDateString()} at ${new Date(msg.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            className="text-[9px] sm:text-[10px] theme-text-secondary opacity-75 italic"
                          >
                            ({t.editedMessageLabel || 'edited'})
                          </span>
                        )}
                        
                        {/* Read Aloud Button */}
                        <button
                          id={`btn-read-aloud-${msg.id}`}
                          onClick={() => handleToggleReadAloud(msg.id, msg.content)}
                          title={isSpeaking ? t.stopReadAloud : t.readAloud}
                          className={`p-0.8 px-1.2 sm:p-1 sm:px-1.5 rounded-md sm:rounded-lg transition-all flex items-center gap-1 text-[10px] sm:text-[11px] ${
                            isSpeaking
                              ? 'bg-[#1A73E8]/15 dark:bg-[#E8A33D]/20 text-[#1A73E8] dark:text-[#E8A33D] font-semibold ring-1 ring-[#1A73E8]/30 dark:ring-[#E8A33D]/30'
                              : 'hover:theme-bg-subtle theme-text-secondary hover:theme-text-primary'
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1A73E8] dark:text-[#E8A33D] animate-pulse" />
                              <span className="text-[9px] sm:text-[10px]">{t.stopReadAloud}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-[10px] hidden sm:inline">{t.readAloud}</span>
                            </>
                          )}
                        </button>

                        {/* Edit User Message Button (only for user's own thoughts) */}
                        {isUser && editingMessageId !== msg.id && (
                          <button
                            id={`btn-edit-msg-${msg.id}`}
                            onClick={() => handleStartEditMessage(msg)}
                            title={t.editThought}
                            className="p-0.8 sm:p-1 rounded-md sm:rounded-lg hover:theme-bg-subtle theme-text-secondary hover:theme-accent-text transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}

                        {/* Copy Message Button */}
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          title="Copy text"
                          className="p-0.8 sm:p-1 rounded-md sm:rounded-lg hover:theme-bg-subtle theme-text-secondary hover:theme-text-primary transition-colors"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Message Content */}
                    {isUser ? (
                      editingMessageId === msg.id ? (
                        <div className="space-y-2.5 py-1 animate-in fade-in">
                          <textarea
                            id={`input-edit-msg-${msg.id}`}
                            value={editMessageText}
                            onChange={(e) => setEditMessageText(e.target.value)}
                            rows={Math.max(2, Math.min(8, editMessageText.split('\n').length + 1))}
                            autoFocus
                            className="w-full p-2.5 text-[13.5px] sm:text-[15px] font-sans leading-relaxed theme-bg-surface border border-[#1A73E8] dark:border-[#E8A33D] rounded-xl theme-text-primary focus:outline-none ring-2 ring-[#1A73E8]/20 resize-y"
                          />

                          {/* Helper text clarifying behavior */}
                          <div className="text-[11px] theme-text-secondary flex items-start gap-1.5 leading-snug">
                            <Sparkles className="w-3.5 h-3.5 theme-accent-text shrink-0 mt-0.5" />
                            <span>{t.editClarification}</span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEditMessage}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium theme-bg-subtle hover:theme-bg-hover theme-text-secondary hover:theme-text-primary border theme-border transition-colors"
                            >
                              {t.cancelEdit}
                            </button>

                            {/* Optional Regenerate Button (if followed by model response in multi-turn) */}
                            {entry.messages.some((m, idx) => idx > entry.messages.findIndex(curr => curr.id === msg.id) && m.role === 'model') && (
                              <button
                                type="button"
                                onClick={() => handleSaveMessageEdit(msg.id, true)}
                                disabled={!editMessageText.trim() || isGenerating}
                                title="Save your changes and request a fresh Gemini response from this point"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-colors disabled:opacity-50"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{t.saveAndRegenerate}</span>
                              </button>
                            )}

                            {/* Primary Save Button (Default: update wording, keeps AI response) */}
                            <button
                              type="button"
                              onClick={() => handleSaveMessageEdit(msg.id, false)}
                              disabled={!editMessageText.trim()}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] transition-all hover:opacity-90 shadow-xs disabled:opacity-50 active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t.saveChanges}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose-reflection journal-entry-text theme-text-primary text-[13.5px] sm:text-[15px]">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{msg.content}</ReactMarkdown>
                        </div>
                      )
                    ) : (
                      <div className="prose-reflection journal-entry-text theme-text-primary text-[13.5px] sm:text-[15px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Subtle, Tasteful Prompting for Short Conversations */}
        {entry.messages.length > 0 && entry.messages.length <= 2 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="my-3 p-3 sm:p-4 rounded-2xl border border-dashed theme-border theme-bg-subtle/40 max-w-xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold theme-text-secondary mb-2">
              <Sparkles className="w-3.5 h-3.5 theme-accent-text" />
              <span>Continue exploring your thoughts</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {[
                "What's one thing within my control?",
                "What is this situation teaching me?",
                "How would I advise a good friend here?",
                "What am I grateful for today?"
              ].map((promptText, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setInputText(promptText);
                    textareaRef.current?.focus();
                  }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full theme-bg-surface hover:theme-bg-hover border theme-border text-[11px] sm:text-xs theme-text-secondary hover:theme-text-primary transition-all shadow-2xs active:scale-95"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Typing / Generating Indicator */}
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex gap-2 sm:gap-3 max-w-2xl mr-auto"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl theme-bg-subtle border theme-border flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] shrink-0 mt-0.5 shadow-2xs">
              <Feather className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2] animate-pulse" />
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl theme-bg-surface border theme-border theme-text-secondary text-xs flex items-center gap-2 shadow-xs">
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin theme-accent-text" />
              <span className="text-[11px] sm:text-xs">{t.geminiThinking}</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input & Reflection Mode Dock */}
      <div className="relative z-30 px-2.5 py-2 sm:px-4 sm:py-3 border-t theme-border theme-bg-surface backdrop-blur-md shrink-0">
        <div className="w-full max-w-5xl mx-auto space-y-1.5 sm:space-y-2">
          {/* Reflection Mode Dropdown Selector */}
          <div className="flex items-center gap-2 pb-0.5 text-xs">
            <span className="theme-text-secondary text-[11px] font-semibold hidden sm:inline">
              Mode:
            </span>
            <div className="relative" ref={modeDropdownRef}>
              <button
                id="btn-mode-dropdown"
                onClick={() => setIsModeOpen(!isModeOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold theme-bg-subtle hover:theme-bg-hover theme-text-primary border theme-border shadow-2xs transition-all active:scale-95"
              >
                {selectedMode === 'reflect' && <MessageSquare className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />}
                {selectedMode === 'summarize' && <FileText className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />}
                {selectedMode === 'brainstorm' && <Lightbulb className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />}
                {selectedMode === 'action_items' && <CheckSquare className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />}
                <span>
                  {selectedMode === 'reflect' && t.modeReflect}
                  {selectedMode === 'summarize' && t.modeSummarize}
                  {selectedMode === 'brainstorm' && t.modeBrainstorm}
                  {selectedMode === 'action_items' && t.modeActionItems}
                </span>
                <ChevronDown className={`w-3 h-3 theme-text-secondary transition-transform duration-200 ${isModeOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModeOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 z-50 w-56 p-1.5 rounded-2xl theme-bg-surface border theme-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 theme-text-secondary">
                    Reflection Mode
                  </div>
                  <div className="space-y-1 my-1">
                    {[
                      { id: 'reflect' as ReflectionMode, label: t.modeReflect, desc: 'Mindful dialogue & perspective', icon: MessageSquare },
                      { id: 'summarize' as ReflectionMode, label: t.modeSummarize, desc: 'Core takeaways & themes', icon: FileText },
                      { id: 'brainstorm' as ReflectionMode, label: t.modeBrainstorm, desc: 'Creative ideas & exploration', icon: Lightbulb },
                      { id: 'action_items' as ReflectionMode, label: t.modeActionItems, desc: 'Concrete tasks & next steps', icon: CheckSquare },
                    ].map((mode) => {
                      const isSelected = selectedMode === mode.id;
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          id={`mode-select-${mode.id}`}
                          onClick={() => {
                            setSelectedMode(mode.id);
                            setIsModeOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                            isSelected
                              ? 'bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] font-semibold ring-1 ring-[#1A73E8]/30 dark:ring-[#E8A33D]/30'
                              : 'hover:theme-bg-subtle theme-text-primary'
                          }`}
                        >
                          <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold leading-tight">{mode.label}</div>
                            <div className="text-[10px] theme-text-secondary leading-tight mt-0.5">{mode.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Voice Input Toast / Banner */}
          {voiceToast && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {voiceToast}
              </span>
              <button
                onClick={() => setVoiceToast(null)}
                className="p-1 hover:bg-amber-500/20 rounded-md text-xs font-semibold"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Active Listening Waveform Banner */}
          {isListening && (
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-700 dark:text-red-300 shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
                <span className="text-[11px] sm:text-xs">{t.listening}</span>
                <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-800 dark:text-red-200 font-mono text-[10px]">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                id="btn-stop-listening"
                onClick={toggleVoiceInput}
                className="px-2 py-0.8 sm:px-2.5 sm:py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-[11px] font-semibold transition-colors shadow-xs"
              >
                {t.stopVoiceInput}
              </button>
            </div>
          )}

          {/* Transcribing Audio with Gemini Banner */}
          {isTranscribing && (
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 shadow-sm animate-pulse">
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">{t.transcribingAudio}</span>
            </div>
          )}

          {/* Gemini Capsule Input Box */}
          <div id="reflection-input-container" className={`relative flex items-center gap-1.5 sm:gap-2 theme-bg-subtle border ${isListening ? 'border-red-500/50 ring-2 ring-red-500/20' : 'theme-border'} rounded-2xl sm:rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 focus-within:border-[#1A73E8] dark:focus-within:border-[#E8A33D] focus-within:ring-2 focus-within:ring-[#1A73E8]/20 shadow-sm transition-all`}>
            <textarea
              id="input-journal-prompt"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? t.listening : isTranscribing ? t.transcribingAudio : t.inputPlaceholder}
              className="flex-1 bg-transparent theme-text-primary placeholder:theme-text-muted text-[13.5px] sm:text-[15px] leading-relaxed resize-none focus:outline-none px-1.5 py-1 max-h-28 sm:max-h-36 min-h-[32px] sm:min-h-[34px]"
            />

            {/* Voice Input Button - disabled during Read Aloud playback */}
            <button
              id="btn-voice-input"
              type="button"
              onClick={toggleVoiceInput}
              disabled={isTranscribing || !!speakingMessageId}
              title={speakingMessageId ? t.micDisabledAudioPlaying : isListening ? t.stopVoiceInput : t.voiceInput}
              className={`p-1.5 sm:p-2.5 rounded-full transition-all shrink-0 active:scale-95 disabled:opacity-40 ${
                isListening
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/25 ring-2 ring-red-300'
                  : 'theme-text-secondary hover:theme-text-primary theme-bg-surface hover:theme-bg-hover border theme-border'
              }`}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
              ) : (
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1A73E8] dark:text-[#E8A33D]" />
              )}
            </button>

            {/* Send Button */}
            <button
              id="btn-send-reflection"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isGenerating || isTranscribing}
              className="p-1.5 sm:p-2.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-bold transition-all disabled:opacity-40 shadow-sm shrink-0 active:scale-95"
              title={t.send}
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />}
            </button>
          </div>

          <div className="hidden sm:flex items-center justify-between text-[11px] theme-text-secondary px-2">
            <span>Press <kbd className="px-1 py-0.5 rounded theme-bg-surface theme-text-primary border theme-border text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded theme-bg-surface theme-text-primary border theme-border text-[10px]">Shift+Enter</kbd> for newline</span>
            <span className="text-[10px] theme-accent-text font-semibold flex items-center gap-1">
              <Feather className="w-3 h-3" />
              {t.geminiVersion}
            </span>
          </div>
        </div>
      </div>

      {/* Insights Breakdown Modal */}
      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        title={entry.title}
        data={insightsData}
        onOpenMoodTrends={onOpenMoodTrends}
      />

      {/* Export Modal for Current Entry */}
      <ExportVaultModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        entries={[entry]}
        currentEntry={entry}
      />

      {/* Delete Entry Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteCurrent}
        entryTitle={entry.title}
        isDeleting={isDeleting}
      />

      {/* Google Places Location Picker Modal */}
      <LocationPickerModal
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        currentLocation={entry.metadata?.placeLocation}
        onSelectLocation={handleSelectLocation}
      />
    </div>
  );
};
