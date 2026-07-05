import React, { createContext, useContext, useState, useCallback } from 'react';
import { triggerHaptic } from '../services/hapticService';
import { playSuccessSound } from '../services/soundService';
import { useHabits } from './useHabits';
import { getMilestoneInfo } from '../utils/celebrationUtils';

export interface CelebrationItem {
  id: string;
  habitTitle: string;
  streakCount: number;
  totalHabitsCount: number;
  completedHabitsCount: number;
  milestoneLevel: 0 | 3 | 7 | 14 | 30 | 50 | 100;
  animationName: string;
  title: string;
  motivationalMessage: string;
  hapticStyle: 'light' | 'medium' | 'heavy' | 'success';
}

interface CelebrationContextType {
  currentCelebration: CelebrationItem | null;
  queue: CelebrationItem[];
  triggerCelebration: (
    habitTitle: string,
    streakCount: number,
    totalHabitsCount: number,
    completedHabitsCount: number
  ) => void;
  dismissCelebration: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<CelebrationItem[]>([]);
  const { settings } = useHabits();

  const triggerCelebration = useCallback(
    (
      habitTitle: string,
      streakCount: number,
      totalHabitsCount: number,
      completedHabitsCount: number
    ) => {
      // 1. Resolve milestone metadata based on streak
      const info = getMilestoneInfo(streakCount);

      // 2. Queue the celebration
      const item: CelebrationItem = {
        id: Math.random().toString(36).substring(2, 9),
        habitTitle,
        streakCount,
        totalHabitsCount,
        completedHabitsCount,
        ...info,
      };

      setQueue((prev) => [...prev, item]);

      // 3. Immediately trigger sound & haptics based on settings
      triggerHaptic(info.hapticStyle);
      playSuccessSound(settings.soundEnabled ?? true);
    },
    [settings.soundEnabled, settings.hapticEnabled]
  );

  const dismissCelebration = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const currentCelebration = queue[0] || null;

  return (
    <CelebrationContext.Provider
      value={{
        currentCelebration,
        queue,
        triggerCelebration,
        dismissCelebration,
      }}
    >
      {children}
    </CelebrationContext.Provider>
  );
};

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
};
