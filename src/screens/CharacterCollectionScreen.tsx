import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MascotIllustration } from '../components/MascotIllustration';
import { UserSettings } from '../types';
import { triggerHaptic } from '../services/hapticService';
import { tw } from '../utils/theme';

interface Character {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Celestial';
  unlockLevel: number;
  story: string;
  pose: 'idle' | 'cheer' | 'trophy' | 'avatar';
  borderColor: string;
  glowColor: string;
}

const CHARACTERS: Character[] = [
  {
    id: 'seedling_village',
    name: 'Base Birdie',
    rarity: 'Common',
    unlockLevel: 1,
    story: 'Your first companion in Habit Flow, ready to fly through Seedling Village and anchor your initial steps.',
    pose: 'idle',
    borderColor: '#A7F3D0',
    glowColor: 'rgba(16,185,129,0.15)',
  },
  {
    id: 'forest_explorer',
    name: 'Woodland Chirper',
    rarity: 'Rare',
    unlockLevel: 5,
    story: 'A rare sprout that nests in the deep ancient woods, helping you find paths to consistency.',
    pose: 'idle',
    borderColor: '#34D399',
    glowColor: 'rgba(52,211,153,0.2)',
  },
  {
    id: 'mountain_climber',
    name: 'Yeti Flyer',
    rarity: 'Epic',
    unlockLevel: 10,
    story: 'An epic helper built for thin air and steep climbs. Thrives in subzero conditions, protecting your streak from freezing.',
    pose: 'trophy',
    borderColor: '#FBBF24',
    glowColor: 'rgba(251,191,36,0.25)',
  },
  {
    id: 'discipline_warrior',
    name: 'Iron Wing',
    rarity: 'Epic',
    unlockLevel: 20,
    story: 'A brave steel-armored bird who defends your routine from daily distractions with a shield of absolute focus.',
    pose: 'cheer',
    borderColor: '#F43F5E',
    glowColor: 'rgba(244,63,94,0.3)',
  },
  {
    id: 'master_consistency',
    name: 'Griffin Guardian',
    rarity: 'Legendary',
    unlockLevel: 35,
    story: 'A legendary beast of lore who rules the mountain castles, transforming discipline into a sovereign routine.',
    pose: 'trophy',
    borderColor: '#818CF8',
    glowColor: 'rgba(129,140,248,0.35)',
  },
  {
    id: 'celestial_guardian',
    name: 'Phoenix Ascended',
    rarity: 'Celestial',
    unlockLevel: 50,
    story: 'The ultimate cosmic protector of infinite time. Reborn from the ashes of every missed day to help you rise again.',
    pose: 'cheer',
    borderColor: '#EC4899',
    glowColor: 'rgba(236,72,153,0.4)',
  },
];

interface CharacterCollectionScreenProps {
  settings: UserSettings;
}

export const CharacterCollectionScreen: React.FC<CharacterCollectionScreenProps> = ({ settings }) => {
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);

  const userLevel = settings.level;

  const handleSelect = (char: Character) => {
    triggerHaptic('light');
    setSelectedChar(char);
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'Celestial': return { color: '#EC4899', bg: 'rgba(236,72,153,0.15)' };
      case 'Legendary': return { color: '#818CF8', bg: 'rgba(129,140,248,0.15)' };
      case 'Epic': return { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' };
      case 'Rare': return { color: '#34D399', bg: 'rgba(52,211,153,0.15)' };
      default: return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Companions</Text>
      
      {/* Featured Selected Character Block */}
      <View style={[styles.previewCard, { borderColor: selectedChar.borderColor }]}>
        <View style={styles.previewVisual}>
          <MascotIllustration pose={selectedChar.pose} width={150} height={150} />
          {userLevel < selectedChar.unlockLevel && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockEmoji}>🔒</Text>
              <Text style={styles.lockText}>Locked until Level {selectedChar.unlockLevel}</Text>
            </View>
          )}
        </View>
        <View style={styles.previewInfo}>
          <View style={styles.row}>
            <Text style={styles.previewName}>{selectedChar.name}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityStyle(selectedChar.rarity).bg }]}>
              <Text style={[styles.rarityText, { color: getRarityStyle(selectedChar.rarity).color }]}>
                {selectedChar.rarity}
              </Text>
            </View>
          </View>
          <Text style={styles.previewStory}>{selectedChar.story}</Text>
        </View>
      </View>

      {/* Grid of Characters */}
      <Text style={styles.subtitle}>Your Collection</Text>
      
      <FlatList
        data={CHARACTERS}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => {
          const isUnlocked = userLevel >= item.unlockLevel;
          const isSelected = selectedChar.id === item.id;
          
          return (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              activeOpacity={0.8}
              style={[
                styles.gridCell,
                isSelected && styles.cellSelected,
                !isUnlocked && styles.cellLocked,
              ]}
            >
              <MascotIllustration pose="avatar" width={60} height={60} />
              {!isUnlocked && (
                <View style={styles.miniLock}>
                  <Text style={styles.miniLockText}>🔒</Text>
                </View>
              )}
              <Text style={styles.cellName} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A10',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  previewCard: {
    backgroundColor: '#121320',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  previewVisual: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 10, 16, 0.85)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  previewInfo: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  previewStory: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  listContainer: {
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCell: {
    width: '30%',
    backgroundColor: '#121320',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  cellSelected: {
    borderColor: '#7A5CFF',
    backgroundColor: 'rgba(122,92,255,0.06)',
  },
  cellLocked: {
    opacity: 0.5,
  },
  miniLock: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLockText: {
    fontSize: 11,
  },
  cellName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E6E6FF',
    marginTop: 8,
    textAlign: 'center',
  },
});
