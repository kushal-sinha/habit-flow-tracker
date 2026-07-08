import * as SQLite from 'expo-sqlite';
import { Habit, HistoryEntry, UserSettings } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Open database synchronously to initialize it
export function getDB(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('habit_tracker.db');
  }
  return dbInstance;
}

// Initialize tables and run migrations
export async function initDatabase(): Promise<void> {
  const db = getDB();
  
  // Table 1: habits
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      emoji TEXT NOT NULL,
      category TEXT NOT NULL,
      color TEXT NOT NULL,
      reminderTime TEXT,
      repeatDays TEXT NOT NULL,
      startDate TEXT NOT NULL,
      note TEXT NOT NULL,
      isArchived INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      userId TEXT NOT NULL
    );
  `);

  // Table 2: history_entries
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS history_entries (
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completedAt TEXT,
      userId TEXT NOT NULL,
      PRIMARY KEY (habitId, date, userId)
    );
  `);

  // Table 3: user_settings
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_settings (
      userId TEXT PRIMARY KEY NOT NULL,
      theme TEXT DEFAULT 'system',
      notificationsEnabled INTEGER DEFAULT 0,
      notificationTime TEXT DEFAULT '09:00',
      notificationMessage TEXT DEFAULT 'Don''t forget today''s habits 🌱',
      userName TEXT DEFAULT 'User',
      soundEnabled INTEGER DEFAULT 1,
      hapticEnabled INTEGER DEFAULT 1,
      dailyResetTime TEXT DEFAULT '00:00',
      streakShields INTEGER DEFAULT 0,
      lastDailyResetDate TEXT DEFAULT NULL,
      showStreakLostScreen INTEGER DEFAULT 0,
      streakShieldProtectedStreak INTEGER DEFAULT 0
    );
  `);

  // Run settings column migrations
  try {
    await db.execAsync('ALTER TABLE user_settings ADD COLUMN soundEnabled INTEGER DEFAULT 1;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE user_settings ADD COLUMN hapticEnabled INTEGER DEFAULT 1;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE user_settings ADD COLUMN dailyResetTime TEXT DEFAULT \'00:00\';');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE user_settings ADD COLUMN streakShields INTEGER DEFAULT 0;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE user_settings ADD COLUMN lastDailyResetDate TEXT DEFAULT NULL;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE user_settings ADD COLUMN showStreakLostScreen INTEGER DEFAULT 0;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE user_settings ADD COLUMN streakShieldProtectedStreak INTEGER DEFAULT 0;');
  } catch {}

  // Create indexes for performance on larger datasets
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(userId);
    CREATE INDEX IF NOT EXISTS idx_history_user_date ON history_entries(userId, date);
  `);
}

// Habits CRUD operations
export async function dbGetHabits(userId: string): Promise<Habit[]> {
  const db = getDB();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM habits WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
  
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    category: row.category,
    color: row.color,
    reminderTime: row.reminderTime,
    repeatDays: JSON.parse(row.repeatDays),
    startDate: row.startDate,
    note: row.note,
    isArchived: row.isArchived === 1,
    createdAt: row.createdAt,
    userId: row.userId,
  }));
}

export async function dbSaveHabit(habit: Habit): Promise<void> {
  const db = getDB();
  const repeatDaysStr = JSON.stringify(habit.repeatDays);
  const isArchivedVal = habit.isArchived ? 1 : 0;
  
  await db.runAsync(
    `INSERT OR REPLACE INTO habits (
      id, title, emoji, category, color, reminderTime, repeatDays, startDate, note, isArchived, createdAt, userId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.title,
      habit.emoji,
      habit.category,
      habit.color,
      habit.reminderTime,
      repeatDaysStr,
      habit.startDate,
      habit.note,
      isArchivedVal,
      habit.createdAt,
      habit.userId,
    ]
  );
}

export async function dbDeleteHabit(id: string, userId: string): Promise<void> {
  const db = getDB();
  // Deleting a habit should clean up its history entries as well
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM habits WHERE id = ? AND userId = ?', [id, userId]);
    await db.runAsync('DELETE FROM history_entries WHERE habitId = ? AND userId = ?', [id, userId]);
  });
}

// History Toggle & Queries
export async function dbGetHistory(userId: string): Promise<HistoryEntry[]> {
  const db = getDB();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM history_entries WHERE userId = ?',
    [userId]
  );
  
  return rows.map((row) => ({
    habitId: row.habitId,
    date: row.date,
    completed: row.completed === 1,
    completedAt: row.completedAt,
    userId: row.userId,
  }));
}

export async function dbToggleCompletion(
  habitId: string,
  date: string,
  userId: string,
  completed: boolean
): Promise<void> {
  const db = getDB();
  const completedVal = completed ? 1 : 0;
  const completedAtVal = completed ? new Date().toISOString() : null;
  
  if (completed) {
    await db.runAsync(
      `INSERT OR REPLACE INTO history_entries (habitId, date, completed, completedAt, userId) 
       VALUES (?, ?, ?, ?, ?)`,
      [habitId, date, completedVal, completedAtVal, userId]
    );
  } else {
    // To save space and keep database small, we can just delete uncompleted records
    await db.runAsync(
      'DELETE FROM history_entries WHERE habitId = ? AND date = ? AND userId = ?',
      [habitId, date, userId]
    );
  }
}

// User Settings operations
export async function dbGetUserSettings(userId: string, defaultName: string = 'Kushal'): Promise<UserSettings> {
  const db = getDB();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM user_settings WHERE userId = ?',
    [userId]
  );
  
  if (!row) {
    const defaultSettings: UserSettings = {
      userId,
      theme: 'system',
      notificationsEnabled: false,
      notificationTime: '09:00',
      notificationMessage: "Don't forget today's habits 🌱",
      userName: defaultName,
      soundEnabled: true,
      hapticEnabled: true,
      dailyResetTime: '00:00',
      streakShields: 0,
      lastDailyResetDate: null,
      showStreakLostScreen: false,
      streakShieldProtectedStreak: 0,
    };
    await dbSaveUserSettings(defaultSettings);
    return defaultSettings;
  }
  
  return {
    userId: row.userId,
    theme: row.theme as 'light' | 'dark' | 'system',
    notificationsEnabled: row.notificationsEnabled === 1,
    notificationTime: row.notificationTime,
    notificationMessage: row.notificationMessage,
    userName: row.userName,
    soundEnabled: row.soundEnabled !== 0,
    hapticEnabled: row.hapticEnabled !== 0,
    dailyResetTime: row.dailyResetTime ?? '00:00',
    streakShields: row.streakShields ?? 0,
    lastDailyResetDate: row.lastDailyResetDate ?? null,
    showStreakLostScreen: row.showStreakLostScreen === 1,
    streakShieldProtectedStreak: row.streakShieldProtectedStreak ?? 0,
  };
}

export async function dbSaveUserSettings(settings: UserSettings): Promise<void> {
  const db = getDB();
  const notifVal = settings.notificationsEnabled ? 1 : 0;
  const soundVal = settings.soundEnabled ? 1 : 0;
  const hapticVal = settings.hapticEnabled ? 1 : 0;
  const showLostVal = settings.showStreakLostScreen ? 1 : 0;
  
  await db.runAsync(
    `INSERT OR REPLACE INTO user_settings (
       userId, theme, notificationsEnabled, notificationTime, notificationMessage, 
       userName, soundEnabled, hapticEnabled, dailyResetTime, streakShields, 
       lastDailyResetDate, showStreakLostScreen, streakShieldProtectedStreak
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      settings.userId,
      settings.theme,
      notifVal,
      settings.notificationTime,
      settings.notificationMessage,
      settings.userName,
      soundVal,
      hapticVal,
      settings.dailyResetTime,
      settings.streakShields,
      settings.lastDailyResetDate,
      showLostVal,
      settings.streakShieldProtectedStreak,
    ]
  );
}

// Backup & Restore
export interface BackupPayload {
  habits: Habit[];
  history: HistoryEntry[];
  settings: UserSettings;
}

export async function dbBackupData(userId: string): Promise<string> {
  const habits = await dbGetHabits(userId);
  const history = await dbGetHistory(userId);
  const settings = await dbGetUserSettings(userId);
  
  const payload: BackupPayload = {
    habits,
    history,
    settings,
  };
  
  return JSON.stringify(payload);
}

export async function dbRestoreData(userId: string, backupJson: string): Promise<void> {
  const db = getDB();
  const data = JSON.parse(backupJson) as BackupPayload;
  
  if (!data.habits || !data.history || !data.settings) {
    throw new Error('Invalid backup file format');
  }
  
  await db.withTransactionAsync(async () => {
    // 1. Delete existing records for user
    await db.runAsync('DELETE FROM habits WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM history_entries WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM user_settings WHERE userId = ?', [userId]);
    
    // 2. Restore settings
    await dbSaveUserSettings({
      ...data.settings,
      userId, // guarantee it maps to current user
    });
    
    // 3. Restore habits
    for (const habit of data.habits) {
      const repeatDaysStr = JSON.stringify(habit.repeatDays);
      const archivedVal = habit.isArchived ? 1 : 0;
      await db.runAsync(
        `INSERT INTO habits (
          id, title, emoji, category, color, reminderTime, repeatDays, startDate, note, isArchived, createdAt, userId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          habit.id,
          habit.title,
          habit.emoji,
          habit.category,
          habit.color,
          habit.reminderTime,
          repeatDaysStr,
          habit.startDate,
          habit.note,
          archivedVal,
          habit.createdAt,
          userId,
        ]
      );
    }
    
    // 4. Restore history
    for (const entry of data.history) {
      const completedVal = entry.completed ? 1 : 0;
      await db.runAsync(
        `INSERT INTO history_entries (habitId, date, completed, completedAt, userId) 
         VALUES (?, ?, ?, ?, ?)`,
        [entry.habitId, entry.date, completedVal, entry.completedAt, userId]
      );
    }
  });
}
