import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { Habit, HistoryEntry, UserSettings, StreakStats } from '../types';
import { 
  initDatabase, 
  dbGetHabits, 
  dbSaveHabit, 
  dbDeleteHabit, 
  dbGetHistory, 
  dbToggleCompletion, 
  dbGetUserSettings, 
  dbSaveUserSettings, 
  dbBackupData, 
  dbRestoreData,
  getDB
} from '../db/sqlite';
import { getTodayString, addDays, differenceInCalendarDays } from '../utils/dateUtils';
import { isHabitScheduled, calculateHabitStats, calculateOverallStreak } from '../utils/streakUtils';

interface HabitsContextType {
  habits: Habit[];
  history: HistoryEntry[];
  settings: UserSettings;
  todayStr: string;
  loading: boolean;
  refreshData: () => Promise<void>;
  addHabit: (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'isArchived'>) => Promise<{ success: boolean; error?: string }>;
  editHabit: (id: string, habitData: Partial<Habit>) => Promise<{ success: boolean; error?: string }>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string, isArchived: boolean) => Promise<void>;
  toggleHabit: (habitId: string, date: string) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  backup: () => Promise<string>;
  restore: (backupJson: string) => Promise<{ success: boolean; error?: string }>;
  
  // Computed stats
  overallStreak: number;
  overallLongestStreak: number;
  isTodayCompleted: boolean;
  getHabitStats: (habit: Habit) => StreakStats;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const userId = user?.id || 'guest_user'; // fallback to guest if offline or not logged in
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userId,
    theme: 'system',
    notificationsEnabled: false,
    notificationTime: '09:00',
    notificationMessage: "Don't forget today's habits 🌱",
    userName: user?.firstName || 'Kushal',
    soundEnabled: true,
    hapticEnabled: true,
  });
  const [todayStr, setTodayStr] = useState<string>(getTodayString());
  const [loading, setLoading] = useState<boolean>(true);
  
  const midnightInterval = useRef<any>(null);

  // Load database and sync state on mount/user change
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await initDatabase();
        await loadAndSyncData();
      } catch (error) {
        console.error('Error bootstrapping database: ', error);
      } finally {
        setLoading(false);
      }
    };
    
    bootstrap();
    
    // Set up midnight checker to refresh todayStr when the clock crosses midnight
    midnightInterval.current = setInterval(() => {
      const currentToday = getTodayString();
      if (currentToday !== todayStr) {
        setTodayStr(currentToday);
        loadAndSyncData(); // reload statistics and schedules for the new day
      }
    }, 10000); // check every 10 seconds (highly lightweight)
    
    return () => {
      if (midnightInterval.current) {
        clearInterval(midnightInterval.current);
      }
    };
  }, [userId, todayStr]);

  // Bulk catch-up routine: inserts skip markers (completed = 0) for past scheduled days that were ignored
  const runCatchUp = async (habitsList: Habit[]): Promise<HistoryEntry[]> => {
    const db = getDB();
    const today = getTodayString();
    
    // 1. Fetch all existing history records for this user
    const existingRows = await db.getAllAsync<any>(
      'SELECT habitId, date FROM history_entries WHERE userId = ?',
      [userId]
    );
    const existingSet = new Set(existingRows.map(r => `${r.habitId}:${r.date}`));
    
    const missingEntries: { habitId: string; date: string }[] = [];
    
    // 2. Scan habits and dates to find missing records
    habitsList.forEach((habit) => {
      if (habit.isArchived) return;
      
      const start = habit.startDate;
      const yesterday = addDays(today, -1);
      
      if (start > yesterday) return;
      
      const diff = differenceInCalendarDays(yesterday, start);
      
      for (let i = 0; i <= diff; i++) {
        const checkDate = addDays(start, i);
        if (isHabitScheduled(habit, checkDate)) {
          const key = `${habit.id}:${checkDate}`;
          if (!existingSet.has(key)) {
            missingEntries.push({ habitId: habit.id, date: checkDate });
          }
        }
      }
    });
    
    // 3. Insert missing entries in a single transaction if any exist
    if (missingEntries.length > 0) {
      await db.withTransactionAsync(async () => {
        const stmt = await db.prepareAsync(
          'INSERT INTO history_entries (habitId, date, completed, completedAt, userId) VALUES (?, ?, 0, NULL, ?)'
        );
        try {
          for (const entry of missingEntries) {
            await stmt.executeAsync([entry.habitId, entry.date, userId]);
          }
        } finally {
          await stmt.finalizeAsync();
        }
      });
    }
    
    // Reload updated history list
    return dbGetHistory(userId);
  };

  const loadAndSyncData = async () => {
    // 1. Get user settings
    const loadedSettings = await dbGetUserSettings(userId, user?.firstName || 'Kushal');
    setSettings(loadedSettings);
    
    // 2. Get habits
    const loadedHabits = await dbGetHabits(userId);
    setHabits(loadedHabits);
    
    // 3. Run catch-up to ensure historical integrity for streaks
    const updatedHistory = await runCatchUp(loadedHabits);
    setHistory(updatedHistory);
  };

  const refreshData = async () => {
    try {
      await loadAndSyncData();
    } catch (err) {
      console.error('Error refreshing data: ', err);
    }
  };

  const addHabit = async (
    habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'isArchived'>
  ): Promise<{ success: boolean; error?: string }> => {
    // Validation
    const trimmedTitle = habitData.title.trim();
    if (!trimmedTitle) {
      return { success: false, error: 'Title is required' };
    }
    if (trimmedTitle.length > 50) {
      return { success: false, error: 'Title must be 50 characters or less' };
    }
    if (habitData.note && habitData.note.length > 250) {
      return { success: false, error: 'Note must be 250 characters or less' };
    }
    
    // Check duplicates (non-archived only)
    const duplicate = habits.find(
      (h) => h.title.toLowerCase() === trimmedTitle.toLowerCase() && !h.isArchived
    );
    if (duplicate) {
      return { success: false, error: 'A habit with this name already exists' };
    }
    
    // Check max limit (30 habits)
    const activeCount = habits.filter(h => !h.isArchived).length;
    if (activeCount >= 30) {
      return { success: false, error: 'Maximum limit of 30 active habits reached' };
    }

    const newHabit: Habit = {
      ...habitData,
      title: trimmedTitle,
      id: Math.random().toString(36).substr(2, 9), // uuid-like
      userId,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await dbSaveHabit(newHabit);
      await loadAndSyncData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Database error occurred' };
    }
  };

  const editHabit = async (
    id: string,
    habitData: Partial<Habit>
  ): Promise<{ success: boolean; error?: string }> => {
    const existing = habits.find(h => h.id === id);
    if (!existing) return { success: false, error: 'Habit not found' };

    let updatedTitle = existing.title;
    if (habitData.title !== undefined) {
      updatedTitle = habitData.title.trim();
      if (!updatedTitle) {
        return { success: false, error: 'Title is required' };
      }
      if (updatedTitle.length > 50) {
        return { success: false, error: 'Title must be 50 characters or less' };
      }
      
      // Check duplicate name
      const duplicate = habits.find(
        (h) => h.id !== id && h.title.toLowerCase() === updatedTitle.toLowerCase() && !h.isArchived
      );
      if (duplicate) {
        return { success: false, error: 'A habit with this name already exists' };
      }
    }
    
    if (habitData.note && habitData.note.length > 250) {
      return { success: false, error: 'Note must be 250 characters or less' };
    }

    const updatedHabit: Habit = {
      ...existing,
      ...habitData,
      title: updatedTitle,
    };

    try {
      await dbSaveHabit(updatedHabit);
      await loadAndSyncData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Database error' };
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await dbDeleteHabit(id, userId);
      await loadAndSyncData();
    } catch (err) {
      console.error('Error deleting habit: ', err);
    }
  };

  const archiveHabit = async (id: string, isArchived: boolean) => {
    try {
      const existing = habits.find(h => h.id === id);
      if (!existing) return;
      
      const updated = { ...existing, isArchived };
      await dbSaveHabit(updated);
      await loadAndSyncData();
    } catch (err) {
      console.error('Error archiving habit: ', err);
    }
  };

  const toggleHabit = async (habitId: string, date: string) => {
    // Determine the current state
    const entry = history.find(e => e.habitId === habitId && e.date === date);
    const currentlyCompleted = entry ? entry.completed : false;
    const nextCompletedState = !currentlyCompleted;
    
    try {
      await dbToggleCompletion(habitId, date, userId, nextCompletedState);
      
      // Fast optimistic update
      setHistory(prev => {
        const filtered = prev.filter(e => !(e.habitId === habitId && e.date === date));
        if (nextCompletedState) {
          return [
            ...filtered,
            { habitId, date, completed: true, completedAt: new Date().toISOString(), userId }
          ];
        }
        return filtered;
      });
      
      // Sync from DB in the background
      refreshData();
    } catch (err) {
      console.error('Error toggling habit: ', err);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await dbSaveUserSettings(updated);
    } catch (err) {
      console.error('Error saving settings: ', err);
    }
  };

  const backup = async () => {
    return dbBackupData(userId);
  };

  const restore = async (backupJson: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await dbRestoreData(userId, backupJson);
      await loadAndSyncData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Restore failed' };
    }
  };

  // Memoized overall stats calculations
  const stats = calculateOverallStreak(habits, history, todayStr);
  const overallStreak = stats.currentStreak;
  const overallLongestStreak = stats.longestStreak;
  const isTodayCompleted = stats.isTodayCompleted;

  const getHabitStats = (habit: Habit): StreakStats => {
    return calculateHabitStats(habit, history, todayStr);
  };

  return (
    <HabitsContext.Provider value={{
      habits,
      history,
      settings,
      todayStr,
      loading,
      refreshData,
      addHabit,
      editHabit,
      deleteHabit,
      archiveHabit,
      toggleHabit,
      updateSettings,
      backup,
      restore,
      overallStreak,
      overallLongestStreak,
      isTodayCompleted,
      getHabitStats,
    }}>
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};
