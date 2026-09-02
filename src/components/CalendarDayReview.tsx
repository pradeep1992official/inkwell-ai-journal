import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Sparkles,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  Copy,
  Check,
  Save,
  FileText,
  X,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  BrainCircuit,
  MessageSquare,
  Compass,
  Smile,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  UserCheck,
  Eye,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { CalendarEventItem, DaySynthesisData, JournalEntry } from '../types';
import { fetchCalendarEvents, requestDaySynthesis, SAMPLE_TODAY_EVENTS } from '../lib/calendarService';
import { requestGoogleCalendarAccess, getStoredCalendarToken, getStoredCalendarEmail, clearStoredCalendarToken } from '../lib/firebase';
import { usePreferences } from '../context/PreferencesContext';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface CalendarDayReviewProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  activeEntry?: JournalEntry | null;
  onInsertTextToActiveEntry?: (text: string) => void;
  onSaveAsNewEntry?: (title: string, content: string, metadata?: any) => Promise<void>;
  userName?: string;
}

export const CalendarDayReview: React.FC<CalendarDayReviewProps> = ({
  isOpen,
  onClose,
  entries,
  activeEntry,
  onInsertTextToActiveEntry,
  onSaveAsNewEntry,
  userName,
}) => {
  const { t, language } = usePreferences();
  const [events, setEvents] = useState<CalendarEventItem[]>(SAMPLE_TODAY_EVENTS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(getStoredCalendarEmail());
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Day Synthesis State
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisData, setSynthesisData] = useState<DaySynthesisData | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [insertedToActive, setInsertedToActive] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');

  // Selected Date Filter (Default to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter journal entries for the selected day
  const todayJournalEntries = useMemo(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = entries.filter((e) => {
      const entryTime = e.createdAt;
      return entryTime >= startOfDay.getTime() && entryTime <= endOfDay.getTime() && !e.deletedAt;
    });

    // If no entries strictly match timestamp for today, include active entry if present
    if (filtered.length === 0 && activeEntry && !activeEntry.deletedAt) {
      return [activeEntry];
    }
    return filtered;
  }, [entries, selectedDate, activeEntry]);

  // Load calendar events
  const loadEvents = async (tokenOverride?: string) => {
    setIsLoadingEvents(true);
    setAuthError(null);
    try {
      const token = tokenOverride || getStoredCalendarToken();
      const result = await fetchCalendarEvents(token, selectedDate);
      setEvents(result.events);
      setIsConnected(result.isConnected);
      setCalendarEmail(getStoredCalendarEmail());
    } catch (err: any) {
      console.warn('Failed to load events:', err);
      setEvents(SAMPLE_TODAY_EVENTS);
      setIsConnected(false);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const token = getStoredCalendarToken();
      if (token) {
        setIsConnected(true);
        setCalendarEmail(getStoredCalendarEmail());
        loadEvents(token);
      } else {
        setIsConnected(false);
        setCalendarEmail(null);
        setEvents(SAMPLE_TODAY_EVENTS);
      }
    }
  }, [isOpen, selectedDate]);

  // Connect Google Calendar with OAuth (or switch account)
  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    setAuthError(null);
    try {
      const { accessToken, user } = await requestGoogleCalendarAccess();
      if (accessToken) {
        setIsConnected(true);
        const email = user?.email || getStoredCalendarEmail();
        setCalendarEmail(email);
        await loadEvents(accessToken);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setAuthError('Google sign-in window was closed. Connect or switch account anytime.');
      } else {
        setAuthError('Could not authorize Google Calendar. Using sample schedule instead.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Log out / Disconnect Google Calendar from this tab
  const handleDisconnectCalendar = () => {
    clearStoredCalendarToken();
    setIsConnected(false);
    setCalendarEmail(null);
    setEvents(SAMPLE_TODAY_EVENTS);
  };

  // Synthesize Day: "How was my day?"
  const handleSynthesizeDay = async () => {
    setIsSynthesizing(true);
    setSynthesisError(null);
    setSynthesisData(null);
    setIsSaved(false);
    setInsertedToActive(false);

    try {
      const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const data = await requestDaySynthesis({
        calendarEvents: events,
        journalEntries: todayJournalEntries.length > 0 ? todayJournalEntries : (activeEntry ? [activeEntry] : []),
        targetDateStr: dateStr,
        language,
        userName,
      });

      setSynthesisData(data);
    } catch (err: any) {
      console.error('Day synthesis error:', err);
      setSynthesisError(err?.message || 'Failed to synthesize day review. Please check connection and retry.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Insert event directly into active journal entry
  const handleInsertEvent = (event: CalendarEventItem) => {
    if (!onInsertTextToActiveEntry) return;
    const textToInsert = `\n\n> 📅 **Schedule Focus: ${event.startTimeFormatted || event.timeDisplay} — ${event.summary}**\n>${event.location ? ` *Location: ${event.location}* |` : ''}${event.description ? ` *Notes: ${event.description}*` : ''}\n\n`;
    onInsertTextToActiveEntry(textToInsert);
    setInsertedToActive(true);
    setTimeout(() => setInsertedToActive(false), 2500);
  };

  // Reflect on this specific event
  const handleReflectOnEvent = (event: CalendarEventItem) => {
    if (!onInsertTextToActiveEntry) return;
    const promptText = `\n\n**Reflecting on ${event.summary} (${event.startTimeFormatted || event.timeDisplay}):**\n`;
    onInsertTextToActiveEntry(promptText);
    onClose();
  };

  // Copy synthesized markdown
  const handleCopy = () => {
    if (!synthesisData) return;
    navigator.clipboard.writeText(synthesisData.fullMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Append full synthesis to current active entry
  const handleAppendToActive = () => {
    if (!synthesisData || !onInsertTextToActiveEntry) return;
    onInsertTextToActiveEntry(`\n\n---\n\n${synthesisData.fullMarkdown}\n\n`);
    setInsertedToActive(true);
    setTimeout(() => setInsertedToActive(false), 2500);
  };

  // Save synthesis as a new dedicated entry
  const handleSaveAsNew = async () => {
    if (!synthesisData || !onSaveAsNewEntry) return;
    try {
      const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const title = `Day Review: ${synthesisData.dayTheme || dateStr}`;
      await onSaveAsNewEntry(title, synthesisData.fullMarkdown, {
        mood: synthesisData.detectedMood || 'Reflective',
        tags: ['day-review', 'google-calendar', 'synthesis'],
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save day review entry:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl theme-bg-surface theme-border border shadow-2xl overflow-hidden"
          id="calendar-day-review-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b theme-border bg-gradient-to-r from-amber-500/5 via-blue-500/5 to-purple-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-1 ring-blue-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-gemini-display theme-text-primary flex items-center gap-2">
                  Google Calendar — “What happened today?”
                </h2>
                <p className="text-xs sm:text-sm theme-text-secondary">
                  Connect your schedule with journal reflections & summarize with Gemini
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
              aria-label="Close"
              id="btn-close-calendar-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Status & Connection Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl theme-bg-subtle border theme-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold theme-text-primary">
                      {isConnected ? 'Google Calendar Connected' : 'Sample Schedule Mode'}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                      {events.length} {events.length === 1 ? 'Event' : 'Events'} Today
                    </span>
                  </div>
                  <div className="text-[11px] theme-text-secondary truncate mt-0.5">
                    {isConnected ? (
                      <span>
                        Account: <strong className="font-semibold theme-text-primary">{calendarEmail || 'Primary Google Account'}</strong>
                      </span>
                    ) : (
                      <span>Sign in to fetch your real Google Calendar schedule</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => loadEvents()}
                      disabled={isLoadingEvents}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg theme-bg-surface hover:theme-bg-hover theme-text-secondary border theme-border transition-colors disabled:opacity-50 active:scale-95"
                      title="Refresh events from Google Calendar"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={handleConnectCalendar}
                      disabled={isConnecting}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg theme-bg-surface hover:theme-bg-hover text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors disabled:opacity-50 active:scale-95"
                      title="Switch to a different Google Calendar account if your schedule is under another email"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Switch Account</span>
                    </button>
                    <button
                      onClick={handleDisconnectCalendar}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors active:scale-95"
                      title="Log out Google Calendar from this tab"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectCalendar}
                    disabled={isConnecting}
                    id="btn-connect-google-calendar"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-60 active:scale-95"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
                  </button>
                )}
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Schedule Timeline: "Today" */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-xs theme-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Today's Schedule
                </h3>
                <span className="text-xs theme-text-secondary italic">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="space-y-2.5">
                {events.map((event, idx) => (
                  <div
                    key={event.id || idx}
                    className="p-3.5 rounded-xl border theme-border theme-bg-surface hover:theme-bg-subtle transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Time Pill Badge */}
                      <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold whitespace-nowrap shrink-0 border border-amber-500/20">
                        {event.startTimeFormatted || event.timeDisplay}
                      </div>

                      {/* Event Details */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold theme-text-primary truncate">
                          {event.summary}
                        </h4>
                        {event.description && (
                          <p className="text-xs theme-text-secondary line-clamp-1 mt-0.5">
                            {event.description}
                          </p>
                        )}
                        {event.location && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleReflectOnEvent(event)}
                        className="px-2 py-1 text-xs rounded-md theme-bg-subtle hover:theme-bg-hover theme-text-primary border theme-border transition-colors flex items-center gap-1"
                        title="Start a journal prompt reflecting on this event"
                      >
                        <MessageSquare className="w-3 h-3 text-amber-500" />
                        Reflect
                      </button>
                      <button
                        onClick={() => handleInsertEvent(event)}
                        className="px-2 py-1 text-xs rounded-md theme-bg-subtle hover:theme-bg-hover theme-text-secondary hover:theme-text-primary border theme-border transition-colors flex items-center gap-1"
                        title="Insert schedule badge into current entry"
                      >
                        <Plus className="w-3 h-3" />
                        Insert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Journal Entries for Today */}
            <div className="p-3.5 rounded-xl theme-bg-subtle border theme-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider theme-text-secondary flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  Today's Journal Reflections ({todayJournalEntries.length})
                </span>
                {todayJournalEntries.length > 0 && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Ready for Gemini synthesis
                  </span>
                )}
              </div>
              <p className="text-xs theme-text-secondary">
                {todayJournalEntries.length > 0
                  ? `Inkwell will combine your ${events.length} calendar events with your recorded journal thoughts to answer "How was my day?".`
                  : 'You have not recorded thoughts for today yet. You can still ask Gemini to summarize your schedule, or write a quick reflection in the editor first!'}
              </p>
            </div>

            {/* Core Action: "How was my day?" Synthesis Button */}
            <div className="pt-2">
              <button
                onClick={handleSynthesizeDay}
                disabled={isSynthesizing}
                id="btn-how-was-my-day"
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className={`w-5 h-5 ${isSynthesizing ? 'animate-spin' : 'animate-bounce'}`} />
                {isSynthesizing ? 'Gemini is synthesizing your schedule + journal entries...' : 'Ask: “How was my day?”'}
              </button>
              <p className="text-center text-[11px] theme-text-secondary mt-1.5">
                Gemini cross-references your Google Calendar events with your thoughts to craft a mindful daily review
              </p>
            </div>

            {/* Synthesis Error Display */}
            {synthesisError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Synthesis Notice</p>
                  <p>{synthesisError}</p>
                </div>
              </div>
            )}

            {/* Gemini Day Synthesis Output Card */}
            {synthesisData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 sm:p-6 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-purple-500/5 via-blue-500/5 to-transparent space-y-5 shadow-sm"
                id="day-synthesis-result"
              >
                {/* Header with Theme, Mood, and View Mode Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b theme-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      {synthesisData.dayTheme || 'Daily Synthesis'}
                    </span>
                    {synthesisData.detectedMood && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 border border-emerald-500/20">
                        <Smile className="w-3.5 h-3.5" />
                        <span>{synthesisData.detectedMood}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View mode toggle */}
                    <div className="flex items-center p-0.5 rounded-lg theme-bg-subtle border theme-border text-xs">
                      <button
                        onClick={() => setViewMode('structured')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          viewMode === 'structured'
                            ? 'theme-bg-surface theme-text-primary shadow-2xs'
                            : 'theme-text-secondary hover:theme-text-primary'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Structured</span>
                      </button>
                      <button
                        onClick={() => setViewMode('markdown')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          viewMode === 'markdown'
                            ? 'theme-bg-surface theme-text-primary shadow-2xs'
                            : 'theme-text-secondary hover:theme-text-primary'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Markdown</span>
                      </button>
                    </div>

                    <div className="text-[11px] theme-text-secondary font-mono hidden sm:inline">
                      {synthesisData.modelUsed}
                    </div>
                  </div>
                </div>

                {viewMode === 'structured' ? (
                  <div className="space-y-4">
                    {/* Executive Summary Card */}
                    <div className="p-4 rounded-xl theme-bg-surface border theme-border space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Executive Day Summary</span>
                      </div>
                      <p className="text-sm font-sans leading-relaxed theme-text-primary">
                        {synthesisData.summary}
                      </p>
                    </div>

                    {/* Key Realizations & Milestones */}
                    {synthesisData.keyHighlights && synthesisData.keyHighlights.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Key Realizations & Breakthroughs</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {synthesisData.keyHighlights.map((hl, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl theme-bg-surface border theme-border text-xs flex items-start gap-2.5 shadow-2xs"
                            >
                              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </div>
                              <span className="theme-text-primary font-medium leading-relaxed">
                                {hl}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedule Breakdown */}
                    {synthesisData.scheduleBreakdown && synthesisData.scheduleBreakdown.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Schedule & Timeline Reflections</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {synthesisData.scheduleBreakdown.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl theme-bg-surface border theme-border text-xs flex flex-col justify-between shadow-2xs"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="font-bold theme-text-primary truncate">
                                    {item.event}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-[10px] whitespace-nowrap border border-amber-500/20">
                                    {item.time}
                                  </span>
                                </div>
                                {item.reflection && (
                                  <p className="theme-text-secondary text-[11px] leading-relaxed italic">
                                    “{item.reflection}”
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grounding & Tomorrow Intention */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {synthesisData.groundingThought && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs theme-text-primary space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Evening Grounding</span>
                          </div>
                          <p className="italic leading-relaxed">
                            "{synthesisData.groundingThought}"
                          </p>
                        </div>
                      )}

                      {synthesisData.tomorrowIntention && (
                        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs theme-text-primary space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Intention for Tomorrow</span>
                          </div>
                          <p className="font-medium leading-relaxed">
                            {synthesisData.tomorrowIntention}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Clean Markdown Rendered View */
                  <div className="p-4 rounded-xl theme-bg-surface border theme-border text-xs leading-relaxed space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        h3: ({ node, ...props }) => (
                          <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-2 mb-1" {...props} />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-3 mb-1" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-2 theme-text-primary leading-relaxed" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-4 mb-2 space-y-1 theme-text-primary" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="theme-text-primary" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-purple-500 pl-3 italic my-2 theme-text-secondary" {...props} />
                        ),
                      }}
                    >
                      {synthesisData.fullMarkdown}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t theme-border">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAppendToActive}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
                      title="Append this day summary to your active journal entry"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {insertedToActive ? 'Inserted to Journal!' : 'Insert to Active Entry'}
                    </button>
                    {onSaveAsNewEntry && (
                      <button
                        onClick={handleSaveAsNew}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg theme-bg-subtle hover:theme-bg-hover theme-text-primary border theme-border transition-colors flex items-center gap-1.5 active:scale-95"
                        title="Save as a new journal entry in Firestore"
                      >
                        <Save className="w-3.5 h-3.5 text-emerald-500" />
                        {isSaved ? 'Saved to Vault!' : 'Save as New Entry'}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg theme-bg-subtle hover:theme-bg-hover theme-text-secondary hover:theme-text-primary border theme-border transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Copied to Clipboard' : 'Copy Markdown'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-6 py-3 border-t theme-border bg-subtle flex items-center justify-between text-xs theme-text-secondary">
            <span>Google Calendar & Gemini Integration</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md theme-bg-surface hover:theme-bg-hover border theme-border text-xs font-medium theme-text-primary transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
