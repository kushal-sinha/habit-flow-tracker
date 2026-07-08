import { Habit, HistoryEntry, UserSettings, StreakStats } from '../types';
import { getLogicalResetDate, isWithinWarningWindow } from './TimeWindowCalculator';
import { calculateOverallStreak, isHabitScheduled } from './streakUtils';

export type StreakState = 'SAFE' | 'IN_PROGRESS' | 'AT_RISK' | 'LOST';

export interface StreakInfo {
  state: StreakState;
  currentStreak: number;
  longestStreak: number;
  completedCount: number;
  totalCount: number;
  remainingCount: number;
  resetTimeStr: string;
  shieldsCount: number;
}

/**
 * Returns today's streak state and stats based on current time, settings, and completions.
 */
export function calculateStreakInfo(
  habits: Habit[],
  history: HistoryEntry[],
  currentTime: Date,
  settings: UserSettings
): StreakInfo {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const logicalToday = getLogicalResetDate(currentTime, settings.dailyResetTime);
  
  // Calculate overall streak numbers (backward compatible)
  const { currentStreak, longestStreak } = calculateOverallStreak(habits, history, logicalToday);
  
  if (activeHabits.length === 0) {
    return {
      state: 'SAFE',
      currentStreak: 0,
      longestStreak: 0,
      completedCount: 0,
      totalCount: 0,
      remainingCount: 0,
      resetTimeStr: settings.dailyResetTime,
      shieldsCount: settings.streakShields,
    };
  }

  // Find habits scheduled for today logical day
  const scheduledHabits = activeHabits.filter((h) => isHabitScheduled(h, logicalToday));
  const totalCount = scheduledHabits.length;
  
  if (totalCount === 0) {
    return {
      state: 'SAFE',
      currentStreak,
      longestStreak,
      completedCount: 0,
      totalCount: 0,
      remainingCount: 0,
      resetTimeStr: settings.dailyResetTime,
      shieldsCount: settings.streakShields,
    };
  }

  // Find how many of today's scheduled habits are completed in history
  const todayCompletions = history.filter(
    (entry) => entry.date === logicalToday && entry.completed && entry.userId === settings.userId
  );
  const completedHabitIds = new Set(todayCompletions.map((c) => c.habitId));
  const completedCount = scheduledHabits.filter((h) => completedHabitIds.has(h.id)).length;
  const remainingCount = totalCount - completedCount;

  let state: StreakState = 'IN_PROGRESS';
  
  if (remainingCount === 0) {
    state = 'SAFE';
  } else {
    // Check if we are within the warning window (1 hour) of the reset time
    const warningActive = isWithinWarningWindow(currentTime, settings.dailyResetTime);
    if (warningActive) {
      state = 'AT_RISK';
    }
  }

  return {
    state,
    currentStreak,
    longestStreak,
    completedCount,
    totalCount,
    remainingCount,
    resetTimeStr: settings.dailyResetTime,
    shieldsCount: settings.streakShields,
  };
}

/**
 * Checks if a new Streak Shield is earned based on the new streak count.
 * Returns true if a shield should be awarded (every 30 consecutive days).
 */
export function shouldAwardStreakShield(newStreak: number): boolean {
  return newStreak > 0 && newStreak % 30 === 0;
}
