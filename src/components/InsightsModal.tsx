import React, { useState, useEffect } from 'react';
import { Sparkles, Feather, X, CheckSquare, Tag, Smile, Copy, Check, Volume2, VolumeX, TrendingUp } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export interface InsightsData {
  summary?: string;
  keyInsights?: string[];
  detectedMood?: string;
  brainstormIdeas?: string[];
  tags?: string[];
  modelUsed?: string;
}

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: InsightsData | null;
  onOpenMoodTrends?: () => void;
}

export const InsightsModal: React.FC<InsightsModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  onOpenMoodTrends,
}) => {
  const { t, language } = usePreferences();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech synthesis on unmount or close
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const handleCopyAll = () => {
    const text = `# Inkwell Reflection Insights: ${title}
Mood: ${data.detectedMood || 'N/A'}
Model: ${data.modelUsed || 'Powered by Gemini'}

## ${t.executiveSummary}
${data.summary || 'N/A'}

## ${t.keyRealizations}
${data.keyInsights?.map((k, i) => `${i + 1}. ${k}`).join('\n') || t.none}

## ${t.creativeBrainstorming}
${data.brainstormIdeas?.map((b, i) => `${i + 1}. ${b}`).join('\n') || t.none}

Tags: ${data.tags?.map(t => `#${t}`).join(' ') || ''}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    synth.cancel();

    // Prepare clean text for narration
    const parts: string[] = [];
    if (title) parts.push(`Reflection: ${title}.`);
    if (data.detectedMood) parts.push(`Emotional tone: ${data.detectedMood}.`);
    if (data.summary) parts.push(`Executive Summary: ${data.summary}.`);
    if (data.keyInsights && data.keyInsights.length > 0) {
      parts.push(`Key realizations: ${data.keyInsights.join('. ')}.`);
    }
    if (data.brainstormIdeas && data.brainstormIdeas.length > 0) {
      parts.push(`Creative ideas: ${data.brainstormIdeas.join('. ')}.`);
    }

    const narrative = parts.join(' ');
    if (!narrative) return;

    try {
      const utterance = new SpeechSynthesisUtterance(narrative);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      
      const voices = synth.getVoices();
      if (voices && voices.length > 0) {
        const matched = voices.find(v => v.lang.startsWith(language)) || voices.find(v => v.lang.startsWith('en'));
        if (matched) utterance.voice = matched;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl theme-bg-surface border theme-border rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden theme-text-primary transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b theme-border flex items-center justify-between theme-bg-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white shadow-sm">
              <Feather className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-gemini-display font-bold text-base theme-text-primary">{t.insightsTitle}</h3>
              <p className="text-xs theme-text-secondary truncate max-w-md">{title || t.untitledReflection}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-insights-read-aloud"
              onClick={handleToggleReadAloud}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border theme-border transition-colors shadow-xs ${
                isSpeaking
                  ? 'bg-[#1A73E8]/15 dark:bg-[#E8A33D]/20 text-[#1A73E8] dark:text-[#E8A33D] ring-1 ring-[#1A73E8]/30 dark:ring-[#E8A33D]/30'
                  : 'theme-bg-surface hover:theme-bg-hover theme-text-primary'
              }`}
              title={isSpeaking ? t.stopReadAloud : t.readAloud}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D] animate-pulse" />
                  <span>{t.stopReadAloud}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t.readAloud}</span>
                </>
              )}
            </button>

            <button
              id="btn-insights-copy"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold theme-bg-surface hover:theme-bg-hover border theme-border theme-text-primary transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copied : t.copyInsights}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm theme-text-primary">
          {/* Summary */}
          {data.summary && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider theme-accent-text mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {t.executiveSummary}
              </h4>
              <div className="p-4 rounded-2xl theme-bg-subtle border theme-border text-[15px] leading-relaxed shadow-xs">
                {data.summary}
              </div>
            </div>
          )}

          {/* Key Insights */}
          {data.keyInsights && data.keyInsights.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider theme-accent-text mb-2.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> {t.keyRealizations}
              </h4>
              <ul className="space-y-2">
                {data.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                    <span className="w-5 h-5 rounded-full bg-[#1A73E8]/10 dark:bg-[#E8A33D]/20 text-[#1A73E8] dark:text-[#E8A33D] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border theme-border">
                      {idx + 1}
                    </span>
                    <span className="text-[14px] leading-relaxed theme-text-primary">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Brainstorming Ideas */}
          {data.brainstormIdeas && data.brainstormIdeas.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider theme-accent-text mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {t.creativeBrainstorming}
              </h4>
              <ul className="space-y-2">
                {data.brainstormIdeas.map((idea, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                      {idx + 1}
                    </span>
                    <span className="text-[14px] leading-relaxed theme-text-primary">{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mood & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t theme-border text-xs">
            {data.detectedMood && (
              <div className="flex items-center gap-2 theme-text-secondary">
                <Smile className="w-4 h-4 theme-accent-text" />
                <span>{t.emotionalTone}:</span>
                <span className="font-semibold theme-accent-text px-3 py-0.5 rounded-full theme-bg-subtle border theme-border">
                  {data.detectedMood}
                </span>
              </div>
            )}

            {data.tags && data.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3.5 h-3.5 theme-text-secondary" />
                {data.tags.map((tag) => (
                  <span key={tag} className="px-3 py-0.5 rounded-full theme-bg-subtle border theme-border theme-text-secondary text-[11px]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t theme-border theme-bg-subtle flex flex-wrap items-center justify-between gap-3 text-xs theme-text-secondary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 theme-accent-text" />
              {data.modelUsed ? `Processed by ${data.modelUsed}` : 'Powered by Gemini'}
            </span>
            {onOpenMoodTrends && (
              <button
                id="btn-insights-open-mood-trends"
                onClick={() => {
                  onClose();
                  onOpenMoodTrends();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-amber-500/10 text-[#1A73E8] dark:text-[#E8A33D] hover:bg-blue-500/20 dark:hover:bg-amber-500/20 font-medium transition-colors border border-blue-500/20 dark:border-amber-500/20 cursor-pointer"
              >
                <TrendingUp className="w-3 h-3" />
                <span>{t.moodTrends}</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full theme-bg-surface hover:theme-bg-hover border theme-border theme-text-primary font-semibold transition-colors shadow-xs"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
