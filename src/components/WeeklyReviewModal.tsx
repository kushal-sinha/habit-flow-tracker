import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Share } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Habit, HistoryEntry, UserSettings } from '../types';
import { triggerHaptic } from '../services/hapticService';

interface WeeklyReviewModalProps {
  visible: boolean;
  settings: UserSettings;
  habits: Habit[];
  history: HistoryEntry[];
  onDismiss: () => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  visible,
  settings,
  habits,
  history,
  onDismiss,
}) => {
  useEffect(() => {
    if (visible) {
      triggerHaptic('success');
    }
  }, [visible]);

  // Compute metrics for the past 7 days
  const getWeeklyStats = () => {
    const today = new Date();
    const past7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const activeHabits = habits.filter((h) => !h.isArchived);
    let totalScheduled = 0;
    let completedCount = 0;

    past7Days.forEach((dateStr) => {
      activeHabits.forEach((h) => {
        // Simple scheduled check (assume daily for simplicity in summary)
        totalScheduled++;
        const completed = history.some((e) => e.habitId === h.id && e.date === dateStr && e.completed);
        if (completed) completedCount++;
      });
    });

    const completionRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
    const consistencyScore = Math.round((completionRate / 10) * 10) / 10;
    const xpEarned = completedCount * 10; // 10 XP per completion

    // Most Improved & Missed habit logic
    const habitCompletions: { [id: string]: number } = {};
    activeHabits.forEach((h) => {
      habitCompletions[h.id] = history.filter((e) => e.habitId === h.id && e.completed).length;
    });

    let bestHabit = 'None';
    let worstHabit = 'None';
    let max = -1;
    let min = Infinity;

    activeHabits.forEach((h) => {
      const c = habitCompletions[h.id] || 0;
      if (c > max) {
        max = c;
        bestHabit = h.title;
      }
      if (c < min) {
        min = c;
        worstHabit = h.title;
      }
    });

    return {
      completionRate,
      consistencyScore,
      xpEarned,
      bestHabit,
      worstHabit: worstHabit === 'None' ? 'None' : worstHabit,
    };
  };

  const stats = getWeeklyStats();

  const handleShare = async () => {
    try {
      triggerHaptic('medium');
      await Share.share({
        message: `Consistency Check! 🚀 I completed ${stats.completionRate}% of my habits this week on Habit Flow, earning ${stats.xpEarned} XP! Join me and grow together.`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚡ Weekly Review</Text>
            <IconButton icon="close" iconColor="rgba(255,255,255,0.4)" size={20} onPress={onDismiss} style={styles.closeBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* XP and Consistency Banner */}
            <View style={styles.consistencyBanner}>
              <Text style={styles.bannerRate}>{stats.completionRate}%</Text>
              <Text style={styles.bannerLabel}>Week Completion Rate</Text>
              <Text style={styles.bannerXP}>+{stats.xpEarned} XP Earned</Text>
            </View>

            {/* Grid Metrics */}
            <View style={styles.grid}>
              <View style={styles.gridCell}>
                <Text style={styles.cellVal}>{stats.consistencyScore}/10</Text>
                <Text style={styles.cellLabel}>Consistency Score</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.cellVal}>Level {settings.level}</Text>
                <Text style={styles.cellLabel}>Current Rank</Text>
              </View>
            </View>

            {/* Habit insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 Habit Highlights</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Most Consistent:</Text>
                <Text style={styles.rowVal}>{stats.bestHabit}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Needs Attention:</Text>
                <Text style={styles.rowVal}>{stats.worstHabit}</Text>
              </View>
            </View>

            {/* Personal Insight Quote */}
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>
                "You completed a higher ratio of habits this week. Progress is a series of tiny wins."
              </Text>
              <Text style={styles.quoteAuthor}>— Your Companion</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Export & Share Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
              <Text style={styles.secondaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    maxHeight: '90%',
    backgroundColor: '#121320',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.25)',
    borderRadius: 28,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  closeBtn: {
    margin: 0,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  consistencyBanner: {
    backgroundColor: 'rgba(122,92,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.25)',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerRate: {
    fontSize: 36,
    fontWeight: '900',
    color: '#7A5CFF',
    letterSpacing: -1,
  },
  bannerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerXP: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A7F3D0',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCell: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  cellVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cellLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E6E6FF',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  rowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quoteCard: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    padding: 14,
    borderRadius: 12,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#A7F3D0',
    lineHeight: 18,
  },
  quoteAuthor: {
    fontSize: 10,
    color: 'rgba(165,243,208,0.6)',
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },
  actions: {
    marginTop: 8,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#7A5CFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 48,
    backgroundColor: 'transparent',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
});
