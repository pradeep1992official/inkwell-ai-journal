import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Compass,
  ChevronDown,
  ChevronRight,
  Calendar,
  Sparkles,
  Search,
  X,
  Smile,
  ArrowUpRight,
  Building2,
  Navigation,
  Globe,
  Plus,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { groupEntriesByCity, extractCityFromAddress } from '../lib/placesService';
import { usePreferences } from '../context/PreferencesContext';

interface MyMemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSelectEntry: (entryId: string) => void;
  onNewEntry?: () => void;
}

export const MyMemoriesModal: React.FC<MyMemoriesModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSelectEntry,
  onNewEntry,
}) => {
  const { t } = usePreferences();
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});

  // Group location-tagged entries
  const cityGroups = useMemo(() => {
    return groupEntriesByCity(entries);
  }, [entries]);

  // City list sorted by number of memories descending
  const sortedCities = useMemo(() => {
    return Object.values(cityGroups).sort((a, b) => b.count - a.count);
  }, [cityGroups]);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!searchFilter.trim()) return sortedCities;
    const q = searchFilter.toLowerCase();
    return sortedCities.filter(
      (group) =>
        group.city.toLowerCase().includes(q) ||
        group.entries.some(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.metadata.placeLocation?.name.toLowerCase().includes(q) ||
            e.metadata.placeLocation?.formattedAddress.toLowerCase().includes(q)
        )
    );
  }, [sortedCities, searchFilter]);

  const totalLocationMemories = useMemo(() => {
    return sortedCities.reduce((acc, curr) => acc + curr.count, 0);
  }, [sortedCities]);

  const isCityExpanded = (city: string): boolean => {
    if (expandedCities[city] !== undefined) {
      return expandedCities[city];
    }
    return true; // default expanded
  };

  const toggleCity = (city: string) => {
    setExpandedCities((prev) => {
      const current = prev[city] !== undefined ? prev[city] : true;
      return {
        ...prev,
        [city]: !current,
      };
    });
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    sortedCities.forEach((c) => {
      next[c.city] = true;
    });
    setExpandedCities(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    sortedCities.forEach((c) => {
      next[c.city] = false;
    });
    setExpandedCities(next);
  };

  const toggleSnippet = (entryId: string) => {
    setExpandedSnippets((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[88vh] rounded-2xl theme-bg-surface theme-border border shadow-2xl overflow-hidden flex flex-col"
          id="my-memories-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b theme-border bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20 shadow-2xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-gemini-display theme-text-primary flex items-center gap-2">
                  🗺️ {t.myMemories}
                </h2>
                <p className="text-xs sm:text-sm theme-text-secondary">
                  {t.memoriesByCitySubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
              aria-label="Close"
              id="btn-close-memories-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar & Filter */}
          <div className="p-4 sm:p-5 border-b theme-border theme-bg-subtle/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {totalLocationMemories} {totalLocationMemories === 1 ? 'Location Memory' : 'Location Memories'}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full theme-bg-surface theme-text-secondary border theme-border">
                  {sortedCities.length} {sortedCities.length === 1 ? 'City' : 'Cities'}
                </span>
              </div>

              {sortedCities.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={expandAll}
                    id="btn-memories-expand-all"
                    className="px-2.5 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold transition-colors cursor-pointer active:scale-95"
                    title="Expand all city accordions"
                  >
                    Expand All
                  </button>
                  <span className="theme-text-secondary select-none">•</span>
                  <button
                    type="button"
                    onClick={collapseAll}
                    id="btn-memories-collapse-all"
                    className="px-2.5 py-1 rounded-lg theme-text-secondary hover:theme-text-primary hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors cursor-pointer active:scale-95"
                    title="Collapse all city accordions"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </div>

            {/* Search Input */}
            {sortedCities.length > 0 && (
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter by city, venue, or reflection keyword..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl theme-bg-surface theme-text-primary border theme-border focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  id="input-memories-filter"
                />
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-2.5 p-0.5 rounded text-muted hover:theme-text-primary cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
            {/* Empty State */}
            {sortedCities.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed theme-border theme-bg-subtle text-center space-y-4 my-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold theme-text-primary">
                    Start Building Your Memory Map
                  </h3>
                  <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed">
                    You haven't attached any Google Places locations to your journal reflections yet. Whenever you write, tap <span className="font-semibold text-emerald-600 dark:text-emerald-400">“📍 Add Location”</span> to tag where your thoughts took place.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 max-w-sm mx-auto text-left text-xs theme-text-secondary space-y-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                    ✨ Example Clustered Map:
                  </span>
                  <div className="font-mono text-[11px] space-y-0.5 text-emerald-800 dark:text-emerald-200">
                    <div>📍 Coimbatore — 47 memories</div>
                    <div>📍 Chennai — 23 memories</div>
                    <div>📍 Bengaluru — 12 memories</div>
                  </div>
                </div>

                {onNewEntry && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNewEntry();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Write a Reflection with Location
                  </button>
                )}
              </div>
            )}

            {/* Filtered Empty Results */}
            {sortedCities.length > 0 && filteredCities.length === 0 && (
              <div className="p-6 text-center theme-text-secondary text-xs">
                No memories match <span className="font-bold">"{searchFilter}"</span>.
              </div>
            )}

            {/* Clustered City Accordions */}
            {filteredCities.map((group) => {
              const isExpanded = isCityExpanded(group.city);
              return (
                <div
                  key={group.city}
                  className="rounded-xl border theme-border theme-bg-surface overflow-hidden transition-all shadow-2xs"
                >
                  {/* City Header Accordion Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleCity(group.city)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:theme-bg-subtle transition-colors group cursor-pointer select-none"
                    id={`city-accordion-${group.city.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-bold theme-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <span>{group.city}</span>
                          <span className="text-xs font-normal theme-text-secondary">
                            — {group.count} {group.count === 1 ? 'memory' : 'memories'}
                          </span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        {group.count}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 theme-text-secondary transition-transform" />
                      ) : (
                        <ChevronRight className="w-4 h-4 theme-text-secondary transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Individual Reflections within City */}
                  {isExpanded && (
                    <div className="px-4 pb-3.5 pt-1 space-y-2 border-t theme-border theme-bg-subtle/30">
                      {group.entries.map((entry) => {
                        const loc = entry.metadata.placeLocation;
                        const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        const firstMsg = entry.messages.find((m) => m.role === 'user')?.content || '';
                        const snippet = firstMsg.slice(0, 140) || 'Personal reflection';
                        const isSnippetOpen = !!expandedSnippets[entry.id];

                        return (
                          <div
                            key={entry.id}
                            onClick={() => {
                              onSelectEntry(entry.id);
                              onClose();
                            }}
                            className="p-3 rounded-xl border theme-border theme-bg-surface hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs sm:text-sm font-bold theme-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                  {entry.title || 'Untitled Reflection'}
                                </h5>
                                {entry.metadata.mood && (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 flex items-center gap-1">
                                    <Smile className="w-2.5 h-2.5" />
                                    {entry.metadata.mood}
                                  </span>
                                )}
                              </div>

                              {/* Place Name & Address */}
                              {loc && (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                                  <Building2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{loc.name}</span>
                                </div>
                              )}

                              {/* Snippet with Read More Toggle */}
                              <div className="text-[11px] theme-text-secondary">
                                <p className={`italic ${isSnippetOpen ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                                  "{isSnippetOpen ? firstMsg : snippet}"
                                </p>
                                {firstMsg.length > 140 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSnippet(entry.id);
                                    }}
                                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold mt-0.5 cursor-pointer inline-block"
                                  >
                                    {isSnippetOpen ? 'Show less' : 'Read full reflection'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Date & View Action */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 theme-border">
                              <span className="text-[10px] theme-text-secondary flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {dateStr}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectEntry(entry.id);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold theme-bg-subtle group-hover:bg-emerald-500/15 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                title="Open this memory in journal"
                              >
                                <span>Open</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-3 border-t theme-border theme-bg-subtle flex items-center justify-between text-xs theme-text-secondary">
            <span className="text-[11px]">
              🔒 Private to your vault • Owner-isolated in Firestore
            </span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg theme-bg-surface hover:theme-bg-hover border theme-border font-medium theme-text-primary transition-colors text-xs"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
