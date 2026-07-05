import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Surface } from 'react-native-paper';
import { MascotIllustration } from './MascotIllustration';
import { useHabits } from '../hooks/useHabits';
import { isHabitScheduled } from '../utils/streakUtils';
import { tw } from '../utils/theme';

interface MascotCompanionCardProps {
  userName?: string;
}

export const MascotCompanionCard: React.FC<MascotCompanionCardProps> = ({ userName = 'Kushal' }) => {
  const { habits, history, todayStr, overallStreak } = useHabits();
  const systemColorScheme = useColorScheme();
  const activeTheme = systemColorScheme === 'dark' ? 'dark' : 'light';

  // 1. Filter habits scheduled for today
  const scheduledToday = habits.filter(
    (h) => !h.isArchived && isHabitScheduled(h, todayStr)
  );
  
  const totalCount = scheduledToday.length;
  
  const completedCount = scheduledToday.filter((h) => {
    const entry = history.find((e) => e.habitId === h.id && e.date === todayStr);
    return entry ? entry.completed : false;
  }).length;

  const incompleteCount = totalCount - completedCount;

  // 2. Select dynamic greeting message and pose
  let title = `Hey ${userName}! 👋`;
  let message = "Let's make today a great day. Complete your first habit to start the engine!";
  let pose: 'idle' | 'cheer' | 'trophy' | 'sad' = 'idle';

  if (totalCount === 0) {
    title = `Rest day, ${userName}! 🌿`;
    message = "No habits scheduled for today. Perfect time to recharge and plan ahead!";
    pose = 'idle';
  } else if (completedCount === totalCount) {
    title = `Perfect Score! 🎉`;
    message = `All ${totalCount} habits completed! You've locked in today's streak. You're unstoppable!`;
    pose = overallStreak >= 14 ? 'trophy' : 'cheer';
  } else if (completedCount > 0) {
    title = `In the Flow! ⚡️`;
    message = `Nice! You've cleared ${completedCount} of ${totalCount} habits. Just ${incompleteCount} more to go today!`;
    pose = 'idle';
  } else if (overallStreak > 0) {
    title = `${overallStreak}-Day Streak! 🔥`;
    message = `Keep your ${overallStreak}-day streak alive! Complete today's checklist to maintain momentum.`;
    pose = 'idle';
  } else {
    // Zero habits completed and zero streak
    title = `Let's do this! 💪`;
    message = `You have ${totalCount} habits scheduled for today. Take them one step at a time!`;
    pose = 'idle';
  }

  // Soft sad pose if it's late in the day (e.g. past 8pm) and nothing completed
  const currentHour = new Date().getHours();
  if (completedCount === 0 && totalCount > 0 && currentHour >= 20) {
    title = `Still time today, ${userName}!`;
    message = "It's getting late, but even a small effort counts. Let's get one habit checked off!";
    pose = 'sad';
  }

  return (
    <Surface
      style={[
        tw`p-4 rounded-3xl border flex-row items-center gap-4 mb-5 shadow-sm`,
        activeTheme === 'dark' 
          ? tw`bg-iosCardDark border-iosBorderDark` 
          : tw`bg-[#FFFFFF] border-iosBorderLight`
      ]}
      elevation={2}
    >
      {/* Left Column: Mascot character with dynamic pose */}
      <View style={tw`w-20 h-20 items-center justify-center bg-black/5 dark:bg-white/5 rounded-2xl`}>
        <MascotIllustration pose={pose} width={90} height={90} />
      </View>

      {/* Right Column: Dynamic Speech Bubble */}
      <View style={tw`flex-1`}>
        <Text style={[tw`text-base font-black mb-1`, activeTheme === 'dark' ? tw`text-white` : tw`text-black`]}>
          {title}
        </Text>
        <Text style={tw`text-xs font-semibold leading-4 text-iosSubtextLight dark:text-iosSubtextDark`}>
          {message}
        </Text>
      </View>
    </Surface>
  );
};
