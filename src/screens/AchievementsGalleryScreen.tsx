import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ACHIEVEMENTS, AchievementConfig } from '../utils/AchievementEngine';
import { UserSettings, Habit, HistoryEntry } from '../types';
import { triggerHaptic } from '../services/hapticService';

interface AchievementsGalleryScreenProps {
  settings: UserSettings;
}

const CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'reading', label: 'Reading' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'meditation', label: 'Zen' },
  { key: 'morning', label: 'Morning' },
  { key: 'night', label: 'Night' },
  { key: 'level', label: 'Rank' },
  { key: 'special', label: 'Special' },
];

export const AchievementsGalleryScreen: React.FC<AchievementsGalleryScreenProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const unlockedList = settings.unlockedAchievements || [];

  const handleTabPress = (tab: string) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  const filteredAchievements = ACHIEVEMENTS.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Celestial': return '#EC4899';
      case 'Legendary': return '#818CF8';
      case 'Epic': return '#FBBF24';
      case 'Rare': return '#34D399';
      default: return '#9CA3AF';
    }
  };

  const renderItem = ({ item }: { item: AchievementConfig }) => {
    const isUnlocked = unlockedList.includes(item.id);
    const color = getRarityColor(item.rarity);

    return (
      <View style={[styles.card, isUnlocked ? styles.cardUnlocked : styles.cardLocked]}>
        <View style={styles.cardHeader}>
          {/* Lock / Icon Wrapper */}
          <View style={[styles.iconContainer, { backgroundColor: isUnlocked ? `${color}15` : 'rgba(255,255,255,0.02)' }]}>
            {isUnlocked ? (
              <MaterialCommunityIcons name={item.iconName as any} size={24} color={color} />
            ) : (
              // Locked items display lock silhouette icon requested by user
              <MaterialCommunityIcons name="lock" size={24} color="rgba(255,255,255,0.2)" />
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={[styles.itemTitle, !isUnlocked && styles.textLocked]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: `${color}15` }]}>
                <Text style={[styles.rarityText, { color }]}>{item.rarity}</Text>
              </View>
            </View>
            <Text style={[styles.itemDesc, !isUnlocked && styles.textDescLocked]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>

        {/* Cosmetic Reward Tag */}
        <View style={styles.rewardContainer}>
          <MaterialCommunityIcons
            name={item.rewardType === 'theme' ? 'palette' : item.rewardType === 'sound' ? 'volume-high' : 'gift'}
            size={14}
            color="rgba(255,255,255,0.4)"
          />
          <Text style={styles.rewardText} numberOfLines={1}>
            Reward: {item.rewardText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievement Gallery</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>UNLOCKED</Text>
          <Text style={styles.scoreValue}>
            {unlockedList.length} / {ACHIEVEMENTS.length}
          </Text>
        </View>
      </View>

      {/* Tabs Filter Selector */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                onPress={() => handleTabPress(item.key)}
                activeOpacity={0.8}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A10',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7A5CFF',
    marginTop: 2,
  },
  tabsWrapper: {
    height: 48,
    marginBottom: 12,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#7A5CFF',
    borderColor: '#7A5CFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#121320',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardUnlocked: {
    borderColor: 'rgba(122,92,255,0.15)',
  },
  cardLocked: {
    borderColor: 'rgba(255,255,255,0.03)',
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  textLocked: {
    color: 'rgba(255,255,255,0.4)',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  textDescLocked: {
    color: 'rgba(255,255,255,0.25)',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
});
