// Milestone Configuration details
export interface MilestoneConfig {
  level: number;
  rank: string;
  minDays: number;
  maxDays: number;
  badgeType: 'bronze' | 'silver' | 'gold' | 'purple_champion' | 'sapphire' | 'legendary_gold' | 'immortal';
  unlockedCharacter: string;
  rewards: string[];
  xpRequired: number;
}

export const MILESTONES: MilestoneConfig[] = [
  { level: 1, rank: 'Newbie', minDays: 0, maxDays: 6, badgeType: 'bronze', unlockedCharacter: 'Base Seedling', rewards: ['Base Mascot Companion', 'Daily Reminders'], xpRequired: 0 },
  { level: 5, rank: 'Consistent', minDays: 7, maxDays: 14, badgeType: 'silver', unlockedCharacter: 'Forest Sprout', rewards: ['Custom Reminder Sounds', 'Streak Lock Option'], xpRequired: 500 },
  { level: 10, rank: 'Dedicated', minDays: 15, maxDays: 29, badgeType: 'gold', unlockedCharacter: 'Grown Shrub', rewards: ['Bronze Dashboard Theme', 'Double XP Boosts'], xpRequired: 1500 },
  { level: 15, rank: 'Champion', minDays: 30, maxDays: 49, badgeType: 'purple_champion', unlockedCharacter: 'Wisdom Oak', rewards: ['Purple Dashboard Theme', 'Mascot Voice Options'], xpRequired: 3000 },
  { level: 20, rank: 'Legend', minDays: 50, maxDays: 79, badgeType: 'sapphire', unlockedCharacter: 'Frost Willow', rewards: ['Sapphire Dashboard Theme', 'Advanced Stats Module'], xpRequired: 6000 },
  { level: 25, rank: 'Icon', minDays: 80, maxDays: 119, badgeType: 'legendary_gold', unlockedCharacter: 'Solar Maple', rewards: ['Golden App Icon Badge', 'Priority Beta Access'], xpRequired: 10000 },
  { level: 30, rank: 'Immortal', minDays: 120, maxDays: 999999, badgeType: 'immortal', unlockedCharacter: 'Giga Sakura', rewards: ['Creator Settings Mode', 'Immortal Leaderboard Tag'], xpRequired: 20000 },
];

// Helper to determine active index and progress percentage
export const calculateProgressPercentage = (streak: number, milestones: MilestoneConfig[]): { percentage: number; activeIndex: number } => {
  if (streak <= 0) return { percentage: 0, activeIndex: 0 };
  
  // Find which milestone interval the streak belongs to
  let activeIndex = 0;
  for (let i = 0; i < milestones.length; i++) {
    if (streak >= milestones[i].minDays && (i === milestones.length - 1 || streak < milestones[i + 1].minDays)) {
      activeIndex = i;
      break;
    }
  }

  // Calculate interpolation fraction between current node and next node
  if (activeIndex === milestones.length - 1) {
    return { percentage: 100, activeIndex };
  }

  const currentNode = milestones[activeIndex];
  const nextNode = milestones[activeIndex + 1];
  const range = nextNode.minDays - currentNode.minDays;
  const progressInRange = streak - currentNode.minDays;
  const fraction = Math.max(0, Math.min(1, progressInRange / range));

  // Overall percentage is active index index + fraction of overall track count
  const totalNodes = milestones.length;
  const percentage = ((activeIndex + fraction) / (totalNodes - 1)) * 100;
  return { percentage, activeIndex };
};
