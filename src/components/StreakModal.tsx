import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, Calendar, CheckCircle2, X, Sparkles } from 'lucide-react';
import { JournalEntry } from '../types';
import { calculateStreakStats, getLocalDateString } from '../lib/streakService';
import { usePreferences } from '../context/PreferencesContext';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose, entries }) => {
  const { t } = usePreferences();

  const stats = useMemo(() => {
    return calculateStreakStats(entries);
  }, [entries]);

  const todayStr = getLocalDateString(Date.now());
  const hasJournaledToday = stats.activityDays.some((d) => d.date === todayStr && d.hasEntry);

  if (!isOpen) return null;

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full max-w-lg theme-bg-surface border theme-border rounded-3xl shadow-2xl p-6 sm:p-7 z-10 overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b theme-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/20 text-amber-500 flex items-center justify-center shadow-xs">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="font-gemini-display font-bold text-lg theme-text-primary">
                  {t.streakTitle}
                </h3>
                <p className="text-xs theme-text-secondary">
                  {hasJournaledToday ? t.streakActiveToday : t.streakNeedsEntry}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Metric Cards */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <Flame className="w-4 h-4 fill-amber-500" />
                <span className="text-xl font-bold font-gemini-display theme-text-primary">{stats.currentStreak}</span>
              </div>
              <span className="text-[11px] font-medium theme-text-secondary">{t.currentStreak}</span>
            </div>

            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border text-center">
              <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xl font-bold font-gemini-display theme-text-primary">{stats.longestStreak}</span>
              </div>
              <span className="text-[11px] font-medium theme-text-secondary">{t.longestStreak}</span>
            </div>

            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xl font-bold font-gemini-display theme-text-primary">{stats.totalDaysWithEntries}</span>
              </div>
              <span className="text-[11px] font-medium theme-text-secondary">{t.totalDaysReflected}</span>
            </div>
          </div>

          {/* Activity Heatmap Grid */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold theme-text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 theme-accent-text" />
                {t.streakHeatmapTitle}
              </span>
              <span className="text-[10px] theme-text-secondary">
                {stats.activityDays.filter((d) => d.hasEntry).length} reflections logged
              </span>
            </div>

            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
              {/* Day of week labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-semibold theme-text-muted mb-1.5">
                {dayLabels.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>

              {/* 42-cell activity matrix */}
              <div className="grid grid-cols-7 gap-1.5">
                {stats.activityDays.map((day) => {
                  const isToday = day.date === todayStr;
                  return (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} reflection${day.count === 1 ? '' : 's'}`}
                      className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-medium transition-all ${
                        day.hasEntry
                          ? 'bg-[#1A73E8] dark:bg-[#E8A33D] text-white dark:text-[#171310] font-bold shadow-xs'
                          : 'theme-bg-surface text-gray-400 dark:text-gray-600 border theme-border'
                      } ${isToday ? 'ring-2 ring-blue-400 dark:ring-amber-300' : ''}`}
                    >
                      {new Date(day.date + 'T00:00:00').getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t theme-border flex items-center justify-between text-xs theme-text-secondary">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Daily mindful reflection
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#E8A33D] dark:hover:bg-[#D9932E] text-white dark:text-[#171310] text-xs font-semibold shadow-xs"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
