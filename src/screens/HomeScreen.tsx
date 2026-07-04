import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, Animated, Easing, Dimensions } from 'react-native';
import { Text, Card, Checkbox, IconButton, FAB, Surface, Portal, Provider, Menu, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useHabits } from '../hooks/useHabits';
import { tw } from '../utils/theme';
import { getGreeting, getTodayString } from '../utils/dateUtils';
import { getQuoteForToday } from '../utils/quoteUtils';
import { isHabitScheduled } from '../utils/streakUtils';
import { Habit } from '../types';
import { HabitFormModal } from './HabitFormModal';

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
            <Stop offset="0%" stopColor="#5E5CE6" />
            <Stop offset="100%" stopColor="#34C759" />
          </LinearGradient>
        </Defs>
        {/* Track circle */}
        <Circle
          stroke={tw.color('iosBorderLight') || '#E5E5EA'}
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

// Custom self-contained Confetti celebration system
interface ConfettiParticle {
  id: number;
  emoji: string;
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

export const HomeScreen: React.FC = () => {
  const { 
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

  // Dialog and form controller states
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // Menu visibility maps
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  
  // Greeting state
  const [greeting, setGreeting] = useState(getGreeting());
  const quote = getQuoteForToday(todayStr);

  // Confetti particles list
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const confettiIdCounter = useRef(0);

  // Check and trigger completion animation when hitting 100% progress
  const prevIsTodayCompleted = useRef(isTodayCompleted);
  useEffect(() => {
    if (isTodayCompleted && !prevIsTodayCompleted.current) {
      triggerCelebration();
    }
    prevIsTodayCompleted.current = isTodayCompleted;
  }, [isTodayCompleted]);

  // Refresh greeting occasionally
  useEffect(() => {
    setGreeting(getGreeting());
  }, [todayStr]);

  // Triggers floating confetti emojis
  const triggerCelebration = () => {
    const emojis = ['🎉', '🥳', '🚀', '🌱', '🔥', '✨', '👏'];
    const { width, height } = Dimensions.get('window');
    
    const newConfetti: ConfettiParticle[] = Array.from({ length: 25 }).map(() => {
      const id = confettiIdCounter.current++;
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const x = Math.random() * (width - 40) + 20;
      
      const y = new Animated.Value(height);
      const opacity = new Animated.Value(1);
      const scale = new Animated.Value(Math.random() * 0.8 + 0.6);

      return { id, emoji, x, y, opacity, scale };
    });

    setConfetti((prev) => [...prev, ...newConfetti]);

    // Animate each particle upwards
    newConfetti.forEach((p) => {
      Animated.parallel([
        Animated.timing(p.y, {
          toValue: -100,
          duration: Math.random() * 2000 + 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: Math.random() * 1500 + 2500,
          useNativeDriver: true,
        }),
        Animated.timing(p.scale, {
          toValue: 1.5,
          duration: Math.random() * 2000 + 2000,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Clean up completed particles
        setConfetti((current) => current.filter((c) => c.id !== p.id));
      });
    });
  };

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

  return (
    <View style={tw`flex-1 bg-iosBgLight dark:bg-iosBgDark`}>
      <ScrollView contentContainerStyle={tw`px-5 pt-8 pb-24`}>
        {/* Greetings Section */}
        <View style={tw`mb-5`}>
          <Text style={tw`text-2xl font-black tracking-tight text-iosTextLight dark:text-iosTextDark`}>
            {greeting.text}, {settings.userName} {greeting.emoji}
          </Text>
        </View>

        {/* Quotes Section */}
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <Text style={tw`text-base italic leading-relaxed text-iosTextLight dark:text-iosTextDark`}>
            "{quote.text}"
          </Text>
          {quote.author && (
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mt-3 text-right font-semibold`}>
              — {quote.author}
            </Text>
          )}
        </Card>

        {/* Progress and Streak Row */}
        <View style={tw`flex-row justify-between mb-6`}>
          {/* Today's Progress Card */}
          <Card style={tw`flex-1 p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mr-3 items-center justify-center shadow-sm`}>
            <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-3 uppercase tracking-wider`}>
              Progress
            </Text>
            <ProgressRing percentage={percentage} size={110} strokeWidth={10} />
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mt-3 font-semibold`}>
              {completedCount} / {totalCount} Habits
            </Text>
          </Card>

          {/* Current Streak Card */}
          <Card style={tw`flex-1 p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark items-center justify-center shadow-sm`}>
            <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-2 uppercase tracking-wider`}>
              Streak
            </Text>
            <View style={tw`flex-row items-center mb-1`}>
              <Text style={tw`text-4xl`}>🔥</Text>
              <Text style={tw`text-3xl font-black text-iosTextLight dark:text-iosTextDark ml-1`}>
                {overallStreak}
              </Text>
            </View>
            <Text style={tw`text-xs font-bold text-iosTextLight dark:text-iosTextDark mt-1`}>
              Day Streak
            </Text>
            <Text style={tw`text-xxs text-center leading-tight text-iosSubtextLight dark:text-iosSubtextDark mt-2 px-1`}>
              {isTodayCompleted 
                ? "Today completed. Streak safe! 🎉"
                : "Mark all completed to grow your streak!"}
            </Text>
          </Card>
        </View>

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

        {/* Habits Checklist */}
        {sortedHabits.map((habit) => {
          const entry = history.find((e) => e.habitId === habit.id && e.date === todayStr);
          const isCompleted = entry ? entry.completed : false;
          const stats = getHabitStats(habit);

          return (
            <Card
              key={habit.id}
              style={[
                tw`mb-3 rounded-2xl bg-iosCardLight dark:bg-iosCardDark border shadow-sm`,
                isCompleted 
                  ? tw`border-emerald/30 bg-emerald/5 dark:bg-emerald/10` 
                  : tw`border-iosBorderLight dark:border-iosBorderDark`
              ]}
            >
              <View style={tw`flex-row justify-between items-center py-2 px-3`}>
                {/* Completion Checkbox */}
                <TouchableOpacity
                  onPress={() => toggleHabit(habit.id, todayStr)}
                  style={tw`h-11 w-11 items-center justify-center`}
                >
                  <MaterialCommunityIcons
                    name={isCompleted ? 'checkbox-marked-circle' : 'circle-outline'}
                    size={28}
                    color={isCompleted ? tw.color('emerald') : tw.color('iosSubtextLight')}
                  />
                </TouchableOpacity>

                {/* Habit details */}
                <View style={tw`flex-1 ml-1 pr-2`}>
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

                {/* Streak Badge & Options Menu */}
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
                    contentStyle={tw`bg-iosCardLight dark:bg-iosCardDark rounded-2xl border border-iosBorderLight dark:border-iosBorderDark`}
                  >
                    <Menu.Item onPress={() => handleEdit(habit)} leadingIcon="pencil" title="Edit" titleStyle={tw`text-iosTextLight dark:text-iosTextDark`} />
                    <Menu.Item onPress={() => handleDuplicate(habit)} leadingIcon="content-copy" title="Duplicate" titleStyle={tw`text-iosTextLight dark:text-iosTextDark`} />
                    <Menu.Item onPress={() => handleArchive(habit.id)} leadingIcon="archive" title="Archive" titleStyle={tw`text-iosTextLight dark:text-iosTextDark`} />
                    <Menu.Item onPress={() => handleDelete(habit.id)} leadingIcon="delete" title="Delete" titleStyle={tw`text-coral font-bold`} />
                  </Menu>
                </View>
              </View>
            </Card>
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
        style={tw`absolute bottom-22 right-5 rounded-full bg-indigo shadow-lg`}
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

      {/* Confetti Animation Overlays */}
      {confetti.map((particle) => (
        <Animated.Text
          key={particle.id}
          style={[
            tw`absolute text-2xl z-50 pointer-events-none`,
            {
              left: particle.x,
              transform: [
                { translateY: particle.y },
                { scale: particle.scale }
              ],
              opacity: particle.opacity,
            }
          ]}
        >
          {particle.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};
