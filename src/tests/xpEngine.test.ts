import { describe, it, expect } from 'vitest';
import { addXP, adjustXP, getXPRequiredForLevel, getCumulativeXPForLevel, getLevelForXP } from '../utils/XPEngine';
import { getRegionForLevel } from '../utils/JourneyMap';
import { evaluateUnlockedAchievements, ACHIEVEMENTS } from '../utils/AchievementEngine';
import { UserSettings, Habit, HistoryEntry } from '../types';

describe('V3.2 XP & Progression Redesign Engine', () => {
  describe('XP level increments', () => {
    it('scales required XP per level correctly', () => {
      expect(getXPRequiredForLevel(1)).toBe(50);
      expect(getXPRequiredForLevel(2)).toBe(70);
      expect(getXPRequiredForLevel(3)).toBe(90);
      expect(getXPRequiredForLevel(4)).toBe(120);
    });

    it('calculates cumulative XP thresholds correctly', () => {
      expect(getCumulativeXPForLevel(1)).toBe(0);
      expect(getCumulativeXPForLevel(2)).toBe(50);
      expect(getCumulativeXPForLevel(3)).toBe(120);
      expect(getCumulativeXPForLevel(4)).toBe(210);
      expect(getCumulativeXPForLevel(5)).toBe(330);
    });

    it('determines level from cumulative XP correctly', () => {
      expect(getLevelForXP(0)).toBe(1);
      expect(getLevelForXP(49)).toBe(1);
      expect(getLevelForXP(50)).toBe(2);
      expect(getLevelForXP(119)).toBe(2);
      expect(getLevelForXP(120)).toBe(3);
      expect(getLevelForXP(329)).toBe(4);
      expect(getLevelForXP(330)).toBe(5);
    });

    it('accumulates XP without leveling up when below threshold', () => {
      const res = addXP(10, 1, 30); // 10 XP + 30 XP = 40 XP (Level 2 needs 50)
      expect(res.nextXP).toBe(40);
      expect(res.nextLevel).toBe(1);
      expect(res.leveledUp).toBe(false);
    });

    it('levels up on crossing threshold', () => {
      const res = addXP(40, 1, 15); // 40 + 15 = 55. Needs 50 to reach Level 2.
      expect(res.nextXP).toBe(55);
      expect(res.nextLevel).toBe(2);
      expect(res.leveledUp).toBe(true);
      expect(res.levelsGained).toBe(1);
    });

    it('handles multiple level ups at once from large XP boosts', () => {
      const res = addXP(0, 1, 150); // 150 XP. Level 3 threshold is 120. Level 4 is 210.
      expect(res.nextXP).toBe(150);
      expect(res.nextLevel).toBe(3);
      expect(res.leveledUp).toBe(true);
      expect(res.levelsGained).toBe(2);
    });

    it('handles negative XP changes and drops levels if necessary', () => {
      const res = adjustXP(60, 2, -20); // 60 - 20 = 40. Level 2 threshold is 50.
      expect(res.nextXP).toBe(40);
      expect(res.nextLevel).toBe(1);
      expect(res.leveledUp).toBe(true);
      expect(res.levelsGained).toBe(-1);
    });

    it('clamps negative XP at Level 1, 0 XP', () => {
      const res = adjustXP(10, 1, -50);
      expect(res.nextXP).toBe(0);
      expect(res.nextLevel).toBe(1);
      expect(res.leveledUp).toBe(false);
    });
  });

  describe('Journey Map Regions', () => {
    it('maps level bounds to regional segments correctly', () => {
      const regLvl1 = getRegionForLevel(1);
      expect(regLvl1.name).toBe('🌱 Seedling Village');

      const regLvl5 = getRegionForLevel(5);
      expect(regLvl5.name).toBe('🌲 Forest Explorer');

      const regLvl10 = getRegionForLevel(10);
      expect(regLvl10.name).toBe('🏔 Mountain Climber');

      const regLvl50 = getRegionForLevel(50);
      expect(regLvl50.name).toBe('🌌 Celestial Guardian');
    });
  });

  describe('Achievements Evaluator Checks', () => {
    const dummyUser = 'test_user';
    const dummySettings: UserSettings = {
      userId: dummyUser,
      theme: 'system',
      notificationsEnabled: false,
      notificationTime: '09:00',
      notificationMessage: '',
      userName: 'Tester',
      soundEnabled: true,
      hapticEnabled: true,
      dailyResetTime: '00:00',
      streakShields: 0,
      lastDailyResetDate: null,
      showStreakLostScreen: false,
      streakShieldProtectedStreak: 0,
      xp: 10,
      level: 1,
      unlockedCharacters: [],
      unlockedAchievements: [],
      lastWeeklyReviewDate: null,
      lastMonthlyReviewDate: null,
      badges: [],
    };

    it('awards first_step achievement on first completions list entry', () => {
      const habits: Habit[] = [];
      const history: HistoryEntry[] = [
        { habitId: '1', date: '2026-07-08', completed: true, completedAt: '...', userId: dummyUser }
      ];
      const unlocked = evaluateUnlockedAchievements(dummySettings, habits, history, 0);
      expect(unlocked).toContain('first_step');
    });

    it('awards streak achievements matching overall progress counts', () => {
      const habits: Habit[] = [];
      const history: HistoryEntry[] = [];
      const unlocked = evaluateUnlockedAchievements(dummySettings, habits, history, 14);
      expect(unlocked).toContain('streak_3');
      expect(unlocked).toContain('streak_7');
      expect(unlocked).toContain('streak_14');
      expect(unlocked).not.toContain('streak_30');
    });
  });
});
