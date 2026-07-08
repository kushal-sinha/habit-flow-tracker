import { Habit, HistoryEntry, UserSettings } from '../types';
import { getLogicalResetDate } from './TimeWindowCalculator';
import { calculateOverallStreak, isHabitScheduled } from './streakUtils';
import { addDays, differenceInCalendarDays } from './dateUtils';
import { shouldAwardStreakShield } from './StreakEngine';

export interface ResetResult {
  updatedSettings: UserSettings;
  insertedHistory: HistoryEntry[];
  changesApplied: boolean;
}

/**
 * Checks and processes any pending daily resets from settings.lastDailyResetDate up to the current logical date.
 */
export function evaluateDailyResets(
  settings: UserSettings,
  habits: Habit[],
  history: HistoryEntry[],
  currentTime: Date
): ResetResult {
  const currentLogicalDate = getLogicalResetDate(currentTime, settings.dailyResetTime);
  let lastResetDate = settings.lastDailyResetDate;

  // 1. If lastResetDate is null, this is a new bootstrap. Just initialize it.
  if (!lastResetDate) {
    return {
      updatedSettings: {
        ...settings,
        lastDailyResetDate: currentLogicalDate,
      },
      insertedHistory: [],
      changesApplied: true,
    };
  }

  // 2. If already up to date, do nothing.
  if (currentLogicalDate === lastResetDate) {
    return {
      updatedSettings: settings,
      insertedHistory: [],
      changesApplied: false,
    };
  }

  // 3. We evaluate all days `d` where lastResetDate <= d < currentLogicalDate
  const tempSettings = { ...settings };
  const tempHistory = [...history];
  const insertedHistory: HistoryEntry[] = [];
  
  const daysDiff = differenceInCalendarDays(currentLogicalDate, lastResetDate);
  const activeHabits = habits.filter((h) => !h.isArchived);

  for (let i = 0; i < daysDiff; i++) {
    const evalDate = addDays(lastResetDate, i);
    
    // Find active habits scheduled for this day
    const scheduledHabits = activeHabits.filter((h) => isHabitScheduled(h, evalDate));
    if (scheduledHabits.length === 0) {
      // If no habits were scheduled, it's a pass day that doesn't break the streak.
      continue;
    }

    const completedEntries = tempHistory.filter(
      (e) => e.date === evalDate && e.completed && e.userId === settings.userId
    );
    const completedSet = new Set(completedEntries.map((e) => e.habitId));
    const allCompleted = scheduledHabits.every((h) => completedSet.has(h.id));

    if (allCompleted) {
      // Streak continues! Let's check if a shield is earned.
      const currentStreakValue = calculateOverallStreak(habits, tempHistory, evalDate).currentStreak;
      if (shouldAwardStreakShield(currentStreakValue)) {
        tempSettings.streakShields = Math.min(3, tempSettings.streakShields + 1);
      }
    } else {
      // Habits missed!
      if (tempSettings.streakShields > 0) {
        // Use a Streak Shield!
        tempSettings.streakShields = Math.max(0, tempSettings.streakShields - 1);
        
        // Write completions for all missing habits on this day to keep the streak going in history
        scheduledHabits.forEach((h) => {
          if (!completedSet.has(h.id)) {
            const entry: HistoryEntry = {
              habitId: h.id,
              date: evalDate,
              completed: true,
              completedAt: 'shield_protected',
              userId: settings.userId,
            };
            insertedHistory.push(entry);
            tempHistory.push(entry);
          }
        });

        // Recalculate streak to grab the new streak value that was just protected
        const streakValue = calculateOverallStreak(habits, tempHistory, evalDate).currentStreak;
        tempSettings.streakShieldProtectedStreak = streakValue;
        
        // Clear any previous lost streak flag
        tempSettings.showStreakLostScreen = false;
        
        // Also check if this newly protected day earns a shield back (e.g. if the protected day is day 30)
        if (shouldAwardStreakShield(streakValue)) {
          tempSettings.streakShields = Math.min(3, tempSettings.streakShields + 1);
        }
      } else {
        // No shields! Reset streak flag
        tempSettings.showStreakLostScreen = true;
        tempSettings.streakShieldProtectedStreak = 0;
      }
    }
  }

  // Set the catch-up marker to today's logical date
  tempSettings.lastDailyResetDate = currentLogicalDate;

  return {
    updatedSettings: tempSettings,
    insertedHistory,
    changesApplied: true,
  };
}
