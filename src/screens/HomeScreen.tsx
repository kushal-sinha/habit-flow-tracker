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
import { LevelTimeline } from '../components/LevelTimeline';
import { LevelBadge } from '../components/LevelTimeline';
import { CircularProgress } from '../components/CircularProgress';
import { MILESTONES, MilestoneConfig } from '../utils/progressionUtils';
import { StatusCard } from '../components/StatusCard';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { StreakShieldModal } from '../components/StreakShieldModal';
import { StreakLostModal } from '../components/StreakLostModal';
import { getRegionForLevel } from '../utils/JourneyMap';
import { getXPRequiredForLevel, getCumulativeXPForLevel } from '../utils/XPEngine';
import { ACHIEVEMENTS } from '../utils/AchievementEngine';
import { generateInsights } from '../utils/InsightsEngine';
import { WelcomeLottieModal } from '../components/WelcomeLottieModal';
import { triggerHaptic } from '../services/hapticService';
import { getLogicalResetDate } from '../utils/TimeWindowCalculator';
import { playAmbientSound, stopAmbientSound } from '../services/soundService';

const QUOTES = [
  { text: "Consistency is not about perfection; it is about showing up for yourself.", author: "Growth Coach" },
  { text: "Small daily habits lead to astronomical long-term outcomes.", author: "Atomic Habits" },
  { text: "Every action you take is a vote for the person you wish to become.", author: "James Clear" }
];

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
interface HomeScreenProps {
  onNavigateToStats?: () => void;
  onNavigateToAchievements?: () => void;
}

const HomeScreenComponent: React.FC<HomeScreenProps> = ({ onNavigateToStats, onNavigateToAchievements }) => {
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
    settings,
    updateSettings
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

  // V3 Streak Protection & Onboarding States
  const [undoSnackbarVisible, setUndoSnackbarVisible] = useState(false);
  const [shieldModalVisible, setShieldModalVisible] = useState(false);
  const [lostModalVisible, setLostModalVisible] = useState(false);
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  // Stop background music on unmount to prevent leaks
  useEffect(() => {
    return () => {
      stopAmbientSound().catch(() => {});
    };
  }, []);

  // V3.2 Achievement Unlocks Floating Toast States
  const [unlockedToastVisible, setUnlockedToastVisible] = useState(false);
  const [unlockedToastTitle, setUnlockedToastTitle] = useState('');
  
  const prevAchievementsRef = useRef<string[]>(settings.unlockedAchievements || []);
  
  useEffect(() => {
    const prev = prevAchievementsRef.current;
    const current = settings.unlockedAchievements || [];
    if (current.length > prev.length) {
      const newUnlocks = current.filter(id => !prev.includes(id));
      if (newUnlocks.length > 0) {
        const firstNew = ACHIEVEMENTS.find(a => a.id === newUnlocks[0]);
        if (firstNew) {
          setUnlockedToastTitle(firstNew.title);
          setUnlockedToastVisible(true);
          const timer = setTimeout(() => {
            setUnlockedToastVisible(false);
          }, 3500);
          return () => clearTimeout(timer);
        }
      }
    }
    prevAchievementsRef.current = current;
  }, [settings.unlockedAchievements]);

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

  // Check for daily reset popups (Streak Shield Protected or Streak Lost) on load
  useEffect(() => {
    if (!loading && settings) {
      if (settings.xp === 0) {
        setWelcomeModalVisible(true);
      } else if (settings.streakShieldProtectedStreak > 0) {
        setShieldModalVisible(true);
      } else if (settings.showStreakLostScreen) {
        setLostModalVisible(true);
      }
    }
  }, [loading, settings?.streakShieldProtectedStreak, settings?.showStreakLostScreen, settings?.xp]);

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

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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
          
          {/* V2.1 Status Card */}
          <StatusCard habits={habits} history={history} settings={settings} />

          {/* 1. Greeting Block */}
          <View style={tw`mb-5 mt-4`}>
            <Text style={tw`text-2xl font-black text-white`}>
              {getTimeGreeting()}, {settings.userName}!
            </Text>
            <Text style={tw`text-sm text-white/50 mt-0.5`}>Let's secure your growth today.</Text>
          </View>

          {/* 2. Level Card */}
          {(() => {
            const activeRegion = getRegionForLevel(settings.level);
            const currentLevelBaseXP = getCumulativeXPForLevel(settings.level);
            const nextLevelThreshold = getCumulativeXPForLevel(settings.level + 1);
            const levelRequiredXP = nextLevelThreshold - currentLevelBaseXP;
            const currentLevelXPProgress = settings.xp - currentLevelBaseXP;
            const xpPercentage = Math.min(100, Math.max(0, Math.round((currentLevelXPProgress / levelRequiredXP) * 100)));
            
            return (
              <Card style={[styles.v3LevelCard, { borderColor: activeRegion.badgeDesign.borderColor }]}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={[styles.v3Badge, { backgroundColor: activeRegion.badgeDesign.glowColor }]}>
                      <MaterialCommunityIcons name={activeRegion.badgeDesign.iconName as any} size={20} color={activeRegion.badgeDesign.borderColor} />
                    </View>
                    <View>
                      <Text style={tw`text-xs font-black text-white/40 tracking-wider`}>
                        CURRENT REGION
                      </Text>
                      <Text style={tw`text-sm font-black text-white`}>
                        {activeRegion.name}
                      </Text>
                    </View>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={tw`text-base font-black text-white`}>Level {settings.level}</Text>
                    <Text style={tw`text-[10px] text-white/50 uppercase tracking-wider`}>XP Rank</Text>
                  </View>
                </View>
                
                <View style={styles.v3XpTrack}>
                  <View style={[styles.v3XpFill, { width: `${xpPercentage}%`, backgroundColor: activeRegion.badgeDesign.borderColor }]} />
                </View>
                <View style={tw`flex-row justify-between mt-2`}>
                  <Text style={tw`text-[11px] text-white/50`}>{currentLevelXPProgress} / {levelRequiredXP} XP</Text>
                  <Text style={tw`text-[11px] text-white/50 font-bold`}>{xpPercentage}% completed</Text>
                </View>
              </Card>
            );
          })()}
          
          {/* 3. Today's Mission & 4. Progress */}
          <View style={tw`w-full mb-6`}>
            <View style={tw`flex-row justify-between items-end mb-2`}>
              <Text style={styles.v3SectionTitle}>Today's Mission</Text>
              <Text style={styles.percentageLabel}>{Math.round(todayPercentage)}% Completed</Text>
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

          {/* Checklist entries */}
          {sortedHabits.length > 0 ? (
            sortedHabits.map((habit) => {
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
                    <CustomCheckbox 
                      isChecked={isCompleted}
                      color={themeColor}
                      onPress={async () => {
                        const nextState = !isCompleted;
                        setOptimisticCompletions(prev => ({ ...prev, [habit.id]: nextState }));
                        toggleHabit(habit.id, todayStr);
                        
                        if (!nextState) {
                          setUndoSnackbarVisible(true);
                        } else {
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
                      <Menu.Item onPress={() => handleArchive(habit.id)} leadingIcon="archive" title="Archive" titleStyle={tw`text-white`} />
                      <Menu.Item onPress={() => handleDelete(habit.id)} leadingIcon="delete" title="Delete" titleStyle={tw`text-coral font-bold`} />
                    </Menu>
                  </View>
                </View>
              );
            })
          ) : (
            <Card style={tw`p-6 rounded-[24px] bg-[#141522] border border-white/5 items-center mb-6`}>
              <Text style={tw`text-lg font-bold text-white mb-1`}>No Habits Scheduled</Text>
              <Text style={tw`text-xs text-white/50 text-center`}>
                Tap the floating action button below to create your first habit routine for today!
              </Text>
            </Card>
          )}

          {/* Daily XP Breakdown Card */}
          {(() => {
            const logicalToday = getLogicalResetDate(new Date(), settings.dailyResetTime);
            const activeHabits = habits.filter(h => !h.isArchived);
            const todayScheduled = activeHabits.filter(h => isHabitScheduled(h, logicalToday));
            const todayCompletions = history.filter(e => e.date === logicalToday && e.completed && e.userId === settings.userId);
            const isAllDone = todayScheduled.length > 0 && todayScheduled.every(h => todayCompletions.some(c => c.habitId === h.id));
            
            if (!isAllDone) return null;
            
            let totalXP = 0;
            const items: Array<{ title: string; xp: number }> = [];
            
            todayScheduled.forEach(h => {
              const isDone = todayCompletions.some(c => c.habitId === h.id);
              if (isDone) {
                const isHard = h.difficulty === 'hard';
                const xp = isHard ? 20 : 10;
                totalXP += xp;
                items.push({ title: `${h.title} (${isHard ? 'Hard' : 'Easy'})`, xp });
              }
            });
            
            // Perfect Day
            totalXP += 30; // Perfect day is +30 XP in V3.2
            items.push({ title: 'Perfect Day Bonus', xp: 30 });
            
            return (
              <Card style={styles.xpBreakdownCard}>
                <Text style={tw`text-[10px] font-black text-[#7A5CFF] tracking-wider uppercase mb-3`}>
                  TODAY'S MISSION LOG
                </Text>
                {items.map((item, idx) => (
                  <View key={idx} style={tw`flex-row justify-between py-1.5`}>
                    <Text style={tw`text-xs text-white/70 font-semibold`}>+ {item.title}</Text>
                    <Text style={tw`text-xs text-[#A7F3D0] font-black`}>+{item.xp} XP</Text>
                  </View>
                ))}
                <View style={tw`border-t border-white/5 mt-3 pt-3 flex-row justify-between`}>
                  <Text style={tw`text-sm font-black text-white`}>Total Earned Today</Text>
                  <Text style={tw`text-sm font-black text-[#7A5CFF]`}>+{totalXP} XP</Text>
                </View>
              </Card>
            );
          })()}

          {/* 4. Character Companion Block */}
          {(() => {
            const activeRegion = getRegionForLevel(settings.level);
            return (
              <Card style={styles.v3CompanionCard}>
                <View style={tw`flex-row items-center gap-4`}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerHaptic('success');
                      setWelcomeModalVisible(true);
                    }}
                  >
                    <MascotIllustration pose={activeRegion.mascotPose} width={90} height={90} />
                  </TouchableOpacity>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-[10px] font-black text-[#7A5CFF] tracking-wider uppercase`}>
                      ACTIVE COMPANION
                    </Text>
                    <Text style={tw`text-base font-black text-white mt-0.5`}>{activeRegion.mascotName}</Text>
                    <Text style={tw`text-xs text-white/55 mt-1`}>
                      "I'm keeping watch over {activeRegion.name.split(' ').slice(1).join(' ')}. Let's complete our checklist today!"
                    </Text>
                    <TouchableOpacity
                      style={[styles.ambientBtn, ambientPlaying && styles.ambientBtnActive]}
                      activeOpacity={0.8}
                      onPress={async () => {
                        triggerHaptic('light');
                        const isPlayingNow = await playAmbientSound(
                          activeRegion.backgroundTheme.ambientSoundKey,
                          settings.soundEnabled ?? true
                        );
                        setAmbientPlaying(isPlayingNow);
                      }}
                    >
                      <Text style={styles.ambientBtnText}>
                        {ambientPlaying ? '⏸ Stop Ambient Hum' : '🎵 Play Ambient Hum'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })()}

          {/* 5. Daily Insight Block */}
          {(() => {
            const insights = generateInsights(habits, history);
            const mainInsight = insights[0];
            const secondaryInsight = insights[1];
            
            return (
              <Card style={styles.v3InsightCard}>
                <Text style={tw`text-[10px] font-black text-[#10B981] tracking-wider uppercase mb-1`}>
                  DAILY COMPANION INSIGHT
                </Text>
                <Text style={tw`text-sm font-black text-white mb-1`}>{mainInsight.title}</Text>
                <Text style={tw`text-xs text-white/60 leading-4.5`}>{mainInsight.message}</Text>
                
                {secondaryInsight && (
                  <View style={styles.v3RecommendationBox}>
                    <Text style={tw`text-[10px] font-black text-[#FBBF24] tracking-wider uppercase mb-1`}>
                      {secondaryInsight.title}
                    </Text>
                    <Text style={tw`text-xs text-white/55 leading-4.5`}>{secondaryInsight.message}</Text>
                  </View>
                )}
              </Card>
            );
          })()}

          {/* 6. Quick Statistics */}
          <View style={styles.v3StatsGrid}>
            <View style={styles.v3StatCell}>
              <Text style={styles.v3StatVal}>{overallStreak}d</Text>
              <Text style={styles.v3StatLabel}>Current Streak</Text>
            </View>
            <View style={styles.v3StatCell}>
              <Text style={styles.v3StatVal}>{completedCount}/{totalCount}</Text>
              <Text style={styles.v3StatLabel}>Mission Progress</Text>
            </View>
            <View style={styles.v3StatCell}>
              <Text style={styles.v3StatVal}>{settings.streakShields}</Text>
              <Text style={styles.v3StatLabel}>Shields Active</Text>
            </View>
          </View>

          {/* 7. Upcoming Achievement */}
          {(() => {
            const unlockedAchs = settings.unlockedAchievements || [];
            const nextAchievement = ACHIEVEMENTS.find(a => !unlockedAchs.includes(a.id)) || ACHIEVEMENTS[0];
            
            return (
              <Card style={styles.v3AchievementCard}>
                <View style={tw`flex-row items-center gap-4`}>
                  <View style={styles.v3AchievementGlow}>
                    <MaterialCommunityIcons name={nextAchievement.iconName as any} size={22} color="#7A5CFF" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-[10px] font-black text-white/50 tracking-wider uppercase`}>
                      UPCOMING ACHIEVEMENT
                    </Text>
                    <Text style={tw`text-sm font-black text-white mt-0.5`}>{nextAchievement.title}</Text>
                    <Text style={tw`text-xs text-white/60 mt-1`}>{nextAchievement.description}</Text>
                  </View>
                </View>
              </Card>
            );
          })()}

          {/* 8. Quote */}
          {(() => {
            const quoteIndex = new Date().getDate() % QUOTES.length;
            const quote = QUOTES[quoteIndex];
            return (
              <View style={styles.v3QuoteContainer}>
                <Text style={styles.v3QuoteText}>"{quote.text}"</Text>
                <Text style={styles.v3QuoteAuthor}>— {quote.author || 'Daily Coach'}</Text>
              </View>
            );
          })()}

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

        {/* V2.1 Streak Protection & Undo Overlays */}
        <StreakShieldModal
          visible={shieldModalVisible}
          streakCount={settings.streakShieldProtectedStreak}
          onDismiss={async () => {
            setShieldModalVisible(false);
            await updateSettings({ streakShieldProtectedStreak: 0 });
          }}
        />

        <StreakLostModal
          visible={lostModalVisible}
          onDismiss={async () => {
            setLostModalVisible(false);
            await updateSettings({ showStreakLostScreen: false });
          }}
          onViewStats={async () => {
            setLostModalVisible(false);
            await updateSettings({ showStreakLostScreen: false });
            if (onNavigateToStats) {
              onNavigateToStats();
            }
          }}
        />

        <UndoSnackbar
          visible={undoSnackbarVisible}
          resetTime={settings.dailyResetTime}
          onDismiss={() => setUndoSnackbarVisible(false)}
        />

        <WelcomeLottieModal
          visible={welcomeModalVisible}
          onDismiss={async () => {
            setWelcomeModalVisible(false);
            // Onboarding 10 XP bonus!
            await updateSettings({ xp: 10 });
          }}
        />

        {/* Floating Toast on Achievement Unlock */}
        {unlockedToastVisible && (
          <TouchableOpacity
            style={styles.toastFloating}
            activeOpacity={0.9}
            onPress={() => {
              setUnlockedToastVisible(false);
              if (onNavigateToAchievements) {
                onNavigateToAchievements();
              }
            }}
          >
            <View style={tw`flex-row items-center gap-3`}>
              <Text style={tw`text-xl`}>🏆</Text>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-black text-white/50 uppercase tracking-wider`}>
                  Achievement Unlocked
                </Text>
                <Text style={tw`text-sm font-black text-white`}>{unlockedToastTitle}</Text>
              </View>
              <Text style={tw`text-xs font-black text-[#7A5CFF]`}>Tap to close</Text>
            </View>
          </TouchableOpacity>
        )}
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
  },
  
  // V3 Dashboard Styles
  v3LevelCard: {
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  v3Badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  v3XpTrack: {
    height: 6,
    width: '100%',
    backgroundColor: '#141522',
    borderRadius: 3,
    overflow: 'hidden',
  },
  v3XpFill: {
    height: '100%',
    borderRadius: 3,
  },
  v3SectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  v3CompanionCard: {
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  ambientBtn: {
    backgroundColor: 'rgba(122,92,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  ambientBtnActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  ambientBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E6E6FF',
  },
  v3InsightCard: {
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.15)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  v3RecommendationBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  v3StatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  v3StatCell: {
    flex: 1,
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
  },
  v3StatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  v3StatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  v3AchievementCard: {
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  v3AchievementGlow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(122,92,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.2)',
  },
  v3QuoteContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  v3QuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  v3QuoteAuthor: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 6,
    fontWeight: '700',
  },
  xpBreakdownCard: {
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.15)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  toastFloating: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 80,
    left: 20,
    right: 20,
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderColor: '#7A5CFF',
    borderRadius: 16,
    padding: 14,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
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
