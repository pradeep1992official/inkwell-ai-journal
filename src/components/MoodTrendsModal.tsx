import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  X,
  Calendar,
  Smile,
  Sparkles,
  BarChart2,
  Activity,
  Info,
  Clock,
  ChevronRight,
  ShieldCheck,
  Flame,
  Heart,
  CloudSun
} from 'lucide-react';
import { JournalEntry } from '../types';
import { usePreferences } from '../context/PreferencesContext';
import { analyzeWeatherPatterns } from '../lib/weatherService';

export type MoodTimeRange = '14d' | '30d' | '90d' | 'all';

interface MoodTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSelectEntry?: (entryId: string) => void;
}

interface MoodConfig {
  label: string;
  emoji: string;
  level: number; // 1 to 4 scale
  color: string;
  bgLight: string;
  borderLight: string;
}

const KNOWN_MOODS: Record<string, MoodConfig> = {
  optimistic: {
    label: 'Optimistic',
    emoji: '✨',
    level: 4,
    color: '#E8A33D',
    bgLight: 'rgba(232, 163, 61, 0.15)',
    borderLight: 'rgba(232, 163, 61, 0.35)',
  },
  inspired: {
    label: 'Inspired',
    emoji: '💡',
    level: 4,
    color: '#9C27B0',
    bgLight: 'rgba(156, 39, 176, 0.15)',
    borderLight: 'rgba(156, 39, 176, 0.35)',
  },
  energized: {
    label: 'Energized',
    emoji: '⚡',
    level: 4,
    color: '#00ACC1',
    bgLight: 'rgba(0, 172, 193, 0.15)',
    borderLight: 'rgba(0, 172, 193, 0.35)',
  },
  grateful: {
    label: 'Grateful',
    emoji: '🙏',
    level: 3,
    color: '#43A047',
    bgLight: 'rgba(67, 160, 71, 0.15)',
    borderLight: 'rgba(67, 160, 71, 0.35)',
  },
  calm: {
    label: 'Calm',
    emoji: '😌',
    level: 3,
    color: '#1E88E5',
    bgLight: 'rgba(30, 136, 229, 0.15)',
    borderLight: 'rgba(30, 136, 229, 0.35)',
  },
  reflective: {
    label: 'Reflective',
    emoji: '🤔',
    level: 2,
    color: '#5E35B1',
    bgLight: 'rgba(94, 53, 177, 0.15)',
    borderLight: 'rgba(94, 53, 177, 0.35)',
  },
  challenged: {
    label: 'Challenged',
    emoji: '🧗',
    level: 1,
    color: '#FB8C00',
    bgLight: 'rgba(251, 140, 0, 0.15)',
    borderLight: 'rgba(251, 140, 0, 0.35)',
  },
  anxious: {
    label: 'Anxious',
    emoji: '🌊',
    level: 1,
    color: '#E53935',
    bgLight: 'rgba(229, 57, 53, 0.15)',
    borderLight: 'rgba(229, 57, 53, 0.35)',
  },
};

function resolveMoodConfig(moodString?: string): MoodConfig {
  if (!moodString) {
    return {
      label: 'Reflective',
      emoji: '💭',
      level: 2,
      color: '#8E24AA',
      bgLight: 'rgba(142, 36, 170, 0.15)',
      borderLight: 'rgba(142, 36, 170, 0.3)',
    };
  }

  const key = moodString.toLowerCase().trim();
  if (KNOWN_MOODS[key]) {
    return KNOWN_MOODS[key];
  }

  // Fallback for custom or localized mood strings
  let emoji = '💭';
  let level = 2.5;
  let color = '#1A73E8';

  if (/calm|paz|calme|शांत|அமைதி/i.test(key)) {
    emoji = '😌';
    level = 3;
    color = '#1E88E5';
  } else if (/grat|agrad|recon|आभार|நன்றி/i.test(key)) {
    emoji = '🙏';
    level = 3;
    color = '#43A047';
  } else if (/opti|hope|esper|आशा|நம்பிக்கை/i.test(key)) {
    emoji = '✨';
    level = 4;
    color = '#E8A33D';
  } else if (/insp|crea|प्रेर|ஊக்கம்/i.test(key)) {
    emoji = '💡';
    level = 4;
    color = '#9C27B0';
  } else if (/ener|vital|ऊर्जा|சுறுசுறுப்பு/i.test(key)) {
    emoji = '⚡';
    level = 4;
    color = '#00ACC1';
  } else if (/anx|ans|पंस|பதட்ட/i.test(key)) {
    emoji = '🌊';
    level = 1;
    color = '#E53935';
  } else if (/chall|desaf|चुनौती|சவால்/i.test(key)) {
    emoji = '🧗';
    level = 1;
    color = '#FB8C00';
  }

  return {
    label: moodString,
    emoji,
    level,
    color,
    bgLight: `${color}25`,
    borderLight: `${color}55`,
  };
}

export const MoodTrendsModal: React.FC<MoodTrendsModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSelectEntry,
}) => {
  const { t, language } = usePreferences();
  const [timeRange, setTimeRange] = useState<MoodTimeRange>('30d');
  const [activeTab, setActiveTab] = useState<'timeline' | 'frequency'>('timeline');
  const [hoveredEntry, setHoveredEntry] = useState<{
    id: string;
    title: string;
    dateStr: string;
    mood: string;
    emoji: string;
    color: string;
    level: number;
    x: number;
    y: number;
  } | null>(null);

  // Filter entries according to active scope and exclude soft-deleted ones
  const filteredData = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;
    if (timeRange === '14d') {
      cutoff = now - 14 * 24 * 60 * 60 * 1000;
    } else if (timeRange === '30d') {
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    } else if (timeRange === '90d') {
      cutoff = now - 90 * 24 * 60 * 60 * 1000;
    }

    // Only active entries with a tagged mood
    const valid = entries
      .filter((e) => !e.deletedAt && e.metadata?.mood && e.createdAt >= cutoff)
      .sort((a, b) => a.createdAt - b.createdAt); // Chronological order

    return valid;
  }, [entries, timeRange]);

  // Aggregate stats
  const stats = useMemo(() => {
    const counts: Record<string, { count: number; config: MoodConfig }> = {};
    const dateSet = new Set<string>();

    filteredData.forEach((e) => {
      const mood = e.metadata?.mood || 'Reflective';
      const config = resolveMoodConfig(mood);
      const key = mood.toLowerCase();

      if (!counts[key]) {
        counts[key] = { count: 0, config };
      }
      counts[key].count += 1;

      const d = new Date(e.createdAt).toDateString();
      dateSet.add(d);
    });

    const list = Object.values(counts).sort((a, b) => b.count - a.count);
    const topMood = list[0]?.config?.label || 'None';
    const topEmoji = list[0]?.config?.emoji || '—';
    const topCount = list[0]?.count || 0;

    return {
      totalMoodEntries: filteredData.length,
      uniqueMoodCount: list.length,
      activeDays: dateSet.size,
      topMood,
      topEmoji,
      topCount,
      distribution: list,
    };
  }, [filteredData]);

  // Statistical observational analysis of reflection length and mood across weather conditions
  const weatherPatterns = useMemo(() => analyzeWeatherPatterns(entries), [entries]);

  if (!isOpen) return null;

  // Chart Dimensions & Coordinate calculations
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 32;

  // Y-axis mappings (Level 4 -> top, Level 1 -> bottom)
  const getY = (level: number) => {
    const minLevel = 1;
    const maxLevel = 4;
    const range = maxLevel - minLevel;
    const normalized = (level - minLevel) / range; // 0 to 1
    return svgHeight - paddingY - normalized * (svgHeight - paddingY * 2);
  };

  const chartPoints = filteredData.map((entry, idx) => {
    const config = resolveMoodConfig(entry.metadata?.mood);
    const count = filteredData.length;
    const x =
      count === 1
        ? svgWidth / 2
        : paddingX + (idx / (count - 1)) * (svgWidth - paddingX * 2);
    const y = getY(config.level);

    return {
      entry,
      config,
      x,
      y,
    };
  });

  // Create smooth SVG polyline / curve path
  const pathD =
    chartPoints.length > 0
      ? chartPoints.reduce((acc, curr, idx, arr) => {
          if (idx === 0) return `M ${curr.x} ${curr.y}`;
          const prev = arr[idx - 1];
          const cp1x = prev.x + (curr.x - prev.x) / 2;
          const cp1y = prev.y;
          const cp2x = prev.x + (curr.x - prev.x) / 2;
          const cp2y = curr.y;
          return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }, '')
      : '';

  const areaD =
    chartPoints.length > 0
      ? `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${svgHeight - paddingY + 10} L ${chartPoints[0].x} ${svgHeight - paddingY + 10} Z`
      : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl theme-bg-surface border theme-border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden theme-text-primary transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b theme-border flex items-center justify-between theme-bg-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-gemini-display font-bold text-base sm:text-lg theme-text-primary">
                  {t.moodTrends}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-amber-500/15 text-[#1A73E8] dark:text-[#E8A33D] border border-blue-500/20">
                  Observational
                </span>
              </div>
              <p className="text-xs theme-text-secondary">
                {t.moodTrendsSubtitle}
              </p>
            </div>
          </div>

          <button
            id="btn-close-mood-trends"
            onClick={onClose}
            title={t.dismiss}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:theme-bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Controls Bar: Time Range Selector & View Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
            {/* Time Range Pills */}
            <div className="inline-flex items-center p-1 rounded-2xl theme-bg-subtle border theme-border shadow-2xs">
              {(
                [
                  { id: '14d', label: t.timeRange2Weeks },
                  { id: '30d', label: t.timeRange1Month },
                  { id: '90d', label: t.timeRange3Months },
                  { id: 'all', label: t.timeRangeAllTime },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  id={`btn-range-${tab.id}`}
                  onClick={() => setTimeRange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    timeRange === tab.id
                      ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] shadow-xs'
                      : 'theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Switcher */}
            <div className="inline-flex items-center p-1 rounded-2xl theme-bg-subtle border theme-border shadow-2xs">
              <button
                id="btn-view-timeline"
                onClick={() => setActiveTab('timeline')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'timeline'
                    ? 'theme-bg-surface theme-text-primary shadow-xs border theme-border'
                    : 'theme-text-secondary hover:theme-text-primary'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{t.moodTrajectory}</span>
              </button>
              <button
                id="btn-view-frequency"
                onClick={() => setActiveTab('frequency')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'frequency'
                    ? 'theme-bg-surface theme-text-primary shadow-xs border theme-border'
                    : 'theme-text-secondary hover:theme-text-primary'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>{t.moodDistribution}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-2xl theme-bg-subtle border theme-border shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium theme-text-secondary flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                {t.totalMoodEntries}
              </span>
              <div className="mt-1 text-lg sm:text-xl font-bold font-gemini-display theme-text-primary">
                {stats.totalMoodEntries}
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl theme-bg-subtle border theme-border shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium theme-text-secondary flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 opacity-70 text-amber-500" />
                {t.dominantMood}
              </span>
              <div className="mt-1 text-base sm:text-lg font-bold font-gemini-display theme-text-primary flex items-center gap-1.5 truncate">
                <span>{stats.topEmoji}</span>
                <span className="truncate">{stats.topMood}</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl theme-bg-subtle border theme-border shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium theme-text-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 opacity-70 text-purple-500" />
                {t.moodDiversity}
              </span>
              <div className="mt-1 text-lg sm:text-xl font-bold font-gemini-display theme-text-primary">
                {stats.uniqueMoodCount}
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl theme-bg-subtle border theme-border shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-medium theme-text-secondary flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 opacity-70 text-orange-500" />
                Active Days
              </span>
              <div className="mt-1 text-lg sm:text-xl font-bold font-gemini-display theme-text-primary">
                {stats.activeDays}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredData.length === 0 ? (
            <div className="py-12 px-6 rounded-3xl border border-dashed theme-border theme-bg-subtle/50 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Smile className="w-6 h-6" />
              </div>
              <h4 className="font-gemini-display font-bold text-sm sm:text-base theme-text-primary mb-1">
                {t.noMoodData}
              </h4>
              <p className="text-xs theme-text-secondary max-w-sm leading-relaxed">
                {t.noMoodDataDesc}
              </p>
            </div>
          ) : activeTab === 'timeline' ? (
            /* View 1: Interactive Mood Timeline Chart */
            <div className="space-y-3">
              <div className="p-4 sm:p-5 rounded-3xl theme-bg-subtle border theme-border shadow-xs relative overflow-hidden">
                {/* Visual Chart Header */}
                <div className="flex items-center justify-between text-xs theme-text-secondary mb-2">
                  <span className="font-semibold">{t.moodTrajectory}</span>
                  <span className="text-[11px]">
                    {chartPoints.length} reflections plotted chronologically
                  </span>
                </div>

                {/* SVG Visual Canvas */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[500px]">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-52 overflow-visible select-none"
                    >
                      <defs>
                        <linearGradient
                          id="moodAreaGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#1A73E8"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#1A73E8"
                            stopOpacity="0.0"
                          />
                        </linearGradient>
                      </defs>

                      {/* Reference Grid & Lane Labels */}
                      {[
                        {
                          level: 4,
                          label: 'High Energy / Joy (Optimistic, Inspired, Energized)',
                        },
                        {
                          level: 3,
                          label: 'Centered & Grounded (Grateful, Calm)',
                        },
                        { level: 2, label: 'Contemplative (Reflective)' },
                        {
                          level: 1,
                          label: 'Tension / Effort (Challenged, Anxious)',
                        },
                      ].map((lane) => {
                        const y = getY(lane.level);
                        return (
                          <g key={lane.level}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={svgWidth - paddingX}
                              y2={y}
                              stroke="currentColor"
                              strokeDasharray="4 4"
                              className="text-gray-200 dark:text-neutral-800"
                              strokeWidth="1"
                            />
                            <text
                              x={paddingX}
                              y={y - 5}
                              fontSize="9"
                              fill="currentColor"
                              className="text-gray-400 dark:text-neutral-500 font-medium"
                            >
                              {lane.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* Gradient Filled Area */}
                      {areaD && (
                        <path
                          d={areaD}
                          fill="url(#moodAreaGradient)"
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Connecting Line */}
                      {pathD && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#1A73E8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="dark:stroke-[#E8A33D] transition-all duration-300"
                        />
                      )}

                      {/* Data Points */}
                      {chartPoints.map((pt, i) => {
                        const isHovered = hoveredEntry?.id === pt.entry.id;
                        const dateObj = new Date(pt.entry.createdAt);
                        const dateStr = dateObj.toLocaleDateString(language, {
                          month: 'short',
                          day: 'numeric',
                        });

                        return (
                          <g key={pt.entry.id}>
                            {/* Halo on hover */}
                            {isHovered && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="12"
                                fill={pt.config.color}
                                fillOpacity="0.2"
                                className="animate-ping"
                              />
                            )}

                            {/* Point Node */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 6.5 : 5}
                              fill={pt.config.color}
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="cursor-pointer transition-all duration-150 filter drop-shadow-xs"
                              onMouseEnter={() => {
                                setHoveredEntry({
                                  id: pt.entry.id,
                                  title: pt.entry.title || t.untitledReflection,
                                  dateStr,
                                  mood: pt.config.label,
                                  emoji: pt.config.emoji,
                                  color: pt.config.color,
                                  level: pt.config.level,
                                  x: pt.x,
                                  y: pt.y,
                                });
                              }}
                              onMouseLeave={() => setHoveredEntry(null)}
                              onClick={() => {
                                if (onSelectEntry) {
                                  onSelectEntry(pt.entry.id);
                                  onClose();
                                }
                              }}
                            />

                            {/* Date ticks along bottom */}
                            {(i === 0 ||
                              i === chartPoints.length - 1 ||
                              i % Math.ceil(chartPoints.length / 5) === 0) && (
                              <text
                                x={pt.x}
                                y={svgHeight - 8}
                                textAnchor="middle"
                                fontSize="9.5"
                                fill="currentColor"
                                className="text-gray-400 dark:text-neutral-500 font-sans"
                              >
                                {dateStr}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Floating Tooltip info */}
                {hoveredEntry && (
                  <div
                    className="absolute z-50 p-2.5 rounded-xl theme-bg-surface border theme-border shadow-xl backdrop-blur-md pointer-events-none transition-all text-xs"
                    style={{
                      left: Math.min(Math.max(hoveredEntry.x - 60, 16), svgWidth - 160),
                      top: Math.max(hoveredEntry.y - 65, 10),
                    }}
                  >
                    <div className="flex items-center gap-1.5 font-bold theme-text-primary">
                      <span>{hoveredEntry.emoji}</span>
                      <span>{hoveredEntry.mood}</span>
                      <span className="text-[10px] theme-text-secondary font-normal ml-1">
                        {hoveredEntry.dateStr}
                      </span>
                    </div>
                    <div className="text-[11px] theme-text-secondary truncate max-w-[200px] mt-0.5">
                      "{hoveredEntry.title}"
                    </div>
                  </div>
                )}
              </div>

              {/* Chronological Flow List */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider theme-text-secondary px-1">
                  Reflection Sequence ({filteredData.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredData.map((e) => {
                    const cfg = resolveMoodConfig(e.metadata?.mood);
                    const dateFormatted = new Date(e.createdAt).toLocaleDateString(
                      language,
                      {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      }
                    );

                    return (
                      <div
                        key={e.id}
                        onClick={() => {
                          if (onSelectEntry) {
                            onSelectEntry(e.id);
                            onClose();
                          }
                        }}
                        className="p-2.5 rounded-2xl theme-bg-subtle hover:theme-bg-hover border theme-border transition-colors flex items-center justify-between gap-2.5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{cfg.emoji}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold theme-text-primary truncate group-hover:theme-accent-text transition-colors">
                              {e.title || t.untitledReflection}
                            </div>
                            <div className="text-[10px] theme-text-secondary flex items-center gap-1.5">
                              <span>{dateFormatted}</span>
                              <span>•</span>
                              <span className="font-medium" style={{ color: cfg.color }}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 theme-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* View 2: Mood Frequency Distribution Bars */
            <div className="p-4 sm:p-5 rounded-3xl theme-bg-subtle border theme-border shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs theme-text-secondary">
                <span className="font-semibold">{t.moodDistribution}</span>
                <span>Sorted by most selected</span>
              </div>

              <div className="space-y-3">
                {stats.distribution.map((item) => {
                  const percent =
                    stats.totalMoodEntries > 0
                      ? Math.round((item.count / stats.totalMoodEntries) * 100)
                      : 0;

                  return (
                    <div key={item.config.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium theme-text-primary">
                          <span className="text-base">{item.config.emoji}</span>
                          <span>{item.config.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold theme-text-primary">{item.count}</span>
                          <span className="text-[11px] theme-text-secondary">
                            ({percent}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden p-0.5 border theme-border/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.config.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ambient Weather & Writing Patterns (Open-Meteo Insight) */}
          {weatherPatterns && (
            <div id="card-weather-patterns" className="p-4 sm:p-5 rounded-3xl theme-bg-subtle border theme-border shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <CloudSun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold theme-text-primary">
                      Ambient Weather Patterns
                    </h4>
                    <p className="text-[10px] theme-text-secondary">
                      Correlating reflections with open atmospheric conditions
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  {weatherPatterns.totalWeatherEntries} {weatherPatterns.totalWeatherEntries === 1 ? 'entry' : 'entries'} with weather
                </span>
              </div>

              {weatherPatterns.hasSufficientData ? (
                <div className="space-y-3">
                  {/* Primary & Secondary Factual Observation */}
                  <div className="p-3 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 text-xs text-sky-900 dark:text-sky-200 leading-relaxed font-medium">
                    {weatherPatterns.primaryObservation}
                    {weatherPatterns.secondaryObservation && (
                      <span className="block mt-1 font-normal opacity-90">
                        {weatherPatterns.secondaryObservation}
                      </span>
                    )}
                  </div>

                  {/* Weather Condition Breakdown Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {weatherPatterns.conditionBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="p-3 rounded-2xl theme-bg-surface border theme-border flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0" role="img" aria-label={item.label}>
                            {item.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold theme-text-primary truncate">
                              {item.label}
                            </p>
                            <p className="text-[10px] theme-text-secondary">
                              {item.count} {item.count === 1 ? 'reflection' : 'reflections'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold theme-text-primary">
                            ~{item.avgWords} <span className="text-[10px] font-normal theme-text-secondary">words</span>
                          </p>
                          {item.topMood && (
                            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                              Top: {item.topMood}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl theme-bg-surface border theme-border text-xs theme-text-secondary flex items-start gap-2.5 leading-relaxed">
                  <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium theme-text-primary">
                      {weatherPatterns.primaryObservation}
                    </p>
                    <p className="text-[11px] mt-1 opacity-80">
                      As you create reflections with weather attached or backfill historical entries with attached places, factual correlations between ambient weather and reflection depth will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Observational Notice */}
          <div className="p-3 sm:p-3.5 rounded-2xl theme-bg-subtle/80 border theme-border flex items-start gap-2.5 text-[11px] theme-text-secondary leading-relaxed">
            <Info className="w-4 h-4 theme-accent-text shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold theme-text-primary mr-1">
                Observational Reflection:
              </span>
              {t.purelyObservationalNotice} No automated judgements, diagnostic claims, or unsolicited advice are applied.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t theme-border flex items-center justify-end theme-bg-subtle shrink-0">
          <button
            id="btn-close-mood-trends-footer"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold theme-bg-surface hover:theme-bg-hover border theme-border theme-text-primary transition-all shadow-xs active:scale-95"
          >
            {t.dismiss || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
