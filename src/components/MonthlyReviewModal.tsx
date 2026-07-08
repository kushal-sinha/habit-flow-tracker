import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Share } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Habit, HistoryEntry, UserSettings } from '../types';
import { triggerHaptic } from '../services/hapticService';

interface MonthlyReviewModalProps {
  visible: boolean;
  settings: UserSettings;
  habits: Habit[];
  history: HistoryEntry[];
  onDismiss: () => void;
}

export const MonthlyReviewModal: React.FC<MonthlyReviewModalProps> = ({
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

  // Compute metrics for the past 30 days
  const getMonthlyStats = () => {
    const today = new Date();
    const past30Days = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const activeHabits = habits.filter((h) => !h.isArchived);
    let totalScheduled = 0;
    let completedCount = 0;

    past30Days.forEach((dateStr) => {
      activeHabits.forEach((h) => {
        totalScheduled++;
        const completed = history.some((e) => e.habitId === h.id && e.date === dateStr && e.completed);
        if (completed) completedCount++;
      });
    });

    const completionRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
    const xpEarned = completedCount * 10; // 10 XP per completion

    // Build simple calendar heatmap grid data (true/false completion rates)
    const heatmapGrid = past30Days.map((dateStr) => {
      const completedAny = history.some((e) => e.date === dateStr && e.completed);
      return { date: dateStr, completed: completedAny };
    }).reverse(); // chronological order

    return {
      completionRate,
      xpEarned,
      totalCompletions: completedCount,
      heatmapGrid,
    };
  };

  const stats = getMonthlyStats();

  const handleShare = async () => {
    try {
      triggerHaptic('medium');
      await Share.share({
        message: `Consistency check! 🌟 I completed ${stats.totalCompletions} habit tasks with a ${stats.completionRate}% completion rate this month on Habit Flow! Join me and let's level up together.`,
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
            <Text style={styles.headerTitle}>📅 Monthly Report</Text>
            <IconButton icon="close" iconColor="rgba(255,255,255,0.4)" size={20} onPress={onDismiss} style={styles.closeBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Calendar Heatmap Grid */}
            <Text style={styles.gridTitle}>Consistency Heatmap (Past 30 Days)</Text>
            <View style={styles.heatmap}>
              {stats.heatmapGrid.map((day, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.heatmapDot,
                    day.completed ? styles.dotCompleted : styles.dotEmpty,
                  ]}
                />
              ))}
            </View>

            {/* Performance Stats */}
            <View style={styles.banner}>
              <Text style={styles.bannerRate}>{stats.completionRate}%</Text>
              <Text style={styles.bannerLabel}>Month Completion Rate</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Completions:</Text>
                <Text style={styles.detailVal}>{stats.totalCompletions}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>XP Earned:</Text>
                <Text style={styles.detailVal}>+{stats.xpEarned} XP</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Companions Unlocked:</Text>
                <Text style={styles.detailVal}>{settings.unlockedCharacters?.length || 1}</Text>
              </View>
            </View>

            <View style={styles.encouragement}>
              <Text style={styles.encouragementText}>
                "You're solidifying your routines. Every mark on the grid is a day you showed up."
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Share Monthly Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
              <Text style={styles.secondaryBtnText}>Close</Text>
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
    marginBottom: 14,
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
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    marginBottom: 16,
  },
  heatmapDot: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  dotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  banner: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerRate: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
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
  detailsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  encouragement: {
    backgroundColor: 'rgba(122,92,255,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#7A5CFF',
    padding: 14,
    borderRadius: 12,
  },
  encouragementText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#E6E6FF',
    lineHeight: 18,
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
