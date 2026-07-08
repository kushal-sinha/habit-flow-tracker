export const XP_REWARDS = {
  HABIT_COMPLETED_EASY: 10,
  HABIT_COMPLETED_HARD: 20,
  PERFECT_DAY: 30,
  WEEKLY_REVIEW_COMPLETED: 50,
  MONTHLY_REVIEW_COMPLETED: 150,
  STREAK_MILESTONE: 80,
};

/**
 * Returns the cumulative XP required to reach a specific level.
 * Level 1: 0 XP
 * Level 2: 50 XP
 * Level 3: 120 XP
 * Level 4: 210 XP
 * Level 5: 330 XP
 */
export function getCumulativeXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 50;
  if (level === 3) return 120;
  if (level === 4) return 210;
  if (level === 5) return 330;
  
  let xp = 330;
  let diff = 120;
  for (let i = 5; i < level; i++) {
    diff += 30;
    xp += diff;
  }
  return xp;
}

/**
 * Returns the XP required to go from current level to next level.
 * Level 1 -> 2: 50 XP
 * Level 2 -> 3: 70 XP
 * Level 3 -> 4: 90 XP
 * Level 4 -> 5: 120 XP
 */
export function getXPRequiredForLevel(level: number): number {
  if (level < 1) return 50;
  return getCumulativeXPForLevel(level + 1) - getCumulativeXPForLevel(level);
}

/**
 * Determines level based on cumulative XP.
 */
export function getLevelForXP(xp: number): number {
  let level = 1;
  while (xp >= getCumulativeXPForLevel(level + 1)) {
    level++;
  }
  return level;
}

interface XPResult {
  nextXP: number; // Cumulative XP
  nextLevel: number;
  leveledUp: boolean;
  levelsGained: number;
}

/**
 * Adjusts cumulative XP and updates level.
 */
export function adjustXP(currentXP: number, currentLevel: number, amount: number): XPResult {
  const nextCumulativeXP = Math.max(0, currentXP + amount);
  const nextLevel = getLevelForXP(nextCumulativeXP);
  const levelsGained = nextLevel - currentLevel;
  
  return {
    nextXP: nextCumulativeXP,
    nextLevel,
    leveledUp: levelsGained !== 0,
    levelsGained,
  };
}

export function addXP(currentXP: number, currentLevel: number, amount: number): XPResult {
  return adjustXP(currentXP, currentLevel, amount);
}
