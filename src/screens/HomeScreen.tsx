import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, Animated, Easing, Dimensions } from 'react-native';
import { Text, Card, Checkbox, IconButton, FAB, Surface, Portal, Provider, Menu, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useHabits } from '../hooks/useHabits';
import { useCelebration } from '../hooks/useCelebration';
import { tw } from '../utils/theme';
import { getGreeting, getTodayString } from '../utils/dateUtils';
import { getQuoteForToday } from '../utils/quoteUtils';
import { isHabitScheduled } from '../utils/streakUtils';
import { Habit } from '../types';
import { HabitFormModal } from './HabitFormModal';
import { MascotIllustration } from '../components/MascotIllustration';
import { MascotCompanionCard } from '../components/MascotCompanionCard';
import { StreakWarningDialog } from '../components/StreakWarningDialog';
import { LevelTimeline } from '../components/LevelTimeline';

// Custom Progress Ring using react-native-svg
const ProgressRing: React.FC<{ percentage: number; size: number; strokeWidth: number }> = ({
  percentage,
  size,
  strokeWidth,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Animated value for smooth progress ring filling
  const animatedOffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    Animated.timing(animatedOffset, {
      toValue: strokeDashoffset,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [percentage, strokeDashoffset]);

  // Animated values in SVG need to be wrapped or manually evaluated.
  // For standard React Native compatibility, we will compute standard animated props.
  return (
    <View style={tw`items-center justify-center`}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8D74FF" />
            <Stop offset="100%" stopColor="#6C4DFF" />
          </LinearGradient>
        </Defs>
        {/* Track circle */}
        <Circle
          stroke="rgba(255, 255, 255, 0.06)"
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress indicator circle */}
        <AnimatedCircle
          stroke="url(#grad)"
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Percentage Center Text */}
      <View style={tw`absolute items-center`}>
        <Text style={tw`text-2xl font-black text-iosTextLight dark:text-iosTextDark`}>{Math.round(percentage)}%</Text>
        <Text style={tw`text-xxs text-iosSubtextLight dark:text-iosSubtextDark uppercase tracking-wider`}>Done</Text>
      </View>
    </View>
  );
};

// Create animated SVG Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);



export const HomeScreen: React.FC = () => {
  const { 
    loading,
    habits, 
    history, 
    todayStr, 
    toggleHabit, 
    getHabitStats, 
    addHabit, 
    editHabit, 
    deleteHabit, 
    archiveHabit,
    overallStreak,
    isTodayCompleted,
    settings
  } = useHabits();
  const { triggerCelebration } = useCelebration();

  // Dialog and form controller states
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // Menu visibility maps
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  
  // Greeting state
  const [greeting, setGreeting] = useState(getGreeting());
  const quote = getQuoteForToday(todayStr);

  // Streak warning state
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningShownToday, setWarningShownToday] = useState(false);

  // Refresh greeting occasionally
  useEffect(() => {
    setGreeting(getGreeting());
  }, [todayStr]);

  // Check if streak is at risk of breaking today
  useEffect(() => {
    if (!loading && habits.length > 0 && overallStreak > 0 && !warningShownToday) {
      const scheduledToday = habits.filter(
        (h) => !h.isArchived && isHabitScheduled(h, todayStr)
      );
      
      if (scheduledToday.length > 0) {
        const completedTodayCount = scheduledToday.filter((h) => {
          const entry = history.find((e) => e.habitId === h.id && e.date === todayStr);
          return entry ? entry.completed : false;
        }).length;
        
        const isRoutineIncomplete = completedTodayCount < scheduledToday.length;
        
        if (isRoutineIncomplete) {
          setWarningVisible(true);
          setWarningShownToday(true);
        }
      }
    }
  }, [loading, habits, history, overallStreak, todayStr, warningShownToday]);

  // Filter today's habits
  const todayHabits = habits.filter(
    (h) => !h.isArchived && isHabitScheduled(h, todayStr)
  );

  const completedToday = todayHabits.filter((h) => {
    const entry = history.find((e) => e.habitId === h.id && e.date === todayStr);
    return entry ? entry.completed : false;
  });

  const totalCount = todayHabits.length;
  const completedCount = completedToday.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Sorting: incomplete first, completed last
  const sortedHabits = [...todayHabits].sort((a, b) => {
    const entryA = history.find((e) => e.habitId === a.id && e.date === todayStr);
    const entryB = history.find((e) => e.habitId === b.id && e.date === todayStr);
    const compA = entryA ? entryA.completed : false;
    const compB = entryB ? entryB.completed : false;
    
    if (compA === compB) return 0;
    return compA ? 1 : -1; // completed goes last
  });

  const handleOpenMenu = (id: string) => {
    setMenuVisible(prev => ({ ...prev, [id]: true }));
  };

  const handleCloseMenu = (id: string) => {
    setMenuVisible(prev => ({ ...prev, [id]: false }));
  };

  const handleEdit = (habit: Habit) => {
    handleCloseMenu(habit.id);
    setEditingHabit(habit);
    setFormOpen(true);
  };

  const handleDuplicate = async (habit: Habit) => {
    handleCloseMenu(habit.id);
    
    // Duplicate with unique name suffix
    const duplicateData = {
      title: `${habit.title} (Copy)`,
      emoji: habit.emoji,
      category: habit.category,
      color: habit.color,
      reminderTime: habit.reminderTime,
      repeatDays: habit.repeatDays,
      startDate: getTodayString(),
      note: habit.note,
    };

    const res = await addHabit(duplicateData);
    if (!res.success) {
      alert(res.error || 'Failed to duplicate');
    }
  };

  const handleArchive = (id: string) => {
    handleCloseMenu(id);
    archiveHabit(id, true);
  };

  const handleDelete = (id: string) => {
    handleCloseMenu(id);
    deleteHabit(id);
  };

  // Generate data for the 7 days of the current week (Mon - Sun)
  const getWeeklyBarStats = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayDiff);

    const barHeights = [];
    const activeHabits = habits.filter(h => !h.isArchived);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const scheduledOnDay = activeHabits.filter(h => isHabitScheduled(h, dateStr));
      if (scheduledOnDay.length === 0) {
        barHeights.push({ pct: 0, active: dateStr === todayStr });
        continue;
      }

      const completedOnDay = scheduledOnDay.filter(h => {
        const ent = history.find(e => e.habitId === h.id && e.date === dateStr);
        return ent ? ent.completed : false;
      }).length;

      const pct = (completedOnDay / scheduledOnDay.length) * 100;
      barHeights.push({ pct, active: dateStr === todayStr });
    }
    return barHeights;
  };

  return (
    <View style={tw`flex-1 bg-iosBgLight dark:bg-[#0B0B12]`}>
      <ScrollView contentContainerStyle={tw`px-5 pt-8 pb-24`}>
        {/* Greetings Section */}
        <View style={tw`flex-row justify-between items-center mb-5`}>
          <View style={tw`flex-1 mr-2`}>
            <Text style={tw`text-2xl font-black tracking-tight text-iosTextLight dark:text-white`}>
              {greeting.text}, {settings.userName} {greeting.emoji}
            </Text>
          </View>
          <View style={tw`w-11 h-11 items-center justify-center bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-iosBorderLight dark:border-iosBorderDark shadow-sm`}>
            <MascotIllustration pose="avatar" width={44} height={44} />
          </View>
        </View>

        {/* Quotes Section */}
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-[#1A1B28] border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <Text style={tw`text-base italic leading-relaxed text-iosTextLight dark:text-[#D5D5E5]`}>
            "{quote.text}"
          </Text>
          {quote.author && (
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mt-3 text-right font-semibold`}>
              — {quote.author}
            </Text>
          )}
        </Card>

        {/* Today's Progress Card (Full Width) */}
        <Card style={tw`w-full p-5 rounded-[24px] bg-iosCardLight dark:bg-[#1B1C29] border border-iosBorderLight dark:border-iosBorderDark mb-4 shadow-sm`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-1 pr-4 justify-between h-[110px]`}>
              <View>
                <Text style={tw`text-xs font-bold text-iosSubtextLight dark:text-iosSubtextDark uppercase tracking-wider`}>
                  Today's Progress
                </Text>
                <Text style={tw`text-2xl font-black text-iosTextLight dark:text-white mt-1`}>
                  {completedCount} / {totalCount} Habits
                </Text>
              </View>
              {/* Weekly progress bar chart */}
              <View style={tw`flex-row gap-1.5 items-end h-8 mt-2`}>
                {getWeeklyBarStats().map((bar, idx) => {
                  const heightVal = Math.max(4, Math.floor((bar.pct / 100) * 24));
                  return (
                    <View 
                      key={idx} 
                      style={[
                        tw`w-2.5 rounded-full`, 
                        { height: heightVal },
                        bar.active 
                          ? tw`bg-[#6C4DFF]` 
                          : bar.pct === 100 
                            ? tw`bg-[#6C4DFF]/60` 
                            : tw`bg-black/10 dark:bg-white/10`
                      ]}
                    />
                  );
                })}
              </View>
            </View>
            <ProgressRing percentage={percentage} size={110} strokeWidth={10} />
          </View>
        </Card>

        {/* Current Streak Card (Full Width) */}
        <Card style={tw`w-full p-4 rounded-[24px] bg-iosCardLight dark:bg-[#1A1B28] border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <View style={tw`flex-row items-center gap-4`}>
            <View style={tw`w-12 h-12 rounded-[18px] bg-amber/10 items-center justify-center`}>
              <Text style={tw`text-2xl`}>🔥</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-extrabold text-iosTextLight dark:text-white`}>
                {overallStreak} Day Streak
              </Text>
              <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mt-0.5`}>
                {isTodayCompleted 
                  ? "Today completed. Streak safe! 🎉"
                  : "Complete today's habits to keep your streak alive!"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Level Progression Timeline */}
        <LevelTimeline currentStreak={overallStreak} />

        {/* Today's Habits Header */}
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`text-lg font-bold text-iosTextLight dark:text-iosTextDark`}>
            Today's Habits
          </Text>
          {totalCount === 0 && (
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark`}>
              No habits scheduled
            </Text>
          )}
        </View>

        {/* Mascot Companion Card Widget */}
        <MascotCompanionCard userName={settings.userName} />

        {/* Habits Checklist */}
        {sortedHabits.map((habit) => {
          const entry = history.find((e) => e.habitId === habit.id && e.date === todayStr);
          const isCompleted = entry ? entry.completed : false;
          const stats = getHabitStats(habit);

          return (
            <View
              key={habit.id}
              style={[
                tw`mb-4 h-[78px] rounded-[18px] bg-iosCardLight dark:bg-[#1A1B28] border flex-row items-center px-4 shadow-sm justify-between`,
                isCompleted 
                  ? tw`border-[#6C4DFF]/30 dark:border-[#6C4DFF]/20` 
                  : tw`border-iosBorderLight dark:border-iosBorderDark`
              ]}
            >
              {/* Left Side: Completion Checkbox & Details */}
              <View style={tw`flex-1 flex-row items-center`}>
                <TouchableOpacity
                  onPress={async () => {
                    const nextState = !isCompleted;
                    await toggleHabit(habit.id, todayStr);
                    
                    if (nextState) {
                      const totalScheduled = sortedHabits.length;
                      const nextCompletedCount = sortedHabits.filter(h => {
                        if (h.id === habit.id) return true;
                        const ent = history.find(e => e.habitId === h.id && e.date === todayStr);
                        return ent ? ent.completed : false;
                      }).length;
                      
                      const todayAlreadyCompleted = sortedHabits.every(h => {
                        if (h.id === habit.id) return false;
                        const ent = history.find(e => e.habitId === h.id && e.date === todayStr);
                        return ent ? ent.completed : false;
                      });
                      
                      let nextStreak = overallStreak;
                      if (nextCompletedCount === totalScheduled && !todayAlreadyCompleted) {
                        nextStreak = overallStreak + 1;
                      }
                      
                      triggerCelebration(
                        habit.title,
                        nextStreak === 0 ? 1 : nextStreak,
                        totalScheduled,
                        nextCompletedCount
                      );
                    }
                  }}
                  style={tw`mr-3 h-11 w-11 items-center justify-center`}
                >
                  {isCompleted ? (
                    <View style={tw`h-8 w-8 rounded-full bg-[#6C4DFF] items-center justify-center`}>
                      <MaterialCommunityIcons name="check" size={18} color="white" />
                    </View>
                  ) : (
                    <View style={tw`h-8 w-8 rounded-full border-2 border-iosBorderLight dark:border-white/40 bg-transparent`} />
                  )}
                </TouchableOpacity>

                {/* Habit details */}
                <View style={tw`flex-1 pr-2`}>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-lg mr-2`}>{habit.emoji}</Text>
                    <Text
                      style={[
                        tw`text-base font-bold text-iosTextLight dark:text-iosTextDark`,
                        isCompleted && tw`line-through text-iosSubtextLight dark:text-iosSubtextDark`
                      ]}
                      numberOfLines={1}
                    >
                      {habit.title}
                    </Text>
                  </View>
                  
                  {habit.note ? (
                    <Text 
                      style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mt-0.5`}
                      numberOfLines={1}
                    >
                      {habit.note}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Right Side: Streak Badge & Options Menu */}
              <View style={tw`flex-row items-center`}>
                <View style={tw`flex-row items-center bg-coral/10 dark:bg-coral/20 px-2.5 py-0.5 rounded-full mr-1`}>
                  <Text style={tw`text-xs`}>🔥</Text>
                  <Text style={tw`text-xs font-bold text-coral ml-0.5`}>
                    {stats.currentStreak}
                  </Text>
                </View>

                <Menu
                  visible={!!menuVisible[habit.id]}
                  onDismiss={() => handleCloseMenu(habit.id)}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      iconColor={tw.color('iosSubtextLight')}
                      onPress={() => handleOpenMenu(habit.id)}
                      style={tw`m-0`}
                    />
                  }
                  contentStyle={tw`bg-iosCardLight dark:bg-[#1A1B28] rounded-2xl border border-iosBorderLight dark:border-iosBorderDark`}
                >
                  <Menu.Item onPress={() => handleEdit(habit)} leadingIcon="pencil" title="Edit" titleStyle={tw`text-iosTextLight dark:text-iosTextDark`} />
                  <Menu.Item onPress={() => handleDuplicate(habit)} leadingIcon="content-copy" title="Duplicate" titleStyle={tw`text-iosTextLight dark:text-iosTextDark`} />
                  <Menu.Item onPress={() => handleArchive(habit.id)} leadingIcon="archive" title="Archive" titleStyle={tw`text-iosTextLight dark:text-iosTextDark`} />
                  <Menu.Item onPress={() => handleDelete(habit.id)} leadingIcon="delete" title="Delete" titleStyle={tw`text-coral font-bold`} />
                </Menu>
              </View>
            </View>
          );
        })}

        {/* Empty State Banner */}
        {todayHabits.length === 0 && (
          <View style={tw`items-center justify-center py-10 px-6`}>
            <Text style={tw`text-4xl mb-4`}>🌱</Text>
            <Text style={tw`text-base font-bold text-iosTextLight dark:text-iosTextDark text-center mb-1`}>
              No Habits Scheduled For Today
            </Text>
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark text-center leading-relaxed px-4`}>
              Tap the button below to add a habit or edit existing ones to fit today's routine.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for Habit Creation */}
      <FAB
        icon="plus"
        color="#FFFFFF"
        style={tw`absolute bottom-22 right-5 rounded-full bg-[#6C4DFF] shadow-lg`}
        onPress={() => {
          setEditingHabit(null);
          setFormOpen(true);
        }}
      />

      {/* Habit Create / Edit Modal Form */}
      {formOpen && (
        <HabitFormModal
          visible={formOpen}
          habit={editingHabit}
          onClose={() => setFormOpen(false)}
        />
      )}

      {/* Streak Warning Overlay Modal */}
      <StreakWarningDialog
        visible={warningVisible}
        streakCount={overallStreak}
        onDismiss={() => setWarningVisible(false)}
      />
    </View>
  );
};
