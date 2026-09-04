import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  X,
  MessageSquare,
  FileText,
  Lightbulb,
  CheckSquare,
  BrainCircuit,
  ShieldCheck,
  Lock,
  Mic,
  Volume2,
  Flame,
  Download,
  Sparkles,
  Search,
  Maximize2,
  Tag,
  Smile,
  ChevronRight,
  Settings,
  HelpCircle,
  Keyboard,
  ArrowRight,
  Timer
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenExport?: () => void;
  onOpenStreak?: () => void;
}

type GuideSection =
  | 'overview'
  | 'modes'
  | 'insights'
  | 'security'
  | 'voice'
  | 'streaks'
  | 'export'
  | 'shortcuts';

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenExport,
  onOpenStreak,
}) => {
  const { t, startTour } = usePreferences();
  const [activeSection, setActiveSection] = useState<GuideSection>('overview');

  if (!isOpen) return null;

  const handleRestartTour = () => {
    onClose();
    setTimeout(() => {
      startTour(0);
    }, 150);
  };

  const sections: { id: GuideSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview & Basics', icon: Sparkles },
    { id: 'modes', label: 'Reflection Modes', icon: MessageSquare },
    { id: 'insights', label: 'AI Mindfulness Insights', icon: BrainCircuit },
    { id: 'security', label: 'PIN App Lock', icon: ShieldCheck },
    { id: 'voice', label: 'Voice & Audio Studio', icon: Mic },
    { id: 'streaks', label: 'Streaks & Consistency', icon: Flame },
    { id: 'export', label: 'Export & Backup Vault', icon: Download },
    { id: 'shortcuts', label: 'Shortcuts & Pro Tips', icon: Keyboard },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col theme-bg-surface border theme-border rounded-3xl shadow-2xl z-10 overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b theme-border bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1A73E8]/10 dark:bg-[#E8A33D]/15 text-[#1A73E8] dark:text-[#E8A33D] flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-gemini-display font-bold text-lg sm:text-xl theme-text-primary flex items-center gap-2">
                  <span>How to Use Inkwell</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1A73E8]/10 dark:bg-[#E8A33D]/20 text-[#1A73E8] dark:text-[#E8A33D]">
                    Guide
                  </span>
                </h3>
                <p className="text-xs theme-text-secondary">
                  Master conversational reflection, private vaults, AI insights & voice tools
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
              aria-label="Close user guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body with Sidebar navigation and Content */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Desktop Navigation Tabs */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-r theme-border p-2 sm:p-3 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1.5 scrollbar-none">
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold text-left transition-all whitespace-nowrap md:whitespace-normal shrink-0 md:w-full ${
                      isActive
                        ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] shadow-xs'
                        : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-subtle'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-6 text-sm theme-text-primary leading-relaxed">
              {/* SECTION: Overview & Basics */}
              {activeSection === 'overview' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-[#1A73E8]/5 dark:bg-[#E8A33D]/10 border border-[#1A73E8]/20 dark:border-[#E8A33D]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-base theme-text-primary mb-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#1A73E8] dark:text-[#E8A33D]" />
                        Welcome to Inkwell
                      </h4>
                      <p className="text-xs theme-text-secondary">
                        Inkwell combines personal free-writing with thoughtful, empathetic AI reflection. Private, mindful, and secure.
                      </p>
                    </div>
                    <button
                      id="btn-replay-tour-overview"
                      onClick={handleRestartTour}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.onboardingReplay}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#1A73E8] flex items-center justify-center mb-2">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs theme-text-primary mb-1">1. Start a Reflection</h5>
                      <p className="text-xs theme-text-secondary leading-relaxed">
                        Click <strong>+ New Reflection</strong> in the top bar to initialize a fresh entry. Type freely or click suggested prompts to kickstart your entry.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                        <Tag className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs theme-text-primary mb-1">2. Moods & Tags</h5>
                      <p className="text-xs theme-text-secondary leading-relaxed">
                        Attach your emotional state using the <strong>Mood Dropdown</strong> and add searchable tags like <code>#gratitude</code> or <code>#career</code>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs theme-text-primary mb-1">3. Private Real-Time Cloud Sync</h5>
                      <p className="text-xs theme-text-secondary leading-relaxed">
                        Every keystroke and conversation turn saves in real-time to your private Firestore vault, isolated strictly to your Google account.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                        <Search className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs theme-text-primary mb-1">4. Search & Filter Vault</h5>
                      <p className="text-xs theme-text-secondary leading-relaxed">
                        Use the left History Vault sidebar to search across reflection titles, keywords, date ranges, or specific emotional moods.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Reflection Modes */}
              {activeSection === 'modes' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="font-bold text-base theme-text-primary">4 Specialized Reflection Modes</h4>
                    <p className="text-xs theme-text-secondary mt-1">
                      Choose how Gemini partners with your thoughts by switching modes in the bottom input bar:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#1A73E8] flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs theme-text-primary">Reflect Mode (Default)</h5>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-500/10 text-[#1A73E8]">Socratic Dialogue</span>
                        </div>
                        <p className="text-xs theme-text-secondary mt-1 leading-relaxed">
                          Gemini acts as an empathetic sounding board, asking thoughtful, non-judgmental open questions to help you uncover underlying motivations and perspectives.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs theme-text-primary">Summarize Mode</h5>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">Core Takeaways</span>
                        </div>
                        <p className="text-xs theme-text-secondary mt-1 leading-relaxed">
                          Synthesizes your stream of consciousness into concise bullet points, emotional arcs, and fundamental realizations.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs theme-text-primary">Brainstorm Mode</h5>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Creative Exploration</span>
                        </div>
                        <p className="text-xs theme-text-secondary mt-1 leading-relaxed">
                          Offers creative angles, analogies, lateral perspectives, and fresh problem-solving frameworks for your dilemmas.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs theme-text-primary">Action Items Mode</h5>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Actionable Checklist</span>
                        </div>
                        <p className="text-xs theme-text-secondary mt-1 leading-relaxed">
                          Converts abstract thoughts into concrete, prioritized next steps with clear goals and actionable timelines.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: AI Mindfulness Insights */}
              {activeSection === 'insights' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border theme-border">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <BrainCircuit className="w-5 h-5 text-[#1A73E8] dark:text-[#E8A33D]" />
                      <h4 className="font-bold text-sm sm:text-base theme-text-primary">
                        Mindfulness Synthesis & Insights
                      </h4>
                    </div>
                    <p className="text-xs theme-text-secondary leading-relaxed">
                      Click the <strong>Insights</strong> button (with the 🧠⚡ logo in the top toolbar) at any point to generate a comprehensive cognitive analysis of your active entry.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl theme-bg-subtle border theme-border">
                      <h5 className="font-bold text-xs theme-text-primary">📌 Executive Summary</h5>
                      <p className="text-xs theme-text-secondary mt-0.5">High-level distillation of what was on your mind during the session.</p>
                    </div>
                    <div className="p-3 rounded-xl theme-bg-subtle border theme-border">
                      <h5 className="font-bold text-xs theme-text-primary">💡 Key Realizations & Patterns</h5>
                      <p className="text-xs theme-text-secondary mt-0.5">Subtle behavioral trends, recurring assumptions, and mindset breakthroughs.</p>
                    </div>
                    <div className="p-3 rounded-xl theme-bg-subtle border theme-border">
                      <h5 className="font-bold text-xs theme-text-primary">🌱 Emotional Tone & Mood Spectrum</h5>
                      <p className="text-xs theme-text-secondary mt-0.5">Evaluates shifts in emotional sentiment from the start to the conclusion of the entry.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: PIN Lock */}
              {activeSection === 'security' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="font-bold text-base theme-text-primary flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      Vault Security & 4-Digit PIN Lock
                    </h4>
                    <p className="text-xs theme-text-secondary mt-1">
                      Your journal contains your most personal reflections. Inkwell gives you cryptographic device protection:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#1A73E8] flex items-center justify-center mb-2">
                        <Lock className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs theme-text-primary mb-1">4-Digit PIN Lock</h5>
                      <p className="text-xs theme-text-secondary leading-relaxed">
                        Configure a secret 4-digit PIN in <strong>Settings</strong>. SHA-256 hashed locally on your device.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                        <Timer className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-xs theme-text-primary mb-1">Inactivity Auto-Lock</h5>
                      <p className="text-xs theme-text-secondary leading-relaxed">
                        Choose a timeout period (1m, 5m, 15m, 30m). If you step away, your journal locks automatically.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold theme-text-primary">Configure Security Settings</div>
                      <div className="text-[11px] theme-text-secondary">Set 4-digit PIN and auto-lock timeout duration</div>
                    </div>
                    {onOpenSettings && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSettings();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-semibold text-xs transition-all active:scale-95 shadow-xs"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Open Settings</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: Voice & Audio Studio */}
              {activeSection === 'voice' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="font-bold text-base theme-text-primary">Voice Dictation & Text-to-Speech Studio</h4>
                    <p className="text-xs theme-text-secondary mt-1">
                      Reflect out loud without typing or listen back to your entries with natural speech synthesis.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs theme-text-primary">Microphone Speech-to-Text</h5>
                        <p className="text-xs theme-text-secondary mt-1 leading-relaxed">
                          Click the <strong>Microphone</strong> button next to the message input to speak your mind freely. Your voice is transcribed continuously into text.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#1A73E8] flex items-center justify-center shrink-0 mt-0.5">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs theme-text-primary">Listen Back (Text-to-Speech)</h5>
                        <p className="text-xs theme-text-secondary mt-1 leading-relaxed">
                          Hover over any reflection response and click the <strong>Read Aloud</strong> icon to hear the message voiced with customizable voice pitch and speed settings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Streaks & Consistency */}
              {activeSection === 'streaks' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <h4 className="font-bold text-sm sm:text-base text-amber-600 dark:text-amber-400">
                        Mindfulness Streaks & Activity Heatmap
                      </h4>
                    </div>
                    <p className="text-xs theme-text-secondary leading-relaxed">
                      Consistency builds emotional resilience. Inkwell tracks your daily reflections and visualizes your habit on a 6-week consistency heatmap.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold theme-text-primary">View Your Current Streak Stats</div>
                      <div className="text-[11px] theme-text-secondary">Track consecutive days, total reflections, and milestones</div>
                    </div>
                    {onOpenStreak && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenStreak();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-semibold text-xs transition-all active:scale-95 shadow-xs"
                      >
                        <Flame className="w-3.5 h-3.5 fill-white" />
                        <span>View Heatmap</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: Export & Backup Vault */}
              {activeSection === 'export' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="font-bold text-base theme-text-primary">Exporting & Archiving Your Vault</h4>
                    <p className="text-xs theme-text-secondary mt-1">
                      You always maintain 100% ownership of your data. Export your journal at any time into standard open formats:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl theme-bg-subtle border theme-border">
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-0.5">📄 PDF Document</div>
                      <p className="text-[11px] theme-text-secondary">Formatted, print-ready document with headers, dialogue, and timestamps.</p>
                    </div>
                    <div className="p-3 rounded-xl theme-bg-subtle border theme-border">
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">📝 Markdown (.md)</div>
                      <p className="text-[11px] theme-text-secondary">Perfect for Obsidian, Notion, Apple Notes, or static markdown archives.</p>
                    </div>
                    <div className="p-3 rounded-xl theme-bg-subtle border theme-border">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">📊 JSON Structured Data</div>
                      <p className="text-[11px] theme-text-secondary">Full database dump including all metadata, tags, and AI message turns.</p>
                    </div>
                    <div className="p-3 rounded-xl theme-bg-subtle border theme-border">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">📄 Plain Text (.txt)</div>
                      <p className="text-[11px] theme-text-secondary">Clean plain text file readable on any device or text editor.</p>
                    </div>
                  </div>

                  {onOpenExport && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenExport();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border theme-border hover:theme-bg-subtle font-semibold text-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Open Export Vault Dialog</span>
                    </button>
                  )}
                </div>
              )}

              {/* SECTION: Shortcuts & Pro Tips */}
              {activeSection === 'shortcuts' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h4 className="font-bold text-base theme-text-primary flex items-center gap-2">
                      <Keyboard className="w-5 h-5 text-[#1A73E8] dark:text-[#E8A33D]" />
                      Keyboard Shortcuts & Flow Tips
                    </h4>
                    <p className="text-xs theme-text-secondary mt-1">
                      Navigate and write faster with these built-in power features:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl theme-bg-subtle border theme-border text-xs">
                      <span className="font-medium theme-text-primary">Send message / turn</span>
                      <kbd className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] font-bold">Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl theme-bg-subtle border theme-border text-xs">
                      <span className="font-medium theme-text-primary">New line in input box</span>
                      <kbd className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] font-bold">Shift + Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl theme-bg-subtle border theme-border text-xs">
                      <span className="font-medium theme-text-primary">Close modal / Exit Focus Mode</span>
                      <kbd className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] font-bold">Esc</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl theme-bg-subtle border theme-border text-xs">
                      <span className="font-medium theme-text-primary">Lock Journal Manually</span>
                      <div className="flex items-center gap-1.5">
                        <kbd className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] font-bold">Alt + L</kbd>
                        <span className="text-[10px] theme-text-secondary">or</span>
                        <kbd className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] font-bold">Ctrl + Shift + L</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl theme-bg-subtle border theme-border text-xs">
                      <span className="font-medium theme-text-primary">Focus Mode (Distraction-Free)</span>
                      <span className="text-[11px] theme-text-secondary">Toolbar Options (⋯) → Focus Mode</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t theme-border flex flex-col sm:flex-row items-center justify-between gap-2.5 theme-bg-subtle/50 shrink-0">
            <button
              id="btn-replay-tour-footer"
              onClick={handleRestartTour}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border theme-border hover:theme-bg-subtle text-xs font-semibold theme-text-primary transition-all active:scale-95 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />
              <span>{t.onboardingReplay}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] font-bold text-xs transition-all shadow-xs active:scale-95"
            >
              Got it, let's reflect
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
