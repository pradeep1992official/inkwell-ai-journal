import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  X,
  Calendar,
  Smile,
  Tag,
  MapPin,
  Loader2,
  BrainCircuit,
  ArrowRight,
  Database,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { JournalEntry, AskMyLifeResult, MemoryCitation } from '../types';
import { askMyLife, backfillMissingEmbeddings, extractEntrySearchableText } from '../lib/semanticSearchService';
import { usePreferences } from '../context/PreferencesContext';

interface AskMyLifeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  userId: string;
  userName?: string;
  onSelectEntry: (entry: JournalEntry) => void;
  initialQuery?: string;
}

const SAMPLE_QUESTIONS = [
  'When was the last time I felt really proud?',
  'What did I write about my first project?',
  'Have I mentioned feeling stressed about work recently?',
  'What are the things that made me feel most grateful?',
  'How have my emotions evolved around major decisions?',
];

export const AskMyLifeModal: React.FC<AskMyLifeModalProps> = ({
  isOpen,
  onClose,
  entries,
  userId,
  userName,
  onSelectEntry,
  initialQuery = '',
}) => {
  const { t, language } = usePreferences();
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [result, setResult] = useState<AskMyLifeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backfill indexing state
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<{ completed: number; total: number } | null>(null);
  const [indexingComplete, setIndexingComplete] = useState(false);

  // Calculate unindexed count
  const unindexedEntries = entries.filter((e) => {
    if (e.deletedAt) return false;
    const text = extractEntrySearchableText(e);
    if (!text) return false;
    return !Array.isArray(e.embedding) || e.embedding.length === 0;
  });

  useEffect(() => {
    if (initialQuery && isOpen) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const handleSearch = async (searchQueryToUse?: string) => {
    const q = (searchQueryToUse !== undefined ? searchQueryToUse : query).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    setLoadingStep('Generating vector embedding...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Scanning vault memories via cosine similarity...');
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Synthesizing date-grounded response with Gemini...');
    }, 1300);

    try {
      const searchRes = await askMyLife(q, userId, entries, {
        language,
        userName,
      });
      setResult(searchRes);
    } catch (err: any) {
      console.error('Ask My Life failed:', err);
      setErrorMessage(err?.message || 'Failed to search your memories. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleRunBackfill = async () => {
    if (isIndexing || unindexedEntries.length === 0) return;
    setIsIndexing(true);
    setIndexProgress({ completed: 0, total: unindexedEntries.length });

    try {
      await backfillMissingEmbeddings(userId, entries, (completed, total) => {
        setIndexProgress({ completed, total });
      });
      setIndexingComplete(true);
      setTimeout(() => {
        setIndexingComplete(false);
        setIndexProgress(null);
      }, 4000);
    } catch (err) {
      console.warn('Backfill failed:', err);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleCitationClick = (citation: MemoryCitation) => {
    const found = entries.find((e) => e.id === citation.id);
    if (found) {
      onSelectEntry(found);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
        />

        {/* Dialog Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl theme-bg-surface border theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b theme-border flex items-center justify-between theme-bg-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-amber-400/10 flex items-center justify-center text-[#1A73E8] dark:text-[#E8A33D] ring-1 ring-[#1A73E8]/20 shadow-xs">
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-gemini-display font-bold theme-text-primary">
                    {t.askMyLife}
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 dark:bg-amber-400/15 text-[#1A73E8] dark:text-[#E8A33D] border border-[#1A73E8]/20">
                    Semantic Search
                  </span>
                </div>
                <p className="text-xs theme-text-secondary mt-0.5">
                  {t.askLifeModalSubtitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-hover transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {/* Unindexed Embeddings Banner */}
            {unindexedEntries.length > 0 && !indexingComplete && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-900 dark:text-amber-200">
                      {unindexedEntries.length} reflection{unindexedEntries.length > 1 ? 's' : ''} not indexed for semantic search
                    </span>
                    <p className="text-amber-700 dark:text-amber-300/80 text-[11px] mt-0.5">
                      Generate vector embeddings to ensure your complete journal history is searchable.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunBackfill}
                  disabled={isIndexing}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 dark:bg-amber-500 text-white dark:text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
                >
                  {isIndexing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        Indexing {indexProgress ? `${indexProgress.completed}/${indexProgress.total}` : '...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Index Memories</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {indexingComplete && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>All memories successfully indexed with Gemini vector embeddings!</span>
              </div>
            )}

            {/* Question Input Box */}
            <div className="space-y-2">
              <label htmlFor="input-ask-my-life-modal" className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider">
                {t.askQuestionLabel}
              </label>
              <div className="relative">
                <textarea
                  id="input-ask-my-life-modal"
                  rows={2}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="e.g. When was the last time I felt really proud? What did I write about my first project?"
                  className="w-full pl-3.5 pr-28 py-2.5 text-sm theme-bg-subtle border theme-border rounded-xl theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#E8A33D] focus:ring-2 focus:ring-[#1A73E8]/20 transition-all resize-none shadow-xs"
                />

                <div className="absolute right-2 bottom-2.5 flex items-center gap-1">
                  {query && !isLoading && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleSearch()}
                    disabled={!query.trim() || isLoading}
                    className="px-3 py-1.5 rounded-lg bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-semibold text-xs flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-all disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.searchButton}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestion Starter Chips */}
            {!result && !isLoading && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold theme-text-secondary flex items-center gap-1.5">
                  <LightbulbIcon className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />
                  {t.suggestedPrompts}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setQuery(q);
                        handleSearch(q);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs theme-bg-subtle hover:theme-bg-hover border theme-border theme-text-secondary hover:theme-text-primary transition-all text-left flex items-center gap-1.5 shadow-2xs hover:border-[#1A73E8]/30 dark:hover:border-[#E8A33D]/30"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-3 h-3 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State with Progress Steps */}
            {isLoading && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[#1A73E8]/20 border-t-[#1A73E8] dark:border-[#E8A33D]/20 dark:border-t-[#E8A33D] animate-spin" />
                  <Sparkles className="w-5 h-5 text-[#1A73E8] dark:text-[#E8A33D] absolute inset-0 m-auto" />
                </div>
                <div>
                  <p className="text-sm font-semibold theme-text-primary">{loadingStep}</p>
                  <p className="text-xs theme-text-secondary mt-1">
                    Searching your memories with vector cosine similarity & Gemini
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !isLoading && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs prose-inline leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                  {errorMessage}
                </ReactMarkdown>
              </div>
            )}

            {/* Synthesized Answer Result */}
            {result && !isLoading && (
              <div className="space-y-6 pt-2">
                {/* Answer Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 dark:bg-amber-400/5 border border-[#1A73E8]/20 dark:border-[#E8A33D]/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1A73E8]/10 dark:border-[#E8A33D]/10">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-[#1A73E8] dark:text-[#E8A33D]" />
                      <span className="text-xs font-gemini-display font-bold theme-text-primary">
                        Memory Synthesis
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] theme-text-secondary">
                      <span>{result.citations.length} cited {result.citations.length === 1 ? 'memory' : 'memories'}</span>
                      <span>•</span>
                      <span>{result.queryTimeMs}ms</span>
                    </div>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed theme-text-primary space-y-3">
                    <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                      {result.answer}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Cited Memories List */}
                {result.citations && result.citations.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold theme-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#E8A33D]" />
                        Cited Vault Memories ({result.citations.length})
                      </h3>
                      <span className="text-[11px] theme-text-muted">
                        Click any memory to open original reflection
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.citations.map((citation) => (
                        <div
                          key={citation.id}
                          onClick={() => handleCitationClick(citation)}
                          className="p-3.5 rounded-xl theme-bg-subtle hover:theme-bg-hover border theme-border hover:border-[#1A73E8]/40 dark:hover:border-[#E8A33D]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-2.5 shadow-2xs hover:shadow-xs"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold theme-text-primary group-hover:text-[#1A73E8] dark:group-hover:text-[#E8A33D] transition-colors line-clamp-1">
                                {citation.title}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#1A73E8]/10 dark:bg-[#E8A33D]/10 text-[#1A73E8] dark:text-[#E8A33D] shrink-0">
                                {citation.similarityScore}% Match
                              </span>
                            </div>

                            <p className="text-xs theme-text-secondary line-clamp-2 italic leading-relaxed">
                              "{citation.snippet}"
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t theme-border text-[11px] theme-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 opacity-70" />
                              <span>{citation.dateFormatted}</span>
                            </div>

                            {citation.mood && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full theme-bg-surface border theme-border font-medium">
                                {citation.mood}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 border-t theme-border flex items-center justify-between theme-bg-subtle shrink-0 text-xs theme-text-secondary">
            <div className="flex items-center gap-1.5">
              <ShieldIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Strictly scoped to your isolated private reflections</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg theme-bg-surface hover:theme-bg-hover border theme-border theme-text-primary font-medium text-xs transition-colors"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function LightbulbIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
