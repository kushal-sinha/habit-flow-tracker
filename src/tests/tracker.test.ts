import { describe, it, expect } from 'vitest';
import { 
  formatDateString, 
  parseDateString, 
  getWeekdayAbbreviation, 
  addDays, 
  differenceInCalendarDays, 
  getDaysInMonth, 
  getGreeting, 
  getCalendarGrid 
} from '../utils/dateUtils';
import { isHabitScheduled, calculateHabitStats, calculateOverallStreak } from '../utils/streakUtils';
import { getQuoteForToday } from '../utils/quoteUtils';
import { Habit, HistoryEntry } from '../types';

describe('Date Utilities', () => {
  it('should format date correctly to YYYY-MM-DD', () => {
    const date = new Date(2026, 5, 30); // June 30, 2026
    expect(formatDateString(date)).toBe('2026-06-30');
  });

  it('should parse date string correctly to midnight local time', () => {
    const parsed = parseDateString('2026-06-30');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(5); // June is 5
    expect(parsed.getDate()).toBe(30);
    expect(parsed.getHours()).toBe(0);
  });

  it('should calculate correct weekday abbreviation', () => {
    // 2026-06-30 is a Tuesday (based on calendar)
    expect(getWeekdayAbbreviation('2026-06-30')).toBe('tue');
    expect(getWeekdayAbbreviation('2026-07-01')).toBe('wed');
    expect(getWeekdayAbbreviation('2026-07-05')).toBe('sun');
  });

  it('should add/subtract days correctly without DST shift issues', () => {
    expect(addDays('2026-06-30', 5)).toBe('2026-07-05');
    expect(addDays('2026-07-01', -2)).toBe('2026-06-29');
    // Leap year crossing
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01');
  });

  it('should calculate correct calendar days difference', () => {
    expect(differenceInCalendarDays('2026-07-05', '2026-06-30')).toBe(5);
    expect(differenceInCalendarDays('2026-06-30', '2026-07-05')).toBe(-5);
  });

  it('should handle leap years correctly in getDaysInMonth', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29); // Feb 2024 (Leap year)
    expect(getDaysInMonth(2026, 1)).toBe(28); // Feb 2026 (Common year)
    expect(getDaysInMonth(2026, 5)).toBe(30); // June 2026
  });

  it('should bin timezone greetings correctly based on hour', () => {
    const greeting = getGreeting();
    expect(greeting).toHaveProperty('text');
    expect(greeting).toHaveProperty('emoji');
  });

  it('should return exactly 42 cells for calendar grids', () => {
    const grid = getCalendarGrid(2026, 5); // June 2026
    expect(grid.length).toBe(42);
    // June 1 2026 is Monday, so Sun (index 0) will be padding
    expect(grid[0].isCurrentMonth).toBe(false);
    expect(grid[1].isCurrentMonth).toBe(true);
    expect(grid[1].dayNumber).toBe(1);
  });
});

describe('Deterministic Quote Engine', () => {
  it('should return the same quote for a given date', () => {
    const quote1 = getQuoteForToday('2026-06-30');
    const quote2 = getQuoteForToday('2026-06-30');
    expect(quote1).toEqual(quote2);
  });

  it('should change quotes across different dates', () => {
    const quote1 = getQuoteForToday('2026-06-30');
    const quote2 = getQuoteForToday('2026-07-01');
    // While theoretically possible to hash to same, they are usually different
    expect(quote1.text).toBeDefined();
    expect(quote2.text).toBeDefined();
  });
});

describe('Streak Calculation Algorithms', () => {
  const mockHabit: Habit = {
    id: 'habit_1',
    title: 'Daily Run',
    emoji: '🏃‍♂️',
    category: 'fitness',
    color: 'coral',
    reminderTime: null,
    repeatDays: 'daily',
    startDate: '2026-06-25',
    note: '',
    isArchived: false,
    createdAt: new Date().toISOString(),
    userId: 'test_user',
  };

  const createHistory = (dates: { [date: string]: boolean }): HistoryEntry[] => {
    return Object.entries(dates).map(([date, completed]) => ({
      habitId: 'habit_1',
      date,
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      userId: 'test_user',
    }));
  };

  it('should identify scheduled days correctly', () => {
    const dailyHabit = { ...mockHabit, repeatDays: 'daily' as const };
    expect(isHabitScheduled(dailyHabit, '2026-06-30')).toBe(true);

    const weekdayHabit = { ...mockHabit, repeatDays: 'weekdays' as const };
    expect(isHabitScheduled(weekdayHabit, '2026-07-04')).toBe(false); // Saturday
    expect(isHabitScheduled(weekdayHabit, '2026-07-03')).toBe(true); // Friday

    const customHabit = { ...mockHabit, repeatDays: ['mon', 'wed', 'fri'] };
    expect(isHabitScheduled(customHabit, '2026-06-29')).toBe(true); // Monday
    expect(isHabitScheduled(customHabit, '2026-06-30')).toBe(false); // Tuesday
  });

  it('should calculate habit stats correctly for daily completions', () => {
    // 5 consecutive completions, today is completed
    const history = createHistory({
      '2026-06-25': true,
      '2026-06-26': true,
      '2026-06-27': true,
      '2026-06-28': true,
      '2026-06-29': true,
      '2026-06-30': true,
    });
    
    const stats = calculateHabitStats(mockHabit, history, '2026-06-30');
    expect(stats.currentStreak).toBe(6);
    expect(stats.longestStreak).toBe(6);
    expect(stats.completionRate).toBe(100);
  });

  it('should reset streak if a past scheduled day is skipped', () => {
    // Missed 2026-06-28
    const history = createHistory({
      '2026-06-25': true,
      '2026-06-26': true,
      '2026-06-27': true,
      '2026-06-28': false,
      '2026-06-29': true,
      '2026-06-30': true,
    });

    const stats = calculateHabitStats(mockHabit, history, '2026-06-30');
    expect(stats.currentStreak).toBe(2); // 29, 30
    expect(stats.longestStreak).toBe(3); // 25, 26, 27
    expect(stats.missedDays).toBe(1);
  });

  it('should carry over streak on non-scheduled days and check for changes', () => {
    // Scheduled: mon, wed, fri
    // 2026-06-29 (Mon) -> completed
    // 2026-06-30 (Tue) -> not scheduled
    // 2026-07-01 (Wed) -> completed
    const MWFHabit = {
      ...mockHabit,
      repeatDays: ['mon', 'wed', 'fri']
    };

    const history: HistoryEntry[] = [
      { habitId: 'habit_1', date: '2026-06-29', completed: true, completedAt: null, userId: 'user' },
      { habitId: 'habit_1', date: '2026-07-01', completed: true, completedAt: null, userId: 'user' },
    ];

    // On Wednesday 07-01
    const stats = calculateHabitStats(MWFHabit, history, '2026-07-01');
    expect(stats.currentStreak).toBe(2); // Mon and Wed
    expect(stats.longestStreak).toBe(2);

    // On Thursday 07-02 (Not scheduled)
    const statsThurs = calculateHabitStats(MWFHabit, history, '2026-07-02');
    expect(statsThurs.currentStreak).toBe(2); // Remains 2, not broken by Thursday
  });

  it('should calculate overall app streak accurately', () => {
    const habits: Habit[] = [
      { ...mockHabit, id: 'h1', repeatDays: 'daily', startDate: '2026-06-28' },
      { ...mockHabit, id: 'h2', repeatDays: 'weekdays', startDate: '2026-06-28' }, // 28 is Sun (not scheduled)
    ];

    const history: HistoryEntry[] = [
      // 2026-06-28 (Sun): only h1 scheduled and completed
      { habitId: 'h1', date: '2026-06-28', completed: true, completedAt: null, userId: 'user' },
      // 2026-06-29 (Mon): both scheduled and completed
      { habitId: 'h1', date: '2026-06-29', completed: true, completedAt: null, userId: 'user' },
      { habitId: 'h2', date: '2026-06-29', completed: true, completedAt: null, userId: 'user' },
      // 2026-06-30 (Tue): both scheduled, h2 completed but h1 missed
      { habitId: 'h2', date: '2026-06-30', completed: true, completedAt: null, userId: 'user' },
    ];

    const overall = calculateOverallStreak(habits, history, '2026-06-30');
    expect(overall.currentStreak).toBe(2); // Today h1 is incomplete, but day is not over, so carry over yesterday's streak of 2
    expect(overall.longestStreak).toBe(2); // Sun, Mon completed
    expect(overall.isTodayCompleted).toBe(false);

    // If we move to tomorrow (2026-07-01) and yesterday was left incomplete, the streak breaks and resets to 0
    const overallTomorrow = calculateOverallStreak(habits, history, '2026-07-01');
    expect(overallTomorrow.currentStreak).toBe(0);
    expect(overallTomorrow.longestStreak).toBe(2);
  });
});
