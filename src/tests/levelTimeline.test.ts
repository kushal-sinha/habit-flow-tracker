import { describe, it, expect } from 'vitest';
import { calculateProgressPercentage, MILESTONES } from '../utils/progressionUtils';

describe('Level Timeline Progression Math', () => {
  it('should return 0% progress and index 0 when streak is 0', () => {
    const { percentage, activeIndex } = calculateProgressPercentage(0, MILESTONES);
    expect(percentage).toBe(0);
    expect(activeIndex).toBe(0);
  });

  it('should return intermediate percentage within the first level (0 to 6 days)', () => {
    const { percentage, activeIndex } = calculateProgressPercentage(3, MILESTONES);
    // index 0 -> Level 1 (0 days). index 1 -> Level 5 (7 days).
    // range is 7 days. progress in range is 3. fraction = 3/7 ≈ 0.4285
    // overall percentage = (0 + 3/7) / 6 * 100 ≈ 7.14%
    expect(percentage).toBeCloseTo(7.14, 1);
    expect(activeIndex).toBe(0);
  });

  it('should match milestone borders exactly', () => {
    // Level 15 is index 3 (starts at 30 days)
    const { percentage, activeIndex } = calculateProgressPercentage(30, MILESTONES);
    expect(percentage).toBe(50); // 3 / 6 * 100
    expect(activeIndex).toBe(3);
  });

  it('should interpolate between index 3 (30 days) and index 4 (50 days)', () => {
    // 40 days is exactly the midpoint between 30 and 50
    const { percentage, activeIndex } = calculateProgressPercentage(40, MILESTONES);
    // activeIndex = 3, fraction = 0.5. overall index position = 3.5.
    // 3.5 / 6 * 100 = 58.333%
    expect(percentage).toBeCloseTo(58.33, 1);
    expect(activeIndex).toBe(3);
  });

  it('should return 100% progress and maximum index when streak is 120 or more', () => {
    const { percentage, activeIndex } = calculateProgressPercentage(120, MILESTONES);
    expect(percentage).toBe(100);
    expect(activeIndex).toBe(6);

    const overflow = calculateProgressPercentage(250, MILESTONES);
    expect(overflow.percentage).toBe(100);
    expect(overflow.activeIndex).toBe(6);
  });
});
