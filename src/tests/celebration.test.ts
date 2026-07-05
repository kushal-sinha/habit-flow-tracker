import { describe, it, expect } from 'vitest';
import { getMilestoneInfo } from '../utils/celebrationUtils';

describe('Celebration Milestone Logic', () => {
  it('should return standard light feedback and random animations for standard days', () => {
    // Streak 1 (Non-milestone)
    const info1 = getMilestoneInfo(1);
    expect(info1.milestoneLevel).toBe(0);
    expect(info1.hapticStyle).toBe('light');
    expect(['Wave', 'Cheer', 'Spin']).toContain(info1.animationName);
    
    // Streak 2 (Non-milestone)
    const info2 = getMilestoneInfo(2);
    expect(info2.milestoneLevel).toBe(0);
    expect(info2.hapticStyle).toBe('light');
    expect(['Wave', 'Cheer', 'Spin']).toContain(info2.animationName);
  });

  it('should return medium feedback and Happy Jump for a 3-day streak', () => {
    const info = getMilestoneInfo(3);
    expect(info.milestoneLevel).toBe(3);
    expect(info.animationName).toBe('Happy Jump');
    expect(info.hapticStyle).toBe('medium');
    expect(info.title).toContain('3-Day');
  });

  it('should return medium feedback and Double Fist Pump for a 7-day streak', () => {
    const info = getMilestoneInfo(7);
    expect(info.milestoneLevel).toBe(7);
    expect(info.animationName).toBe('Double Fist Pump');
    expect(info.hapticStyle).toBe('medium');
    expect(info.title).toContain('7-Day');
  });

  it('should return medium feedback and Trophy Lift for a 14-day streak', () => {
    const info = getMilestoneInfo(14);
    expect(info.milestoneLevel).toBe(14);
    expect(info.animationName).toBe('Trophy Lift');
    expect(info.hapticStyle).toBe('medium');
    expect(info.title).toContain('Fortnight');
  });

  it('should return heavy feedback and Dance for a 30-day streak', () => {
    const info = getMilestoneInfo(30);
    expect(info.milestoneLevel).toBe(30);
    expect(info.animationName).toBe('Dance');
    expect(info.hapticStyle).toBe('heavy');
    expect(info.title).toContain('30-Day');
  });

  it('should return heavy feedback and Cheer for a 50-day streak', () => {
    const info = getMilestoneInfo(50);
    expect(info.milestoneLevel).toBe(50);
    expect(info.animationName).toBe('Cheer');
    expect(info.hapticStyle).toBe('heavy');
    expect(info.title).toContain('50 Days');
  });

  it('should return success notification haptic and Confetti Celebration for a 100-day streak', () => {
    const info = getMilestoneInfo(100);
    expect(info.milestoneLevel).toBe(100);
    expect(info.animationName).toBe('Confetti Celebration');
    expect(info.hapticStyle).toBe('success');
    expect(info.title).toContain('EXCEPTIONAL');
  });
});
