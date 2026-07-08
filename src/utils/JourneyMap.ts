export interface RegionConfig {
  name: string;
  minLevel: number;
  maxLevel: number;
  mascotName: string;
  mascotPose: 'idle' | 'cheer' | 'trophy' | 'avatar';
  backgroundTheme: {
    gradientColors: string[];
    ambientSoundKey: string;
    ambientSoundTitle: string;
  };
  badgeDesign: {
    type: 'bronze' | 'silver' | 'gold' | 'purple_champion' | 'sapphire' | 'legendary_gold' | 'immortal';
    iconName: string;
    borderColor: string;
    glowColor: string;
  };
  celebrationStyle: 'confetti' | 'leaves' | 'snow' | 'sparks' | 'castle_glow' | 'stardust';
  exclusiveAchievementId: string;
}

export const JOURNEY_REGIONS: RegionConfig[] = [
  {
    name: '🌱 Seedling Village',
    minLevel: 1,
    maxLevel: 4,
    mascotName: 'Base Birdie',
    mascotPose: 'idle',
    backgroundTheme: {
      gradientColors: ['#090A10', '#121324'],
      ambientSoundKey: 'calm_village',
      ambientSoundTitle: 'Village Wind Chimes',
    },
    badgeDesign: {
      type: 'bronze',
      iconName: 'sprout',
      borderColor: 'rgba(192, 132, 252, 0.4)',
      glowColor: 'rgba(192, 132, 252, 0.1)',
    },
    celebrationStyle: 'confetti',
    exclusiveAchievementId: 'welcome_village',
  },
  {
    name: '🌲 Forest Explorer',
    minLevel: 5,
    maxLevel: 9,
    mascotName: 'Woodland Chirper',
    mascotPose: 'idle',
    backgroundTheme: {
      gradientColors: ['#040B0C', '#0B1D19'],
      ambientSoundKey: 'deep_forest',
      ambientSoundTitle: 'Forest Morning Birds',
    },
    badgeDesign: {
      type: 'silver',
      iconName: 'tree',
      borderColor: 'rgba(52, 211, 153, 0.4)',
      glowColor: 'rgba(52, 211, 153, 0.1)',
    },
    celebrationStyle: 'leaves',
    exclusiveAchievementId: 'forest_ranger',
  },
  {
    name: '🏔 Mountain Climber',
    minLevel: 10,
    maxLevel: 19,
    mascotName: 'Yeti Flyer',
    mascotPose: 'trophy',
    backgroundTheme: {
      gradientColors: ['#050816', '#1E293B'],
      ambientSoundKey: 'mountain_wind',
      ambientSoundTitle: 'Mountain Breeze & Bells',
    },
    badgeDesign: {
      type: 'gold',
      iconName: 'image-filter-hdr',
      borderColor: 'rgba(251, 191, 36, 0.4)',
      glowColor: 'rgba(251, 191, 36, 0.1)',
    },
    celebrationStyle: 'snow',
    exclusiveAchievementId: 'peak_perfection',
  },
  {
    name: '⚔ Discipline Warrior',
    minLevel: 20,
    maxLevel: 34,
    mascotName: 'Iron Wing',
    mascotPose: 'cheer',
    backgroundTheme: {
      gradientColors: ['#110A0A', '#2D1616'],
      ambientSoundKey: 'warrior_drums',
      ambientSoundTitle: 'Steady Heartbeat Drums',
    },
    badgeDesign: {
      type: 'purple_champion',
      iconName: 'shield-sword',
      borderColor: 'rgba(244, 63, 94, 0.4)',
      glowColor: 'rgba(244, 63, 94, 0.1)',
    },
    celebrationStyle: 'sparks',
    exclusiveAchievementId: 'blade_master',
  },
  {
    name: '🏰 Master of Consistency',
    minLevel: 35,
    maxLevel: 49,
    mascotName: 'Griffin Guardian',
    mascotPose: 'trophy',
    backgroundTheme: {
      gradientColors: ['#070D19', '#1E1B4B'],
      ambientSoundKey: 'cathedral_echo',
      ambientSoundTitle: 'Harp Resonance',
    },
    badgeDesign: {
      type: 'legendary_gold',
      iconName: 'castle',
      borderColor: 'rgba(129, 140, 248, 0.5)',
      glowColor: 'rgba(129, 140, 248, 0.2)',
    },
    celebrationStyle: 'castle_glow',
    exclusiveAchievementId: 'castle_sovereign',
  },
  {
    name: '🌌 Celestial Guardian',
    minLevel: 50,
    maxLevel: 99999,
    mascotName: 'Phoenix Ascended',
    mascotPose: 'cheer',
    backgroundTheme: {
      gradientColors: ['#020205', '#0F172A'],
      ambientSoundKey: 'cosmic_hum',
      ambientSoundTitle: 'Deep Space Soundscape',
    },
    badgeDesign: {
      type: 'immortal',
      iconName: 'weather-night-lounge',
      borderColor: 'rgba(236, 72, 153, 0.6)',
      glowColor: 'rgba(236, 72, 153, 0.3)',
    },
    celebrationStyle: 'stardust',
    exclusiveAchievementId: 'cosmic_watcher',
  },
];

export function getRegionForLevel(level: number): RegionConfig {
  const region = JOURNEY_REGIONS.find((r) => level >= r.minLevel && level <= r.maxLevel);
  return region || JOURNEY_REGIONS[0];
}
