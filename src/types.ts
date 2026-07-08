export interface Habit {
  id: string;
  title: string;
  emoji: string;
  category: string;
  color: string; // Tailwind color name (e.g. 'coral', 'indigo', 'emerald')
  reminderTime: string | null; // "HH:MM" format
  repeatDays: 'daily' | 'weekdays' | 'weekends' | string[]; // 'daily', 'weekdays', 'weekends', or custom weekdays array e.g. ['mon', 'wed', 'fri']
  startDate: string; // YYYY-MM-DD
  note: string;
  isArchived: boolean;
  createdAt: string;
  userId: string;
  difficulty?: 'easy' | 'hard';
}

export interface HistoryEntry {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt: string | null; // ISO timestamp
  userId: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  notificationTime: string; // "HH:MM" format
  notificationMessage: string;
  userName: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  dailyResetTime: string; // "HH:MM" format (default "00:00")
  streakShields: number; // 0 to 3 (max 3)
  lastDailyResetDate: string | null; // "YYYY-MM-DD"
  showStreakLostScreen: boolean;
  streakShieldProtectedStreak: number; // > 0 triggers shield protection modal
  xp: number;
  level: number;
  unlockedCharacters: string[];
  unlockedAchievements: string[];
  lastWeeklyReviewDate: string | null;
  lastMonthlyReviewDate: string | null;
  badges?: string[];
}

export interface Quote {
  text: string;
  author: string | null;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage
  totalCompleted: number;
  missedDays: number;
}
