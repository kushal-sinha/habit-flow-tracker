import { Habit, HistoryEntry, StreakStats } from '../types';
import { getWeekdayAbbreviation, addDays, differenceInCalendarDays, parseDateString, getTodayString } from './dateUtils';

/**
 * Checks if a habit is scheduled to occur on a specific date string (YYYY-MM-DD)
 */
export function isHabitScheduled(habit: Habit, dateStr: string): boolean {
  // A habit cannot be scheduled before its start date
  if (dateStr < habit.startDate) {
    return false;
  }

  const repeatDays = habit.repeatDays;
  if (repeatDays === 'daily') {
    return true;
  }

  const weekday = getWeekdayAbbreviation(dateStr);
  if (repeatDays === 'weekdays') {
    return weekday !== 'sat' && weekday !== 'sun';
  }
  if (repeatDays === 'weekends') {
    return weekday === 'sat' || weekday === 'sun';
  }
  if (Array.isArray(repeatDays)) {
    return repeatDays.includes(weekday);
  }

  return false;
}

/**
 * Calculates current and longest streak, completion rate, and other statistics for a single habit
 */
export function calculateHabitStats(
  habit: Habit,
  history: HistoryEntry[],
  todayStr: string = getTodayString()
): StreakStats {
  const habitHistory = history.filter((e) => e.habitId === habit.id);
  const completionMap = new Map<string, boolean>();
  habitHistory.forEach((e) => {
    completionMap.set(e.date, e.completed);
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let totalCompleted = 0;
  let totalScheduledDays = 0;
  let missedDays = 0;

  // We will walk day by day from habit.startDate to todayStr
  const startDateStr = habit.startDate;
  
  if (startDateStr > todayStr) {
    // If the habit starts in the future
    return { currentStreak: 0, longestStreak: 0, completionRate: 0, totalCompleted: 0, missedDays: 0 };
  }

  const totalDaysDiff = differenceInCalendarDays(todayStr, startDateStr);
  let runningStreak = 0;

  for (let i = 0; i <= totalDaysDiff; i++) {
    const currentDateStr = addDays(startDateStr, i);
    const isScheduled = isHabitScheduled(habit, currentDateStr);

    if (isScheduled) {
      totalScheduledDays++;
      const isCompleted = completionMap.get(currentDateStr) === true;

      if (isCompleted) {
        runningStreak++;
        totalCompleted++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        // If it is today, we don't break the running/current streak yet because the day isn't over.
        // But if it is in the past, a missed scheduled day resets the streak.
        if (currentDateStr < todayStr) {
          runningStreak = 0;
          missedDays++;
        }
      }
    }
  }

  // Calculate current streak. 
  // If today is scheduled and completed, it is the runningStreak.
  // If today is scheduled and NOT completed, the current streak is the streak as of yesterday (which is runningStreak).
  // If today is NOT scheduled, the current streak is also the runningStreak (since runningStreak didn't reset).
  currentStreak = runningStreak;

  const completionRate = totalScheduledDays > 0 
    ? Math.round((totalCompleted / totalScheduledDays) * 100) 
    : 0;

  return {
    currentStreak,
    longestStreak,
    completionRate,
    totalCompleted,
    missedDays,
  };
}

/**
 * Calculates the overall app-wide streak
 * An overall day is "completed" if all active habits scheduled for that day are completed.
 * If no habits were scheduled for a day, that day is ignored (it doesn't break the streak).
 */
export function calculateOverallStreak(
  habits: Habit[],
  history: HistoryEntry[],
  todayStr: string = getTodayString()
): { currentStreak: number; longestStreak: number; isTodayCompleted: boolean } {
  const activeHabits = habits.filter((h) => !h.isArchived);
  
  if (activeHabits.length === 0) {
    return { currentStreak: 0, longestStreak: 0, isTodayCompleted: false };
  }

  // Find the earliest start date among active habits to begin our calculations
  let earliestStart = todayStr;
  activeHabits.forEach((h) => {
    if (h.startDate < earliestStart) {
      earliestStart = h.startDate;
    }
  });

  const totalDays = differenceInCalendarDays(todayStr, earliestStart);
  
  // Group history by date for easy lookup
  // Map key: YYYY-MM-DD, value: Set of completed habit IDs
  const completedMap = new Map<string, Set<string>>();
  history.forEach((entry) => {
    if (entry.completed) {
      if (!completedMap.has(entry.date)) {
        completedMap.set(entry.date, new Set());
      }
      completedMap.get(entry.date)!.add(entry.habitId);
    }
  });

  let runningStreak = 0;
  let longestStreak = 0;
  let isTodayCompleted = false;

  // Walk forward from earliestStart to todayStr
  for (let i = 0; i <= totalDays; i++) {
    const currentDateStr = addDays(earliestStart, i);
    
    // Find all habits scheduled for this day
    const scheduledHabits = activeHabits.filter((h) => isHabitScheduled(h, currentDateStr));
    
    // If no habits were scheduled for this day, it does not affect the streak
    if (scheduledHabits.length === 0) {
      continue;
    }

    const completedSet = completedMap.get(currentDateStr) || new Set();
    const allCompleted = scheduledHabits.every((h) => completedSet.has(h.id));

    if (currentDateStr === todayStr) {
      isTodayCompleted = allCompleted;
    }

    if (allCompleted) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      // If it is today and not yet completed, it does not break the streak *yet*
      if (currentDateStr < todayStr) {
        runningStreak = 0;
      }
    }
  }

  return {
    currentStreak: runningStreak,
    longestStreak,
    isTodayCompleted,
  };
}
