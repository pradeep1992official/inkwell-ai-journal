import { JournalEntry } from '../types';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysWithEntries: number;
  lastEntryDate: string | null;
  activityDays: {
    date: string;
    dayOfWeek: number;
    count: number;
    hasEntry: boolean;
  }[];
}

/**
 * Returns YYYY-MM-DD in user's local timezone.
 */
export function getLocalDateString(timestamp: number | Date): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates user journaling streaks and last 42 days (6 weeks) heatmap grid.
 */
export function calculateStreakStats(entries: JournalEntry[]): StreakStats {
  const countsByDate = new Map<string, number>();

  const activeEntries = entries.filter((entry) => !entry.deletedAt);

  activeEntries.forEach((entry) => {
    const dStr = getLocalDateString(entry.createdAt || entry.updatedAt);
    countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
  });

  const uniqueDates = Array.from(countsByDate.keys()).sort();
  const totalDaysWithEntries = uniqueDates.length;

  if (uniqueDates.length === 0) {
    // Generate empty 42 days
    const activityDays = generateRecentDays(countsByDate, 42);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysWithEntries: 0,
      lastEntryDate: null,
      activityDays,
    };
  }

  // Calculate Longest Streak
  let longestStreak = 0;
  let runningStreak = 0;
  let prevTime: number | null = null;

  uniqueDates.forEach((dStr) => {
    const [y, m, d] = dStr.split('-').map(Number);
    const currTime = new Date(y, m - 1, d).getTime();

    if (prevTime === null) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round((currTime - prevTime) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevTime = currTime;
  });

  // Calculate Current Streak
  const todayStr = getLocalDateString(Date.now());
  const yesterdayStr = getLocalDateString(Date.now() - 86400000);

  let currentStreak = 0;
  let checkDate = new Date();

  // If user hasn't journaled today yet, check if they journaled yesterday to continue streak
  if (!countsByDate.has(todayStr)) {
    if (countsByDate.has(yesterdayStr)) {
      checkDate = new Date(Date.now() - 86400000);
    }
  }

  const checkDateStr = getLocalDateString(checkDate);
  if (countsByDate.has(checkDateStr)) {
    while (true) {
      const curStr = getLocalDateString(checkDate);
      if (countsByDate.has(curStr)) {
        currentStreak += 1;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  const lastEntryDate = uniqueDates[uniqueDates.length - 1];
  const activityDays = generateRecentDays(countsByDate, 42);

  return {
    currentStreak,
    longestStreak,
    totalDaysWithEntries,
    lastEntryDate,
    activityDays,
  };
}

function generateRecentDays(
  countsByDate: Map<string, number>,
  numDays: number = 42
): StreakStats['activityDays'] {
  const result: StreakStats['activityDays'] = [];
  const now = new Date();

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dStr = getLocalDateString(d);
    const count = countsByDate.get(dStr) || 0;
    result.push({
      date: dStr,
      dayOfWeek: d.getDay(),
      count,
      hasEntry: count > 0,
    });
  }

  return result;
}
