import { describe, it, expect } from 'vitest';
import { Habit, HistoryEntry, UserSettings } from '../types';
import { getLogicalResetDate, isWithinWarningWindow, getNextResetDateTime } from '../utils/TimeWindowCalculator';
import { calculateStreakInfo } from '../utils/StreakEngine';
import { evaluateDailyResets } from '../utils/DailyResetManager';

describe('Streak Protection V2.1 Logic Engines', () => {
  const dummyUser = 'test_user_id';
  
  const dummySettings = (overrides: Partial<UserSettings> = {}): UserSettings => ({
    userId: dummyUser,
    theme: 'system',
    notificationsEnabled: false,
    notificationTime: '09:00',
    notificationMessage: 'Forgot habits!',
    userName: 'Tester',
    soundEnabled: true,
    hapticEnabled: true,
    dailyResetTime: '00:00',
    streakShields: 0,
    lastDailyResetDate: '2026-07-07',
    showStreakLostScreen: false,
    streakShieldProtectedStreak: 0,
    ...overrides,
  });

  const dummyHabit = (id: string, overrides: Partial<Habit> = {}): Habit => ({
    id,
    title: `Habit ${id}`,
    emoji: '⭐',
    category: 'health',
    color: 'emerald',
    reminderTime: '12:00',
    repeatDays: 'daily',
    startDate: '2026-07-01',
    note: '',
    isArchived: false,
    createdAt: new Date().toISOString(),
    userId: dummyUser,
    ...overrides,
  });

  describe('TimeWindowCalculator', () => {
    it('maps timestamps before reset time to the previous logical day', () => {
      // Current date is July 8th, 3:30 AM. Reset is at 5:00 AM.
      const time = new Date(2026, 6, 8, 3, 30, 0); // Month is 0-indexed, so 6 is July
      const logicalDate = getLogicalResetDate(time, '05:00');
      expect(logicalDate).toBe('2026-07-07');
    });

    it('maps timestamps after reset time to the current logical day', () => {
      // Current date is July 8th, 6:30 AM. Reset is at 5:00 AM.
      const time = new Date(2026, 6, 8, 6, 30, 0);
      const logicalDate = getLogicalResetDate(time, '05:00');
      expect(logicalDate).toBe('2026-07-08');
    });

    it('identifies warning window active limits correctly', () => {
      // Current time is July 8th, 11:30 PM (23:30). Reset is midnight (00:00).
      const time = new Date(2026, 6, 8, 23, 30, 0);
      const isWarning = isWithinWarningWindow(time, '00:00', 60 * 60 * 1000); // 1 hour window
      expect(isWarning).toBe(true);
    });

    it('identifies warning window inactive limits correctly', () => {
      // Current time is July 8th, 10:15 PM (22:15). Reset is midnight (00:00).
      const time = new Date(2026, 6, 8, 22, 15, 0);
      const isWarning = isWithinWarningWindow(time, '00:00', 60 * 60 * 1000);
      expect(isWarning).toBe(false);
    });
  });

  describe('StreakEngine & State Calculations', () => {
    it('evaluates a completed goal status as SAFE', () => {
      const habits = [dummyHabit('1')];
      const history: HistoryEntry[] = [
        { habitId: '1', date: '2026-07-08', completed: true, completedAt: '...', userId: dummyUser },
      ];
      // Time is 10:00 AM
      const time = new Date(2026, 6, 8, 10, 0, 0);
      const info = calculateStreakInfo(habits, history, time, dummySettings());
      expect(info.state).toBe('SAFE');
      expect(info.completedCount).toBe(1);
      expect(info.remainingCount).toBe(0);
    });

    it('evaluates incomplete habits during standard hours as IN_PROGRESS', () => {
      const habits = [dummyHabit('1')];
      const history: HistoryEntry[] = [];
      // Time is 10:00 AM (Outside 1 hour reset window)
      const time = new Date(2026, 6, 8, 10, 0, 0);
      const info = calculateStreakInfo(habits, history, time, dummySettings({ dailyResetTime: '23:00' }));
      expect(info.state).toBe('IN_PROGRESS');
      expect(info.remainingCount).toBe(1);
    });

    it('evaluates incomplete habits near reset hours as AT_RISK', () => {
      const habits = [dummyHabit('1')];
      const history: HistoryEntry[] = [];
      // Time is 10:30 PM (Within 1 hour warning window of 11:00 PM reset)
      const time = new Date(2026, 6, 8, 22, 30, 0);
      const info = calculateStreakInfo(habits, history, time, dummySettings({ dailyResetTime: '23:00' }));
      expect(info.state).toBe('AT_RISK');
    });
  });

  describe('DailyResetManager & Shields', () => {
    it('preserves the streak and consumes a shield if user misses a daily reset', () => {
      const habits = [dummyHabit('1')];
      // Current history is empty (July 7th was missed)
      const history: HistoryEntry[] = [];
      const settings = dummySettings({
        lastDailyResetDate: '2026-07-07',
        streakShields: 2,
        dailyResetTime: '00:00',
      });
      // Time is July 8th, 9:00 AM (Daily reset checks due)
      const time = new Date(2026, 6, 8, 9, 0, 0);
      
      const result = evaluateDailyResets(settings, habits, history, time);
      
      expect(result.changesApplied).toBe(true);
      expect(result.updatedSettings.streakShields).toBe(1); // One consumed
      expect(result.updatedSettings.showStreakLostScreen).toBe(false); // Saved by shield
      expect(result.updatedSettings.streakShieldProtectedStreak).toBe(1); // 1 day overall streak is protected
      expect(result.insertedHistory.length).toBe(1); // Shield completion entry inserted
      expect(result.insertedHistory[0].completedAt).toBe('shield_protected');
    });

    it('resets streak to 0 and flags showStreakLostScreen if zero shields remain', () => {
      const habits = [dummyHabit('1')];
      const history: HistoryEntry[] = [];
      const settings = dummySettings({
        lastDailyResetDate: '2026-07-07',
        streakShields: 0, // No shields
        dailyResetTime: '00:00',
      });
      const time = new Date(2026, 6, 8, 9, 0, 0);
      
      const result = evaluateDailyResets(settings, habits, history, time);
      
      expect(result.changesApplied).toBe(true);
      expect(result.updatedSettings.streakShields).toBe(0);
      expect(result.updatedSettings.showStreakLostScreen).toBe(true); // Lost warning flag set
      expect(result.insertedHistory.length).toBe(0); // No completions inserted
    });
  });
});
