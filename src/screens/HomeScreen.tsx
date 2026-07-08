import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, Animated, Dimensions, StyleSheet } from 'react-native';
import { Text, Card, IconButton, Portal, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabits } from '../hooks/useHabits';
import { useCelebration } from '../hooks/useCelebration';
import { tw } from '../utils/theme';
import { getTodayString } from '../utils/dateUtils';
import { isHabitScheduled } from '../utils/streakUtils';
import { Habit } from '../types';
import { HabitFormModal } from './HabitFormModal';
import { MascotIllustration } from '../components/MascotIllustration';
import { MascotCompanionCard } from '../components/MascotCompanionCard';
import { StreakWarningDialog } from '../components/StreakWarningDialog';
import { LevelTimeline } from '../components/LevelTimeline';
import { LevelBadge } from '../components/LevelTimeline';
import { CircularProgress } from '../components/CircularProgress';
import { MILESTONES, MilestoneConfig } from '../utils/progressionUtils';

// Helper to determine active milestone info based on streak count
const getActiveMilestone = (streak: number): MilestoneConfig => {
  let active = MILESTONES[0];
  for (let i = 0; i < MILESTONES.length; i++) {
    if (streak >= MILESTONES[i].minDays) {
      active = MILESTONES[i];
    }
  }
  return active;
};

// ----------------------------------------------------
// Custom CustomCheckbox Component
// ----------------------------------------------------
interface CustomCheckboxProps {
  isChecked: boolean;
  onPress: () => void;
  color?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ isChecked, onPress, color }) => {
  const scaleAnim = useRef(new Animated.Value(isChecked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isChecked ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 5,
    }).start();
  }, [isChecked]);

  const activeColor = color || '#7A5CFF';

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress} 
      style={tw`h-10 w-10 items-center justify-center`}
    >
      <View style={[
        tw`h-7 w-7 rounded-full border-2 items-center justify-center bg-transparent`,
        { borderColor: isChecked ? activeColor : (color ? `${color}40` : 'rgba(255, 255, 255, 0.2)') }
      ]}>
        <Animated.View style={[
          tw`absolute h-7 w-7 rounded-full items-center justify-center`,
          {
            backgroundColor: activeColor,
            transform: [{ scale: scaleAnim }],
            opacity: scaleAnim,
          }
        ]}>
          <MaterialCommunityIcons name="check" size={16} color="white" />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// ----------------------------------------------------
// Main HomeScreen Component
// ----------------------------------------------------
const HomeScreenComponent: React.FC = () => {
  const { 
    loading,
    habits, 
    history, 
    todayStr, 
    overallStreak, 
    toggleHabit, 
    deleteHabit, 
    archiveHabit,
    addHabit,
    editHabit,
    settings
  } = useHabits();

  const { triggerCelebration } = useCelebration();

  // Dialog & Form states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  
  // Optimistic completion tracking to ensure 60fps instant UI transitions
  const [optimisticCompletions, setOptimisticCompletions] = useState<{ [habitId: string]: boolean }>({});

  // Sync optimistic completions with database history context with a 600ms debounce delay
  // to absorb database write and refresh latency, preventing progress resets or stutters.
  useEffect(() => {
    const handler = setTimeout(() => {
      const completions: { [habitId: string]: boolean } = {};
      const filteredToday = habits.filter((h) => !h.isArchived && isHabitScheduled(h, todayStr));
      filteredToday.forEach((h) => {
        const entry = history.find((e) => e.habitId === h.id && e.date === todayStr);
        completions[h.id] = entry ? entry.completed : false;
      });
      setOptimisticCompletions(completions);
    }, 600);

    return () => clearTimeout(handler);
  }, [history, todayStr, habits]);

  // Streak warning state
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningShownToday, setWarningShownToday] = useState(false);

  // Animations driving variables
  const circleProgressAnim = useRef(new Animated.Value(0)).current;
  const horizontalProgressAnim = useRef(new Animated.Value(0)).current;
  const todayProgressAnim = useRef(new Animated.Value(0)).current;

  // Check today's habits
  const todayHabits = habits.filter(
    (h) => !h.isArchived && isHabitScheduled(h, todayStr)
  );

  const completedToday = todayHabits.filter((h) => !!optimisticCompletions[h.id]);

  const totalCount = todayHabits.length;
  const completedCount = completedToday.length;
  const todayPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isTodayCompleted = totalCount > 0 && completedCount === totalCount;

  // Determine if today was already completed before this action
  const todayAlreadyCompletedBefore = todayHabits.length > 0 && todayHabits.every((h) => {
    const entry = history.find((e) => e.habitId === h.id && e.date === todayStr);
    return entry ? entry.completed : false;
  });

  // Calculate optimistic streak to trigger badge animations instantly
  const optimisticStreak = (isTodayCompleted && !todayAlreadyCompletedBefore)
    ? overallStreak + 1
    : overallStreak;

  // Active level calculation using optimistic streak
  const milestone = getActiveMilestone(optimisticStreak);
  
  // Days calculations inside current level
  let currentLevelDays = Math.max(0, optimisticStreak - milestone.minDays);
  let targetLevelDays = milestone.maxDays - milestone.minDays;
  if (milestone.level === 30) {
    currentLevelDays = 120;
    targetLevelDays = 120;
  }
  
  const levelProgressFraction = targetLevelDays > 0 ? Math.min(1, currentLevelDays / targetLevelDays) : 1;
  const levelProgressPercentage = Math.round(levelProgressFraction * 100);

  console.log('[DEBUG-PROGRESS] overallStreak:', overallStreak, 'optimisticStreak:', optimisticStreak, 'levelPct:', levelProgressPercentage, 'todayPct:', todayPercentage, 'total:', totalCount, 'completed:', completedCount, 'historyLen:', history.length);

  // Check if streak warning should trigger today
  useEffect(() => {
    if (!loading && habits.length > 0 && overallStreak > 0 && !warningShownToday) {
      if (todayHabits.length > 0) {
        const isRoutineIncomplete = completedCount < totalCount;
        if (isRoutineIncomplete) {
          setWarningVisible(true);
          setWarningShownToday(true);
        }
      }
    }
  }, [loading, habits, history, overallStreak, todayStr, warningShownToday, completedCount, totalCount]);

  // Spring drive level progress ring & bars
  useEffect(() => {
    // 1. Level circle progress ring
    Animated.spring(circleProgressAnim, {
      toValue: levelProgressFraction,
      tension: 75,
      friction: 11,
      useNativeDriver: false,
    }).start();

    // 2. Level horizontal XP progress bar
    Animated.spring(horizontalProgressAnim, {
      toValue: levelProgressFraction,
      tension: 75,
      friction: 11,
      useNativeDriver: false,
    }).start();

    // 3. Today's Mission habits completion progress bar
    Animated.spring(todayProgressAnim, {
      toValue: todayPercentage,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [overallStreak, levelProgressFraction, todayPercentage]);

  // Sorting: incomplete first, completed last
  const sortedHabits = [...todayHabits].sort((a, b) => {
    const entryA = history.find((e) => e.habitId === a.id && e.date === todayStr);
    const entryB = history.find((e) => e.habitId === b.id && e.date === todayStr);
    const compA = entryA ? entryA.completed : false;
    const compB = entryB ? entryB.completed : false;
    
    if (compA === compB) return 0;
    return compA ? 1 : -1;
  });

  const handleOpenMenu = (id: string) => {
    setMenuVisible(prev => ({ ...prev, [id]: true }));
  };

  const handleCloseMenu = (id: string) => {
    setMenuVisible(prev => ({ ...prev, [id]: false }));
  };

  const handleEdit = (habit: Habit) => {
    handleCloseMenu(habit.id);
    setSelectedHabit(habit);
    setFormOpen(true);
  };

  const handleDuplicate = async (habit: Habit) => {
    handleCloseMenu(habit.id);
    await addHabit({
      title: `${habit.title} (Copy)`,
      emoji: habit.emoji,
      category: habit.category,
      color: habit.color,
      reminderTime: habit.reminderTime,
      repeatDays: habit.repeatDays,
      startDate: habit.startDate,
      note: habit.note,
    });
  };

  const handleArchive = async (id: string) => {
    handleCloseMenu(id);
    await archiveHabit(id, true);
  };

  const handleDelete = async (id: string) => {
    handleCloseMenu(id);
    await deleteHabit(id);
  };

  // SVGR Ring Geometry calculations
  const ringSize = 170;
  const ringStroke = 9;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = ringRadius * 2 * Math.PI;

  return (
    <View style={tw`flex-1 bg-iosBgLight dark:bg-[#090A10]`}>
        
        {/* ====================================================
            TOP HEADER BAR (Menu, Title, User Avatar)
            ==================================================== */}
        <View style={styles.headerBar}>
          <IconButton 
            icon="menu" 
            size={24} 
            iconColor="#FFFFFF" 
            style={tw`m-0`}
            onPress={() => {}}
          />
          <Text style={styles.headerTitle}>Mission</Text>
          <View style={styles.avatarWrapper}>
            <MascotIllustration pose="avatar" width={40} height={40} />
          </View>
        </View>

        <ScrollView contentContainerStyle={tw`px-5 pb-36 pt-2`}>
          
          {/* ====================================================
              CIRCULAR PROGRESS RING & LEVEL BADGE SECTION
              ==================================================== */}
          <View style={styles.progressRingSection}>
            <CircularProgress
              progress={levelProgressPercentage}
              size={ringSize}
              strokeWidth={ringStroke}
              gradientColors={['#D946EF', '#7A5CFF']}
              showPercentage={false}
              showHandle={true}
            >
              {/* Inner Circle Content Overlaid */}
              <View style={styles.ringInnerContent}>
                <Text style={styles.levelSmallLabel}>LEVEL {milestone.level}</Text>
                
                <View style={styles.ringBadgeWrapper}>
                  <LevelBadge 
                    level={milestone.level} 
                    badgeType={milestone.badgeType} 
                    isActive={true} 
                  />
                </View>

                <Text style={styles.rankSmallLabel}>{milestone.rank}</Text>
              </View>
            </CircularProgress>

            {/* Days Progress Text */}
            <Text style={styles.daysProgressText}>
              {currentLevelDays} / {targetLevelDays} DAYS
            </Text>

            {/* Inset XP horizontal progress fill */}
            <View style={styles.horizontalTrackBar}>
              <Animated.View 
                style={[
                  styles.horizontalProgressBarFill,
                  {
                    width: horizontalProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp'
                    })
                  }
                ]}
              />
            </View>
          </View>

          {/* ====================================================
              TODAY'S MISSION PROGRESS BAR
              ==================================================== */}
          <View style={tw`w-full mb-6`}>
            <View style={tw`flex-row justify-between items-end mb-2`}>
              <Text style={styles.sectionTitle}>Today's Mission</Text>
              <Text style={styles.percentageLabel}>{Math.round(todayPercentage)}%</Text>
            </View>
            
            <View style={styles.todayTrackBar}>
              <Animated.View 
                style={[
                  styles.todayProgressBarFill,
                  {
                    width: todayProgressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp'
                    })
                  }
                ]}
              />
            </View>
          </View>

          {/* ====================================================
              HABIT CHECKLIST LIST CARDS
              ==================================================== */}
          {sortedHabits.length > 0 ? (
            sortedHabits.map((habit) => {
              const entry = history.find((e) => e.habitId === habit.id && e.date === todayStr);
              const isCompleted = !!optimisticCompletions[habit.id];
              const themeColor = tw.color(habit.color) || '#7A5CFF';

              return (
                <View
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    isCompleted && styles.habitCardCompleted,
                    { borderLeftWidth: 4, borderLeftColor: themeColor }
                  ]}
                >
                  <View style={tw`flex-1 flex-row items-center`}>
                    
                    {/* Left: Custom Tactile Scaling Checkbox */}
                    <CustomCheckbox 
                      isChecked={isCompleted}
                      color={themeColor}
                      onPress={async () => {
                        const nextState = !isCompleted;
                        
                        // 1. Synchronously update optimistic UI state
                        setOptimisticCompletions(prev => ({ ...prev, [habit.id]: nextState }));
                        
                        // 2. Fire database update in background (non-blocking)
                        toggleHabit(habit.id, todayStr);
                        
                        if (nextState) {
                          const totalScheduled = todayHabits.length;
                          const nextCompletedCount = todayHabits.filter(h => {
                            if (h.id === habit.id) return true;
                            return !!optimisticCompletions[h.id];
                          }).length;
                          
                          if (nextCompletedCount === totalScheduled) {
                            const todayAlreadyCompleted = todayHabits.every(h => {
                              if (h.id === habit.id) return false;
                              return !!optimisticCompletions[h.id];
                            });
                            
                            let nextStreak = overallStreak;
                            if (!todayAlreadyCompleted) {
                              nextStreak = overallStreak + 1;
                            }
                            
                            triggerCelebration(
                              habit.title,
                              nextStreak === 0 ? 1 : nextStreak,
                              totalScheduled,
                              nextCompletedCount
                            );
                          }
                        }
                      }}
                    />

                    {/* Middle: Habit title / subtitle note */}
                    <View style={tw`flex-1 ml-2 pr-2`}>
                      <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-lg mr-2`}>{habit.emoji}</Text>
                        <Text
                          style={[
                            styles.habitTitle,
                            isCompleted && styles.habitTitleCompleted
                          ]}
                          numberOfLines={1}
                        >
                          {habit.title}
                        </Text>
                      </View>
                      
                      {habit.note ? (
                        <Text 
                          style={styles.habitNote}
                          numberOfLines={1}
                        >
                          {habit.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Right Side: Options dots menu */}
                  <View style={tw`flex-row items-center`}>
                    <Menu
                      visible={!!menuVisible[habit.id]}
                      onDismiss={() => handleCloseMenu(habit.id)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={20}
                          iconColor="#6F7283"
                          onPress={() => handleOpenMenu(habit.id)}
                          style={tw`m-0`}
                        />
                      }
                      contentStyle={tw`bg-[#161722] rounded-2xl border border-white/5`}
                    >
                      <Menu.Item onPress={() => handleEdit(habit)} leadingIcon="pencil" title="Edit" titleStyle={tw`text-white`} />
                      <Menu.Item onPress={() => handleDuplicate(habit)} leadingIcon="content-copy" title="Duplicate" titleStyle={tw`text-white`} />
                      <Menu.Item onPress={() => handleArchive(habit.id)} leadingIcon="archive" title="Archive" titleStyle={tw`text-white`} />
                      <Menu.Item onPress={() => handleDelete(habit.id)} leadingIcon="delete" title="Delete" titleStyle={tw`text-coral font-bold`} />
                    </Menu>
                  </View>
                </View>
              );
            })
          ) : (
            <Card style={tw`p-6 rounded-[24px] bg-[#141522] border border-white/5 items-center`}>
              <Text style={tw`text-lg font-bold text-white mb-1`}>No Habits Scheduled</Text>
              <Text style={tw`text-xs text-white/50 text-center`}>
                Tap the floating action button below to create your first habit routine for today!
              </Text>
            </Card>
          )}

          {/* ====================================================
              COMPLETED STATE CELEBRATION BOX
              ==================================================== */}
          {isTodayCompleted && (
            <Animated.View style={styles.completedGoalCard}>
              <View style={tw`flex-row items-center gap-4 mb-4`}>
                <View style={tw`w-12 h-12 rounded-2xl bg-[#7A5CFF]/10 items-center justify-center`}>
                  <Text style={tw`text-2xl`}>🎉</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-lg font-black text-white`}>
                    Today's Goal Completed!
                  </Text>
                  <Text style={tw`text-xs text-white/60 mt-0.5`}>
                    Your streak is safe. Come back tomorrow.
                  </Text>
                </View>
              </View>

              {/* mascot avatar companion animation display */}
              <MascotCompanionCard userName={settings.userName} />
            </Animated.View>
          )}

          {/* Complete Level Progression Timeline component at the bottom of dashboard */}
          <View style={tw`mt-8`}>
            <Text style={[styles.sectionTitle, tw`mb-3`]}>Streak Progress Tracker</Text>
            <LevelTimeline currentStreak={overallStreak} />
          </View>
        </ScrollView>

        {/* Floating Action Button (FAB) to Add Routine Habits */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setSelectedHabit(null);
            setFormOpen(true);
          }}
          style={styles.floatingFab}
        >
          <MaterialCommunityIcons name="plus" size={26} color="white" />
        </TouchableOpacity>

        {/* Form Modal drawer */}
        <Portal>
          {formOpen && (
            <HabitFormModal
              visible={formOpen}
              habit={selectedHabit}
              onClose={() => setFormOpen(false)}
            />
          )}
        </Portal>

        {/* Streak Warning Overlay Modal */}
        <StreakWarningDialog
          visible={warningVisible}
          streakCount={overallStreak}
          onDismiss={() => setWarningVisible(false)}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  // Header bar components
  headerBar: {
    height: Platform.OS === 'ios' ? 100 : 70,
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 44 : 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090A10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 26,
    fontWeight: '900',
    color: '#E6E6FF',
    letterSpacing: -0.5,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Level progress circle styles
  progressRingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  svgRingContainer: {
    width: 170,
    height: 170,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInnerContent: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelSmallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  ringBadgeWrapper: {
    width: 90,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    // Soft metallic back glow
    shadowColor: '#7A5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  rankSmallLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  daysProgressText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: -0.4,
  },

  // Horizontal XP progress bar
  horizontalTrackBar: {
    height: 5,
    width: '55%',
    backgroundColor: '#171822',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginTop: 10,
  },
  horizontalProgressBarFill: {
    height: '100%',
    backgroundColor: '#7A5CFF',
    borderRadius: 2.5,
  },

  // Today's Mission styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  percentageLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A5CFF',
  },
  todayTrackBar: {
    height: 8,
    width: '100%',
    backgroundColor: '#141522',
    borderRadius: 4,
    overflow: 'hidden',
  },
  todayProgressBarFill: {
    height: '100%',
    backgroundColor: '#7A5CFF',
    borderRadius: 4,
  },

  // Habit card styles
  habitCard: {
    height: 78,
    width: '100%',
    backgroundColor: '#12131F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      }
    })
  },
  habitCardCompleted: {
    borderColor: 'rgba(108,77,255,0.15)',
    backgroundColor: 'rgba(18,19,31,0.7)',
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.3)',
  },
  habitNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 3,
  },

  // Goal Completed Card Styles
  completedGoalCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#141522',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.2)',
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      }
    })
  },

  // Floating FAB styles
  floatingFab: {
    position: 'absolute',
    bottom: 108,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7A5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      }
    })
  },
});

export const HomeScreen = React.memo(HomeScreenComponent);
