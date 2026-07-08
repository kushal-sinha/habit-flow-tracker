import { Habit, HistoryEntry, UserSettings } from '../types';

export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  category: 'consistency' | 'reading' | 'fitness' | 'hydration' | 'meditation' | 'morning' | 'night' | 'level' | 'xp' | 'special';
  iconName: string;
  rewardText: string;
  rewardType: 'badge' | 'theme' | 'decoration' | 'animation' | 'sound';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Celestial';
}

export const ACHIEVEMENTS: AchievementConfig[] = [
  // Consistency (1-10)
  { id: 'first_step', title: 'First Step', description: 'Complete your first habit task.', category: 'consistency', iconName: 'footprint', rewardText: '🥉 First Step Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'streak_3', title: 'Three of a Kind', description: 'Reach a 3-day active streak.', category: 'consistency', iconName: 'numeric-3-circle', rewardText: '🥉 Bronze Streak Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'streak_7', title: 'Week of Discipline', description: 'Reach a 7-day active streak.', category: 'consistency', iconName: 'numeric-7-circle', rewardText: '🥈 Silver Streak Badge', rewardType: 'badge', rarity: 'Rare' },
  { id: 'streak_14', title: 'Fortnight Habit', description: 'Reach a 14-day active streak.', category: 'consistency', iconName: 'calendar-range', rewardText: '🥇 Gold Streak Badge', rewardType: 'badge', rarity: 'Rare' },
  { id: 'streak_30', title: 'Month of Devotion', description: 'Reach a 30-day active streak.', category: 'consistency', iconName: 'calendar-month', rewardText: '🔮 Platinum Streak Badge', rewardType: 'badge', rarity: 'Epic' },
  { id: 'streak_60', title: 'Diamond Habit', description: 'Reach a 60-day active streak.', category: 'consistency', iconName: 'diamond-stone', rewardText: '💎 Diamond Badge', rewardType: 'badge', rarity: 'Epic' },
  { id: 'streak_90', title: 'Quarterly Focus', description: 'Reach a 90-day active streak.', category: 'consistency', iconName: 'seal', rewardText: '🔥 90-Day Warrior Badge', rewardType: 'badge', rarity: 'Legendary' },
  { id: 'streak_100', title: 'Century Milestone', description: 'Reach a 100-day active streak.', category: 'consistency', iconName: 'trophy', rewardText: '🔥 100-Day Warrior Title', rewardType: 'decoration', rarity: 'Legendary' },
  { id: 'perfect_week', title: 'Perfect Week', description: 'Complete all scheduled habits for 7 consecutive days.', category: 'consistency', iconName: 'check-all', rewardText: '💫 Perfect Week Confetti Effect', rewardType: 'animation', rarity: 'Rare' },
  { id: 'perfect_month', title: 'Perfect Month', description: 'Complete all scheduled habits for 30 consecutive days.', category: 'consistency', iconName: 'star-circle', rewardText: '🌟 Golden Star Profile Border', rewardType: 'decoration', rarity: 'Legendary' },

  // Reading (11-15)
  { id: 'bookworm_1', title: 'Avid Reader', description: 'Create a reading-related habit.', category: 'reading', iconName: 'book-open-page-variant', rewardText: '📚 Bookworm Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'bookworm_5', title: 'Knowledge Sprout', description: 'Complete your reading habit 5 times.', category: 'reading', iconName: 'book-open', rewardText: '📖 Study Desk Decoration', rewardType: 'decoration', rarity: 'Common' },
  { id: 'bookworm_30', title: 'Librarian Standard', description: 'Complete your reading habit 30 times.', category: 'reading', iconName: 'library', rewardText: '🌌 Forest Twilight Theme', rewardType: 'theme', rarity: 'Epic' },
  { id: 'book_club', title: 'Page Turner', description: 'Add a note to your reading habit.', category: 'reading', iconName: 'bookmark', rewardText: '📑 Bookmark Icon Glow', rewardType: 'decoration', rarity: 'Common' },
  { id: 'book_marathon', title: 'Literary Scholar', description: 'Complete your reading habit 100 times.', category: 'reading', iconName: 'school', rewardText: '👑 Golden Crown Title', rewardType: 'decoration', rarity: 'Legendary' },

  // Fitness (16-20)
  { id: 'fitness_1', title: 'Gym Initiate', description: 'Create a fitness or workout habit.', category: 'fitness', iconName: 'dumbbell', rewardText: '🏋 Iron Discipline Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'fitness_5', title: 'Iron Sculptor', description: 'Complete your fitness habit 5 times.', category: 'fitness', iconName: 'weight-lifter', rewardText: '⚡ Neon Muscle Glow Effect', rewardType: 'decoration', rarity: 'Common' },
  { id: 'fitness_30', title: 'Body Builder', description: 'Complete your fitness habit 30 times.', category: 'fitness', iconName: 'run-fast', rewardText: '🌌 Cyber Athletic Theme', rewardType: 'theme', rarity: 'Epic' },
  { id: 'fitness_weekend', title: 'Weekend Warrior', description: 'Complete fitness goals on Saturday and Sunday.', category: 'fitness', iconName: 'calendar-today', rewardText: '👟 Weekend Run Soundscape', rewardType: 'sound', rarity: 'Rare' },
  { id: 'fitness_marathon', title: 'Peak Athlete', description: 'Complete your fitness habit 100 times.', category: 'fitness', iconName: 'medal', rewardText: '🏅 Gold Medal Frame', rewardType: 'decoration', rarity: 'Legendary' },

  // Hydration (21-25)
  { id: 'hydration_1', title: 'Hydration Cadet', description: 'Create a water or hydration habit.', category: 'hydration', iconName: 'water', rewardText: '💧 Water Master Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'hydration_5', title: 'Water Ripple', description: 'Complete your hydration habit 5 times.', category: 'hydration', iconName: 'cup-water', rewardText: '🪄 Raindrops Confetti Style', rewardType: 'animation', rarity: 'Common' },
  { id: 'hydration_30', title: 'Consistency Spring', description: 'Complete your hydration habit 30 times.', category: 'hydration', iconName: 'water-percent', rewardText: '🌌 Ocean Depths Theme', rewardType: 'theme', rarity: 'Epic' },
  { id: 'hydration_morning', title: 'Early Drinker', description: 'Complete a hydration habit before 9:00 AM.', category: 'hydration', iconName: 'weather-sunset-up', rewardText: '🥛 Morning Sip Sound Effect', rewardType: 'sound', rarity: 'Common' },
  { id: 'hydration_hero', title: 'Hydration Hero', description: 'Complete your hydration habit 100 times.', category: 'hydration', iconName: 'shield-outline', rewardText: '🛡️ Aquatic Shield Frame', rewardType: 'decoration', rarity: 'Legendary' },

  // Meditation (26-30)
  { id: 'meditation_1', title: 'Mindful Breathing', description: 'Create a meditation/mindfulness habit.', category: 'meditation', iconName: 'meditation', rewardText: '🧘 Zen Master Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'meditation_5', title: 'Zen Calm', description: 'Complete your meditation habit 5 times.', category: 'meditation', iconName: 'yoga', rewardText: '🔔 Singing Bowl Bell Sound', rewardType: 'sound', rarity: 'Common' },
  { id: 'meditation_30', title: 'Inner Harmony', description: 'Complete your meditation habit 30 times.', category: 'meditation', iconName: 'flower-tulip-outline', rewardText: '🌌 Astral Meditation Theme', rewardType: 'theme', rarity: 'Epic' },
  { id: 'meditation_weekly', title: 'Mindful Week', description: 'Meditate 5 days in a single week.', category: 'meditation', iconName: 'brain', rewardText: '🧠 Mental Clarity Halo Decoration', rewardType: 'decoration', rarity: 'Rare' },
  { id: 'meditation_master', title: 'Enlightened One', description: 'Complete your meditation habit 100 times.', category: 'meditation', iconName: 'pillar', rewardText: '☯️ Transcendence Profile Card Effect', rewardType: 'animation', rarity: 'Legendary' },

  // Morning Routine (31-35)
  { id: 'early_bird_1', title: 'Rise and Shine', description: 'Complete any habit before 8:00 AM.', category: 'morning', iconName: 'weather-sunny', rewardText: '🌅 Early Bird Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'early_bird_5', title: 'Morning Spark', description: 'Complete habits before 8:00 AM 5 times.', category: 'morning', iconName: 'weather-sunset', rewardText: '☀️ Morning Sunshine Avatar Border', rewardType: 'decoration', rarity: 'Rare' },
  { id: 'early_bird_30', title: 'First Light', description: 'Complete habits before 8:00 AM 30 times.', category: 'morning', iconName: 'white-balance-sunny', rewardText: '🌌 Golden Sunrise Theme', rewardType: 'theme', rarity: 'Epic' },
  { id: 'morning_routine_3', title: 'Triple Sunrise', description: 'Complete 3 habits before 12:00 PM in a single day.', category: 'morning', iconName: 'weather-partly-cloudy', rewardText: '🐓 Rooster Crow Ringtone', rewardType: 'sound', rarity: 'Rare' },
  { id: 'morning_chatter', title: 'Early Birdie', description: 'Interact with the mascot before 7:00 AM.', category: 'morning', iconName: 'twitter', rewardText: '🐦 Tweet Sound Trigger', rewardType: 'sound', rarity: 'Common' },

  // Night Routine (36-40)
  { id: 'night_owl_1', title: 'Night Owl', description: 'Complete any habit after 9:00 PM.', category: 'night', iconName: 'weather-night', rewardText: '🌌 Midnight Glow Theme', rewardType: 'theme', rarity: 'Common' },
  { id: 'night_owl_5', title: 'Midnight Starlight', description: 'Complete habits after 9:00 PM 5 times.', category: 'night', iconName: 'brightness-3', rewardText: '✨ Starry Night Confetti Effect', rewardType: 'animation', rarity: 'Rare' },
  { id: 'night_owl_30', title: 'Lunar Tracker', description: 'Complete habits after 9:00 PM 30 times.', category: 'night', iconName: 'moon-waning-crescent', rewardText: '🌙 Lunar Crescent Frame', rewardType: 'decoration', rarity: 'Epic' },
  { id: 'night_routine_3', title: 'Moonlight Trio', description: 'Complete 3 habits after 6:00 PM in a single day.', category: 'night', iconName: 'creation', rewardText: '🌌 Starry Purple Dashboard Theme', rewardType: 'theme', rarity: 'Rare' },
  { id: 'sleep_hygiene', title: 'Dreamcatcher', description: 'Create a sleep-hygiene related habit.', category: 'night', iconName: 'sleep', rewardText: '🛌 Lullaby Ambient Hum', rewardType: 'sound', rarity: 'Common' },

  // Level & XP (41-45)
  { id: 'level_5', title: 'Seedling Graduate', description: 'Reach Level 5.', category: 'level', iconName: 'sprout-outline', rewardText: '🌱 Seedling Graduate Title', rewardType: 'decoration', rarity: 'Common' },
  { id: 'level_10', title: 'Deep Forest', description: 'Reach Level 10.', category: 'level', iconName: 'pine-tree', rewardText: '🌲 Deep Forest Profile Theme', rewardType: 'theme', rarity: 'Rare' },
  { id: 'level_20', title: 'Summit Reached', description: 'Reach Level 20.', category: 'level', iconName: 'flag-triangle', rewardText: '🏔 Mountain Summit Badge', rewardType: 'badge', rarity: 'Epic' },
  { id: 'level_35', title: 'Discipline Knight', description: 'Reach Level 35.', category: 'level', iconName: 'sword', rewardText: '🛡️ Shield and Sword Badge', rewardType: 'badge', rarity: 'Legendary' },
  { id: 'level_50', title: 'Arch Mage', description: 'Reach Level 50.', category: 'level', iconName: 'wizard-hat', rewardText: '🔮 Arch Mage Celestial Border', rewardType: 'decoration', rarity: 'Celestial' },

  // Special Events & Customizers (46-50)
  { id: 'shield_user', title: 'Shield Accrued', description: 'Have at least 1 active Streak Shield.', category: 'special', iconName: 'shield-plus', rewardText: '🛡️ Shield Bearer Title', rewardType: 'decoration', rarity: 'Common' },
  { id: 'sound_customizer', title: 'Acoustic Focus', description: 'Enable custom sounds in settings.', category: 'special', iconName: 'volume-high', rewardText: '🎵 Custom SFX Packs Unlocked', rewardType: 'sound', rarity: 'Common' },
  { id: 'reset_customizer', title: 'Time Bender', description: 'Configure custom daily reset time.', category: 'special', iconName: 'clock-edit', rewardText: '⏳ Clockwork Hourglass Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'shield_saver', title: 'Shield Savior', description: 'Have a streak saved by a Streak Shield.', category: 'special', iconName: 'shield-lock', rewardText: '🛡️ Aegis Protection Badge', rewardType: 'badge', rarity: 'Common' },
  { id: 'multitasker', title: 'Multitasker', description: 'Have 5 or more active habits concurrently.', category: 'special', iconName: 'all-inclusive', rewardText: '🌈 Kaleidoscope Profile Theme', rewardType: 'theme', rarity: 'Rare' },
];

export function evaluateUnlockedAchievements(
  settings: UserSettings,
  habits: Habit[],
  history: HistoryEntry[],
  currentStreak: number
): string[] {
  const unlocked: string[] = [];

  const activeHabits = habits.filter((h) => !h.isArchived);
  const completedEntries = history.filter((e) => e.completed);

  // 1. First Step
  if (completedEntries.length > 0) {
    unlocked.push('first_step');
  }

  // 2. Streaks
  if (currentStreak >= 3) unlocked.push('streak_3');
  if (currentStreak >= 7) unlocked.push('streak_7');
  if (currentStreak >= 14) unlocked.push('streak_14');
  if (currentStreak >= 30) unlocked.push('streak_30');
  if (currentStreak >= 60) unlocked.push('streak_60');
  if (currentStreak >= 90) unlocked.push('streak_90');
  if (currentStreak >= 100) unlocked.push('streak_100');

  // 3. Perfect Week / Month
  if (completedEntries.length >= 7) {
    unlocked.push('perfect_week');
  }
  if (completedEntries.length >= 30) {
    unlocked.push('perfect_month');
  }

  // 4. Reading category
  const readingHabits = activeHabits.filter((h) =>
    h.title.toLowerCase().includes('read') || h.note.toLowerCase().includes('book')
  );
  if (readingHabits.length > 0) {
    unlocked.push('bookworm_1');
  }
  const readingCompletions = completedEntries.filter((e) =>
    readingHabits.some((h) => h.id === e.habitId)
  ).length;
  if (readingCompletions >= 5) unlocked.push('bookworm_5');
  if (readingCompletions >= 30) unlocked.push('bookworm_30');
  if (readingCompletions >= 100) unlocked.push('book_marathon');

  // Reading notes check
  const hasReadingNote = completedEntries.some((e) => {
    const isRead = readingHabits.some((h) => h.id === e.habitId);
    return isRead && e.completedAt && e.completedAt.length > 0;
  });
  if (hasReadingNote && readingHabits.length > 0) {
    unlocked.push('book_club');
  }

  // 5. Fitness category
  const fitnessHabits = activeHabits.filter((h) =>
    h.title.toLowerCase().includes('workout') ||
    h.title.toLowerCase().includes('gym') ||
    h.title.toLowerCase().includes('run') ||
    h.title.toLowerCase().includes('exercise')
  );
  if (fitnessHabits.length > 0) {
    unlocked.push('fitness_1');
  }
  const fitnessCompletions = completedEntries.filter((e) =>
    fitnessHabits.some((h) => h.id === e.habitId)
  ).length;
  if (fitnessCompletions >= 5) unlocked.push('fitness_5');
  if (fitnessCompletions >= 30) unlocked.push('fitness_30');
  if (fitnessCompletions >= 100) unlocked.push('fitness_marathon');

  // Weekend Warrior Check
  const weekendCompletions = completedEntries.filter((e) => {
    try {
      const day = new Date(e.date).getDay();
      return (day === 0 || day === 6) && fitnessHabits.some((h) => h.id === e.habitId);
    } catch {
      return false;
    }
  });
  if (weekendCompletions.length >= 2) {
    unlocked.push('fitness_weekend');
  }

  // 6. Hydration category
  const waterHabits = activeHabits.filter((h) =>
    h.title.toLowerCase().includes('water') || h.title.toLowerCase().includes('hydrate')
  );
  if (waterHabits.length > 0) {
    unlocked.push('hydration_1');
  }
  const waterCompletions = completedEntries.filter((e) =>
    waterHabits.some((h) => h.id === e.habitId)
  ).length;
  if (waterCompletions >= 5) unlocked.push('hydration_5');
  if (waterCompletions >= 30) unlocked.push('hydration_30');
  if (waterCompletions >= 100) unlocked.push('hydration_hero');

  // 7. Meditation category
  const meditationHabits = activeHabits.filter((h) =>
    h.title.toLowerCase().includes('meditat') ||
    h.title.toLowerCase().includes('breath') ||
    h.title.toLowerCase().includes('mindful')
  );
  if (meditationHabits.length > 0) {
    unlocked.push('meditation_1');
  }
  const meditationCompletions = completedEntries.filter((e) =>
    meditationHabits.some((h) => h.id === e.habitId)
  ).length;
  if (meditationCompletions >= 5) unlocked.push('meditation_5');
  if (meditationCompletions >= 30) unlocked.push('meditation_30');
  if (meditationCompletions >= 100) unlocked.push('meditation_master');

  if (meditationCompletions >= 5) {
    unlocked.push('meditation_weekly');
  }

  // 8. Timings (Early Bird / Night Owl)
  const completionsBefore8AM = completedEntries.filter((e) => {
    if (!e.completedAt || e.completedAt === 'shield_protected') return false;
    try {
      const hour = new Date(e.completedAt).getHours();
      return hour < 8;
    } catch {
      return false;
    }
  }).length;

  if (completionsBefore8AM >= 1) unlocked.push('early_bird_1');
  if (completionsBefore8AM >= 5) unlocked.push('early_bird_5');
  if (completionsBefore8AM >= 30) unlocked.push('early_bird_30');

  const completionsAfter9PM = completedEntries.filter((e) => {
    if (!e.completedAt || e.completedAt === 'shield_protected') return false;
    try {
      const hour = new Date(e.completedAt).getHours();
      return hour >= 21;
    } catch {
      return false;
    }
  }).length;

  if (completionsAfter9PM >= 1) unlocked.push('night_owl_1');
  if (completionsAfter9PM >= 5) unlocked.push('night_owl_5');
  if (completionsAfter9PM >= 30) unlocked.push('night_owl_30');

  const completionsByDate: { [date: string]: Array<{ hour: number }> } = {};
  completedEntries.forEach((e) => {
    if (!e.completedAt || e.completedAt === 'shield_protected') return;
    try {
      const dateStr = e.date;
      const hour = new Date(e.completedAt).getHours();
      if (!completionsByDate[dateStr]) completionsByDate[dateStr] = [];
      completionsByDate[dateStr].push({ hour });
    } catch {}
  });

  let hasTripleMorning = false;
  let hasTripleNight = false;
  Object.keys(completionsByDate).forEach((dateStr) => {
    const list = completionsByDate[dateStr];
    const morningCount = list.filter((item) => item.hour < 12).length;
    const nightCount = list.filter((item) => item.hour >= 18).length;
    if (morningCount >= 3) hasTripleMorning = true;
    if (nightCount >= 3) hasTripleNight = true;
  });

  if (hasTripleMorning) unlocked.push('morning_routine_3');
  if (hasTripleNight) unlocked.push('night_routine_3');

  const sleepHabits = activeHabits.filter((h) =>
    h.title.toLowerCase().includes('sleep') || h.title.toLowerCase().includes('bedtime')
  );
  if (sleepHabits.length > 0) {
    unlocked.push('sleep_hygiene');
  }

  // 9. Levels
  if (settings.level >= 5) unlocked.push('level_5');
  if (settings.level >= 10) unlocked.push('level_10');
  if (settings.level >= 20) unlocked.push('level_20');
  if (settings.level >= 35) unlocked.push('level_35');
  if (settings.level >= 50) unlocked.push('level_50');

  // 10. Special Configs
  if (settings.streakShields >= 1) unlocked.push('shield_user');
  if (settings.soundEnabled) unlocked.push('sound_customizer');
  if (settings.dailyResetTime !== '00:00') unlocked.push('reset_customizer');
  if (settings.streakShieldProtectedStreak > 0) unlocked.push('shield_saver');
  if (activeHabits.length >= 5) unlocked.push('multitasker');

  return unlocked;
}
