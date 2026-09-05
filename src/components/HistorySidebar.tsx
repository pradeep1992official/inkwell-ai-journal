import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Smile, 
  Feather,
  X,
  SlidersHorizontal,
  Flame,
  Download,
  HeartHandshake,
  ExternalLink,
  ChevronLeft,
  RotateCcw,
  TrendingUp,
  MapPin,
  Sparkles,
  BrainCircuit,
  Loader2,
  Calendar,
  Database,
  ArrowRight,
  Maximize2,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { JournalEntry, AskMyLifeResult, MemoryCitation } from '../types';
import { usePreferences } from '../context/PreferencesContext';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { calculateStreakStats } from '../lib/streakService';
import { askMyLife, backfillMissingEmbeddings, extractEntrySearchableText } from '../lib/semanticSearchService';

interface HistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  onOpenStreakModal: () => void;
  onOpenExportModal: () => void;
  onOpenHowToUse?: () => void;
  onOpenMoodTrends?: () => void;
  onOpenMemories?: () => void;
  onOpenAskMyLife?: () => void;
  onToggleCollapse?: () => void;
  userId?: string;
  userName?: string;
}

type DateFilterOption = 'all' | 'today' | 'week' | 'month';
type SearchMode = 'keyword' | 'ask';

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpen,
  onClose,
  onOpenStreakModal,
  onOpenExportModal,
  onOpenHowToUse,
  onOpenMoodTrends,
  onOpenMemories,
  onOpenAskMyLife,
  onToggleCollapse,
  userId = '',
  userName = '',
}) => {
  const { t, language } = usePreferences();
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Ask My Life Semantic Search State
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askStep, setAskStep] = useState('');
  const [askResult, setAskResult] = useState<AskMyLifeResult | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);

  // Custom Delete Modal state
  const [entryPendingDelete, setEntryPendingDelete] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate unindexed entries
  const unindexedCount = useMemo(() => {
    return entries.filter((e) => {
      if (e.deletedAt) return false;
      const text = extractEntrySearchableText(e);
      if (!text) return false;
      return !Array.isArray(e.embedding) || e.embedding.length === 0;
    }).length;
  }, [entries]);

  const handleAskSubmit = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : askQuery).trim();
    if (!q || isAsking) return;

    setIsAsking(true);
    setAskError(null);
    setAskResult(null);
    setAskStep('Embedding question...');

    const timer1 = setTimeout(() => setAskStep('Scanning memories via cosine vector distance...'), 600);
    const timer2 = setTimeout(() => setAskStep('Synthesizing date-cited answer with Gemini...'), 1200);

    try {
      const res = await askMyLife(q, userId || 'anonymous', entries, {
        language,
        userName,
      });
      setAskResult(res);
    } catch (err: any) {
      console.warn('Ask My Life query failed:', err);
      setAskError(err?.message || 'Failed to search your memories.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAsking(false);
      setAskStep('');
    }
  };

  const handleSidebarBackfill = async () => {
    if (isBackfilling || unindexedCount === 0 || !userId) return;
    setIsBackfilling(true);
    try {
      await backfillMissingEmbeddings(userId, entries);
    } catch (err) {
      console.warn('Sidebar backfill failed:', err);
    } finally {
      setIsBackfilling(false);
    }
  };

  // Calculate streaks
  const streakStats = useMemo(() => calculateStreakStats(entries), [entries]);

  // Extract distinct moods from existing entries
  const availableMoods = useMemo(() => {
    const moods = new Set<string>();
    entries.forEach((e) => {
      if (!e.deletedAt && e.metadata?.mood) moods.add(e.metadata.mood);
    });
    return ['All', ...Array.from(moods)];
  }, [entries]);

  // Extract distinct tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach((e) => {
      if (!e.deletedAt) {
        e.metadata?.tags?.forEach((tg) => tags.add(tg));
      }
    });
    return ['All', ...Array.from(tags)];
  }, [entries]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedMood !== 'All') count++;
    if (selectedMode !== 'All') count++;
    if (selectedTag !== 'All') count++;
    if (dateFilter !== 'all') count++;
    return count;
  }, [selectedMood, selectedMode, selectedTag, dateFilter]);

  const handleResetFilters = () => {
    setSelectedMood('All');
    setSelectedMode('All');
    setSelectedTag('All');
    setDateFilter('all');
    setSearchQuery('');
  };

  // Filter entries based on search query, mood, mode, tag, date
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    return entries.filter((entry) => {
      // Exclude soft deleted entries
      if (entry.deletedAt) return false;

      // Mood filter
      if (selectedMood !== 'All' && entry.metadata?.mood?.toLowerCase() !== selectedMood.toLowerCase()) {
        return false;
      }

      // Mode filter
      if (selectedMode !== 'All') {
        const hasMode = entry.messages.some((m) => m.mode === selectedMode);
        if (!hasMode) return false;
      }

      // Tag filter
      if (selectedTag !== 'All') {
        const hasTag = entry.metadata?.tags?.some((tg) => tg.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        if (now - entry.updatedAt > oneDay) return false;
      } else if (dateFilter === 'week') {
        if (now - entry.updatedAt > oneWeek) return false;
      } else if (dateFilter === 'month') {
        if (now - entry.updatedAt > oneMonth) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = entry.title.toLowerCase().includes(q);
      const inSummary = entry.summary?.toLowerCase().includes(q);
      const inTags = entry.metadata?.tags?.some((t) => t.toLowerCase().includes(q));
      const inMessages = entry.messages.some((m) => m.content.toLowerCase().includes(q));
      const inPlaceName = entry.metadata?.placeLocation?.name?.toLowerCase().includes(q);
      const inPlaceAddress = entry.metadata?.placeLocation?.formattedAddress?.toLowerCase().includes(q);
      const inPlaceLocality = entry.metadata?.placeLocation?.locality?.toLowerCase().includes(q);
      const inWeather = entry.metadata?.weather?.condition?.toLowerCase().includes(q);

      // Match formatted dates (e.g. "September 3", "Sep 3", "Sept 3", "September 3rd", "Thursday", "2026-09-03")
      const entryTimestamp = entry.createdAt || entry.updatedAt;
      let inDate = false;
      if (entryTimestamp) {
        const d = new Date(entryTimestamp);
        if (!isNaN(d.getTime())) {
          const fullDateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase();
          const shortDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
          const monthDayStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toLowerCase();
          const day = d.getDate();
          const daySuffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
          const ordinalStr = `${d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()} ${day}${daySuffix}`;
          const isoDate = d.toISOString().slice(0, 10);

          inDate =
            fullDateStr.includes(q) ||
            shortDateStr.includes(q) ||
            monthDayStr.includes(q) ||
            ordinalStr.includes(q) ||
            isoDate.includes(q) ||
            q.includes(monthDayStr) ||
            q.includes(ordinalStr);
        }
      }

      return inTitle || inSummary || inTags || inMessages || inPlaceName || inPlaceAddress || inPlaceLocality || inWeather || inDate;
    });
  }, [entries, searchQuery, selectedMood, selectedMode, selectedTag, dateFilter]);

  const handleDeleteClick = (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    setEntryPendingDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!entryPendingDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteEntry(entryPendingDelete.id);
      setEntryPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t.yesterday;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed top-16 inset-x-0 bottom-0 bg-black/40 dark:bg-black/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="journal-vault-sidebar"
        className={`fixed md:static top-16 md:top-0 bottom-0 left-0 z-40 md:z-10 w-80 h-[calc(100dvh-4rem)] md:h-full shrink-0 theme-bg-subtle border-r theme-border flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 border-b theme-border flex items-center justify-between theme-bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-amber-400/10 flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D]">
              <Feather className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-gemini-display font-bold text-sm theme-text-primary">{t.journalVault}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full theme-bg-subtle theme-text-secondary font-semibold border theme-border">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                className="hidden md:flex p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-hover transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary theme-bg-subtle md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b theme-border theme-bg-subtle shrink-0 space-y-2">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-black/5 dark:bg-white/5 p-0.5 text-xs font-semibold">
            <button
              id="btn-sidebar-mode-keyword"
              type="button"
              onClick={() => setSearchMode('keyword')}
              className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs ${
                searchMode === 'keyword'
                  ? 'theme-bg-surface theme-text-primary shadow-xs font-bold'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t.keyword}</span>
            </button>
            <button
              id="btn-sidebar-mode-ask"
              type="button"
              onClick={() => setSearchMode('ask')}
              className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs ${
                searchMode === 'ask'
                  ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] shadow-xs font-bold'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.askMyLife}</span>
            </button>
          </div>

          {searchMode === 'keyword' ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 theme-text-secondary absolute left-3 top-2.5" />
                  <input
                    id="input-sidebar-search"
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs theme-bg-surface border theme-border rounded-full theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#E8A33D] focus:ring-2 focus:ring-[#1A73E8]/20 transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 theme-text-secondary hover:theme-text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Panel Toggle Button */}
                <button
                  id="btn-sidebar-advanced-filters"
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  title={t.filterBtn}
                  className={`p-1.5 rounded-full border transition-all relative ${
                    showAdvancedFilters || activeFiltersCount > 0
                      ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] border-transparent shadow-xs'
                      : 'theme-bg-surface theme-text-secondary hover:theme-text-primary theme-border'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {activeFiltersCount > 0 && !showAdvancedFilters && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Collapsible Filter Panel */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-1 space-y-2.5 text-left"
                  >
                    {/* Date Filter */}
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider theme-text-secondary block mb-1">
                        {t.filterByDate}
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['all', 'today', 'week', 'month'] as DateFilterOption[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => setDateFilter(d)}
                            className={`py-1 px-1 rounded-lg text-[10px] font-medium transition-all ${
                              dateFilter === d
                                ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-bold'
                                : 'theme-bg-surface theme-text-secondary hover:theme-text-primary border theme-border'
                            }`}
                          >
                            {d === 'all' ? t.filterPresetAll : d === 'today' ? t.filterPresetToday : d === 'week' ? t.filterPresetThisWeek : t.filterPresetThisMonth}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mood Filter */}
                    {availableMoods.length > 1 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider theme-text-secondary block">
                            {t.filterByMood}
                          </span>
                          {onOpenMoodTrends && (
                            <button
                              type="button"
                              id="btn-sidebar-view-mood-trends"
                              onClick={onOpenMoodTrends}
                              className="text-[10px] theme-accent-text hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span>{t.moodTrends}</span>
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {availableMoods.map((m) => (
                            <button
                              key={m}
                              onClick={() => setSelectedMood(m)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all whitespace-nowrap ${
                                selectedMood === m
                                  ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-bold'
                                  : 'theme-bg-surface theme-text-secondary hover:theme-text-primary border theme-border'
                              }`}
                            >
                              {m === 'All' ? t.allMoods : m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mode Filter */}
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider theme-text-secondary block mb-1">
                        {t.filterByMode}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {['All', 'reflect', 'summarize', 'brainstorm', 'action_items'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setSelectedMode(mode)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                              selectedMode === mode
                                ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-bold'
                                : 'theme-bg-surface theme-text-secondary hover:theme-text-primary border theme-border'
                            }`}
                          >
                            {mode === 'All' ? t.filterPresetAll : mode === 'reflect' ? t.modeReflect : mode === 'summarize' ? t.modeSummarize : mode === 'brainstorm' ? t.modeBrainstorm : t.modeActionItems}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags Filter */}
                    {availableTags.length > 1 && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider theme-text-secondary block mb-1">
                          {t.filterByTags}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {availableTags.map((tg) => (
                            <button
                              key={tg}
                              onClick={() => setSelectedTag(tg)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all whitespace-nowrap ${
                                selectedTag === tg
                                  ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-bold'
                                  : 'theme-bg-surface theme-text-secondary hover:theme-text-primary border theme-border'
                              }`}
                            >
                              {tg === 'All' ? t.filterPresetAll : `#${tg}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reset Filters */}
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className="w-full mt-1 py-1 rounded-xl theme-bg-surface hover:theme-bg-hover text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t.resetFilters}</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* Ask My Life Query Input Area */
            <div className="space-y-2 pt-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold theme-text-secondary flex items-center gap-1">
                  <BrainCircuit className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />
                  {t.askLifeHeading}
                </span>
                {onOpenAskMyLife && (
                  <button
                    type="button"
                    onClick={onOpenAskMyLife}
                    title="Open Fullscreen Search"
                    className="p-1 rounded text-xs theme-text-secondary hover:theme-text-primary"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  id="input-sidebar-ask-query"
                  type="text"
                  placeholder={t.askLifePlaceholder}
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAskSubmit();
                    }
                  }}
                  className="w-full pl-3 pr-14 py-1.5 text-xs theme-bg-surface border theme-border rounded-xl theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#E8A33D] focus:ring-2 focus:ring-[#1A73E8]/20 transition-all shadow-xs"
                />
                <button
                  id="btn-sidebar-ask-submit"
                  type="button"
                  onClick={() => handleAskSubmit()}
                  disabled={!askQuery.trim() || isAsking}
                  className="absolute right-1 top-1 px-2.5 py-1 rounded-lg bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] text-[10px] font-bold flex items-center gap-1 disabled:opacity-40"
                >
                  {isAsking ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Unindexed Embeddings helper badge */}
              {unindexedCount > 0 && (
                <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-200">
                  <span>{unindexedCount} unindexed {unindexedCount === 1 ? 'memory' : 'memories'}</span>
                  <button
                    type="button"
                    onClick={handleSidebarBackfill}
                    disabled={isBackfilling}
                    className="font-bold underline text-amber-700 dark:text-amber-300 hover:opacity-80"
                  >
                    {isBackfilling ? 'Indexing...' : 'Index all'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Entries List or Semantic Memory Results */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
          {searchMode === 'ask' ? (
            /* Ask My Life Result or Helper Chips */
            <div className="space-y-3 text-left">
              {isAsking && (
                <div className="p-4 rounded-xl theme-bg-surface border theme-border text-center space-y-2">
                  <div className="w-7 h-7 mx-auto rounded-full border-2 border-[#1A73E8]/20 border-t-[#1A73E8] dark:border-[#E8A33D]/20 dark:border-t-[#E8A33D] animate-spin" />
                  <p className="text-xs font-semibold theme-text-primary">{askStep}</p>
                  <p className="text-[10px] theme-text-secondary">Scanning your private journal memory vault</p>
                </div>
              )}

              {askError && !isAsking && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs prose-inline leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                    {askError}
                  </ReactMarkdown>
                </div>
              )}

              {askResult && !isAsking && (
                <div className="space-y-3">
                  {/* Synthesized Response */}
                  <div className="p-3.5 rounded-xl bg-blue-500/5 dark:bg-amber-400/5 border border-[#1A73E8]/20 dark:border-[#E8A33D]/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold font-gemini-display theme-text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />
                        Memory Answer
                      </span>
                      <span className="text-[10px] theme-text-secondary">
                        {askResult.citations.length} cited
                      </span>
                    </div>

                    <div className="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed theme-text-primary">
                      <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                        {askResult.answer}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Cited Memories list */}
                  {askResult.citations && askResult.citations.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider theme-text-secondary block">
                        Cited Memories ({askResult.citations.length})
                      </span>

                      <div className="space-y-2">
                        {askResult.citations.map((c) => {
                          const matchedEntry = entries.find((e) => e.id === c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (matchedEntry) {
                                  onSelectEntry(matchedEntry);
                                  if (window.innerWidth < 768) onClose();
                                }
                              }}
                              className="p-2.5 rounded-xl theme-bg-surface hover:theme-bg-hover border theme-border hover:border-[#1A73E8]/40 dark:hover:border-[#E8A33D]/40 transition-all cursor-pointer group shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold theme-text-primary group-hover:text-[#1A73E8] dark:group-hover:text-[#E8A33D] line-clamp-1">
                                  {c.title}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 text-[#1A73E8] dark:text-[#E8A33D]">
                                  {c.similarityScore}%
                                </span>
                              </div>
                              <p className="text-[11px] theme-text-secondary line-clamp-2 italic mt-1 leading-snug">
                                "{c.snippet}"
                              </p>
                              <div className="flex items-center justify-between mt-2 pt-1 border-t theme-border text-[10px] theme-text-secondary">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5 opacity-70" />
                                  <span>{c.dateFormatted}</span>
                                </div>
                                {c.mood && <span>{c.mood}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!askResult && !isAsking && (
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider theme-text-secondary block">
                    Example Questions:
                  </span>
                  {[
                    'When was the last time I felt really proud?',
                    'What did I write about my first project?',
                    'Have I mentioned feeling stressed about work recently?',
                    'What made me feel most grateful this week?',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setAskQuery(q);
                        handleAskSubmit(q);
                      }}
                      className="w-full p-2 rounded-xl text-xs theme-bg-surface hover:theme-bg-hover border theme-border theme-text-secondary hover:theme-text-primary transition-all text-left flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <span className="line-clamp-1">{q}</span>
                      <ArrowRight className="w-3 h-3 opacity-60 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : filteredEntries.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="p-6 text-center theme-text-secondary text-xs"
            >
              {entries.length === 0 ? (
                <div>
                  <Feather className="w-7 h-7 mx-auto mb-2 text-[#1A73E8]/60 dark:text-[#E8A33D]/60 stroke-[1.8]" />
                  <p className="theme-text-primary font-gemini-display font-semibold text-sm">{t.noEntriesYet}</p>
                  <p className="mt-1 theme-text-secondary leading-relaxed">
                    {t.createFirstEntry}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium theme-text-primary">{t.noEntriesFound}</p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 text-xs theme-accent-text underline"
                  >
                    {t.resetFilters}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {filteredEntries.map((entry, index) => {
                const isSelected = entry.id === selectedEntryId;
                const cleanPreview = (text: string) => {
                  if (!text) return 'Empty entry';
                  let cleaned = text.replace(/^⚠️[^\n]+\n*/i, '').trim();
                  cleaned = cleaned.replace(/^#{1,6}\s+[^\n]+\n*/gm, '').trim();
                  cleaned = cleaned.replace(/[*_#`~]/g, '');
                  return cleaned.slice(0, 150) || 'Personal reflection';
                };
                const previewText = entry.summary
                  ? cleanPreview(entry.summary)
                  : entry.messages.length > 0
                  ? cleanPreview(entry.messages[0].content)
                  : 'Empty entry';

                return (
                  <motion.div
                    key={entry.id}
                    layout="position"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                    transition={{ 
                      duration: 0.22, 
                      delay: Math.min(index * 0.03, 0.2), 
                      ease: [0.25, 1, 0.5, 1] 
                    }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    id={`entry-card-${entry.id}`}
                    onClick={() => {
                      onSelectEntry(entry);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`group relative p-3.5 rounded-2xl cursor-pointer transition-colors border text-left ${
                      isSelected
                        ? 'border-2 border-[#1A73E8] dark:border-[#E8A33D] theme-bg-surface shadow-md ring-2 ring-[#1A73E8]/15 dark:ring-[#E8A33D]/20'
                        : 'theme-bg-surface theme-border hover:border-[#1A73E8]/30 dark:hover:border-[#E8A33D]/30 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="relative group/title flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(entry.isSample || entry.metadata?.isSample) && (
                            <span 
                              id={`badge-sample-entry-${entry.id}`}
                              className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0"
                            >
                              {t.sample || 'Sample'}
                            </span>
                          )}
                          <h4 
                            title={entry.title || t.untitledReflection}
                            className={`text-xs font-semibold line-clamp-1 tracking-tight ${isSelected ? 'text-[#1A73E8] dark:text-[#E8A33D] font-bold' : 'theme-text-primary'}`}
                          >
                            {entry.title || t.untitledReflection}
                          </h4>
                        </div>

                        {/* Floating Full Title Tooltip */}
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/title:flex flex-col z-50 p-2 max-w-[240px] w-max rounded-xl theme-bg-surface border theme-border shadow-2xl backdrop-blur-md pointer-events-none transition-all animate-in fade-in zoom-in-95">
                          <div className="text-[9px] font-bold uppercase tracking-wider theme-accent-text mb-0.5">
                            Full Title
                          </div>
                          <div className="text-[11px] font-medium theme-text-primary leading-tight break-words">
                            {entry.title || t.untitledReflection}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] theme-text-secondary font-medium">
                          {formatTime(entry.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Optional Attached Image Thumbnail Preview */}
                    {(entry.attachedImage?.url || entry.metadata?.attachedImage?.url) && (
                      <div className="mt-2 relative rounded-lg overflow-hidden border theme-border aspect-[16/9] max-h-24 w-full bg-black/5 dark:bg-white/5">
                        <img 
                          src={entry.attachedImage?.url || entry.metadata?.attachedImage?.url} 
                          alt="Attached reflection photo" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium shadow-xs">
                          <Camera className="w-2.5 h-2.5" />
                          <span>{t.photo}</span>
                        </div>
                      </div>
                    )}

                    <p className="mt-1.5 text-[11px] theme-text-secondary line-clamp-2 leading-relaxed font-normal">
                      {previewText}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t theme-border">
                      <div className="flex items-center gap-1.5 text-[10px] theme-text-secondary overflow-hidden max-w-[80%] flex-wrap">
                        {(entry.attachedImage?.url || entry.metadata?.attachedImage?.url) && (
                          <span 
                            title="Attached Photo"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 text-[9px] font-medium"
                          >
                            <ImageIcon className="w-2.5 h-2.5 shrink-0" />
                            <span>{t.photo}</span>
                          </span>
                        )}

                        {entry.metadata?.placeLocation && (
                          <span 
                            title={`Tagged Place: ${entry.metadata.placeLocation.name} (${entry.metadata.placeLocation.formattedAddress})`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-medium truncate max-w-[110px]"
                          >
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{entry.metadata.placeLocation.name}</span>
                          </span>
                        )}

                        {entry.metadata?.weather && (
                          <span 
                            title={`Ambient Weather: ${entry.metadata.weather.condition}, ${entry.metadata.weather.temperature}°C, ${entry.metadata.weather.humidity}% humidity`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-[9px] font-medium whitespace-nowrap"
                          >
                            <span>{entry.metadata.weather.conditionEmoji || '⛅'}</span>
                            <span>{entry.metadata.weather.temperature}°C</span>
                          </span>
                        )}

                        {entry.metadata?.mood && (
                          <span 
                            title={entry.metadata.mood}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full theme-bg-subtle text-[#1A73E8] dark:text-[#E8A33D] border theme-border font-semibold whitespace-nowrap text-[10px]"
                          >
                            <Smile className="w-2.5 h-2.5 shrink-0" />
                            <span>{entry.metadata.mood}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 theme-text-secondary shrink-0">
                          <MessageSquare className="w-2.5 h-2.5" />
                          {entry.messages.length}
                        </span>
                      </div>

                      {/* Delete Button */}
                      <button
                        id={`btn-delete-entry-${entry.id}`}
                        onClick={(e) => handleDeleteClick(e, entry)}
                        title={t.deleteEntry}
                        className="opacity-80 md:opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-300 theme-text-secondary transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer: Quick tools & Vault export */}
        <div className="p-3 border-t theme-border theme-bg-surface text-xs theme-text-secondary space-y-2 shrink-0 mt-auto">
          {/* My Memories (Google Places) Button */}
          {onOpenMemories && (
            <button
              id="btn-sidebar-memories"
              onClick={onOpenMemories}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/20 transition-all shadow-2xs group"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t.myMemoriesPlaces}</span>
              </span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100 font-normal">
                By City
              </span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold theme-text-secondary hover:theme-accent-text transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>{t.exportVault}</span>
            </button>

            {onOpenHowToUse ? (
              <button
                onClick={onOpenHowToUse}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A73E8] dark:text-[#E8A33D] hover:underline transition-colors"
              >
                <Feather className="w-3 h-3" />
                <span>{t.howToUse}</span>
              </button>
            ) : (
              <span className="text-[10px] font-semibold text-[#1A73E8] dark:text-[#E8A33D]">
                {t.geminiVersion}
              </span>
            )}
          </div>

          {/* Mental Health Crisis Support Link */}
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between pt-1.5 border-t theme-border text-[10px] theme-text-secondary hover:theme-text-primary transition-colors group"
          >
            <span className="flex items-center gap-1 truncate">
              <HeartHandshake className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{t.needToTalk}</span>
            </span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0 ml-1" />
          </a>
        </div>
      </aside>

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!entryPendingDelete}
        onClose={() => setEntryPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        entryTitle={entryPendingDelete?.title}
        isDeleting={isDeleting}
      />
    </>
  );
};
