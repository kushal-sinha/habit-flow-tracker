import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText
} from 'react-native-svg';
import { triggerHaptic } from '../services/hapticService';
import { calculateProgressPercentage, MilestoneConfig, MILESTONES } from '../utils/progressionUtils';
import { tw } from '../utils/theme';

// Helper to generate a mathematically perfect 5-pointed star path
const getStarPath = (cx: number, cy: number, r: number): string => {
  const points = [];
  const innerR = r * 0.45;
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const currR = i % 2 === 0 ? r : innerR;
    const x = cx + currR * Math.cos(angle);
    const y = cy + currR * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return `M ${points.join(' L ')} Z`;
};

// ----------------------------------------------------
// LevelBadge SVG Component
// ----------------------------------------------------
interface LevelBadgeProps {
  level: number;
  badgeType: MilestoneConfig['badgeType'];
  isActive: boolean;
}

const LevelBadge: React.FC<LevelBadgeProps> = React.memo(({ level, badgeType, isActive }) => {
  // Bright metallic rim gradient stops
  let borderStops = { top: '#C8814E', bottom: '#7D4B22' };
  // Darker inner panel background gradient stops
  let panelStops = { top: '#4E2A12', bottom: '#2D1608' };
  let starColor = '#FFEAC3';

  switch (badgeType) {
    case 'silver':
      borderStops = { top: '#E8ECF2', bottom: '#8C909C' };
      panelStops = { top: '#3D404A', bottom: '#24262E' };
      starColor = '#FFFFFF';
      break;
    case 'gold':
      borderStops = { top: '#FFE9A3', bottom: '#C57C11' };
      panelStops = { top: '#694204', bottom: '#3B2200' };
      starColor = '#FFEAA7';
      break;
    case 'purple_champion':
      borderStops = { top: '#DAC5FF', bottom: '#6C4DFF' };
      panelStops = { top: '#2B1A66', bottom: '#160C38' };
      starColor = '#EADFFF';
      break;
    case 'sapphire':
      borderStops = { top: '#BCE0FF', bottom: '#255CCF' };
      panelStops = { top: '#0E2C73', bottom: '#06153D' };
      starColor = '#DDF0FF';
      break;
    case 'legendary_gold':
      borderStops = { top: '#FFECAF', bottom: '#F39A00' };
      panelStops = { top: '#5E3A00', bottom: '#331E00' };
      starColor = '#FFEAA7';
      break;
    case 'immortal':
      borderStops = { top: '#FFD4F6', bottom: '#FF57A0' };
      panelStops = { top: '#4A0D4A', bottom: '#260426' };
      starColor = '#FFEAA7'; // Gold stars on deep red/burgundy
      break;
  }

  return (
    <Svg width={isActive ? 94 : 84} height={80} viewBox="0 0 100 80">
      <Defs>
        {/* Outer border metal linear gradient */}
        <LinearGradient id={`${badgeType}BorderGrad`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={borderStops.top} />
          <Stop offset="100%" stopColor={borderStops.bottom} />
        </LinearGradient>
        
        {/* Inner panel dark linear gradient */}
        <LinearGradient id={`${badgeType}PanelGrad`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={panelStops.top} />
          <Stop offset="100%" stopColor={panelStops.bottom} />
        </LinearGradient>

        {/* Level 30 wings linear gradient */}
        <LinearGradient id="immortalWingsGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FFE17F" />
          <Stop offset="100%" stopColor="#FF57A0" />
        </LinearGradient>
      </Defs>

      {/* Decorative Wing Elements */}
      {badgeType === 'purple_champion' && (
        <G fill={borderStops.top}>
          {/* Feathered Left Wing */}
          <Path d="M 22,36 C 8,24 2,42 22,46 Z" opacity="0.85" />
          <Path d="M 22,43 C 6,34 4,50 22,50 Z" opacity="0.75" />
          <Path d="M 22,50 C 10,46 8,56 22,54 Z" opacity="0.65" />
          {/* Feathered Right Wing */}
          <Path d="M 78,36 C 92,24 98,42 78,46 Z" opacity="0.85" />
          <Path d="M 78,43 C 94,34 96,50 78,50 Z" opacity="0.75" />
          <Path d="M 78,50 C 90,46 92,56 78,54 Z" opacity="0.65" />
        </G>
      )}

      {badgeType === 'sapphire' && (
        <G fill={borderStops.bottom}>
          {/* Left and Right Side Pointy Crest Accents */}
          <Path d="M 24,36 L 16,38 L 16,48 L 24,46 Z" opacity="0.9" />
          <Path d="M 76,36 L 84,38 L 84,48 L 76,46 Z" opacity="0.9" />
        </G>
      )}

      {badgeType === 'legendary_gold' && (
        <G fill="#FFD85A">
          {/* Detailed Golden Laurel Leaf Accents */}
          <Path d="M 24,44 C 14,48 14,64 36,68 C 30,62 25,55 24,44 Z" />
          <Path d="M 20,54 C 12,58 14,68 30,68 C 24,62 21,58 20,54 Z" />
          
          <Path d="M 76,44 C 86,48 86,64 64,68 C 70,62 75,55 76,44 Z" />
          <Path d="M 80,54 C 88,58 86,68 70,68 C 76,62 79,58 80,54 Z" />
        </G>
      )}

      {badgeType === 'immortal' && (
        <G fill="url(#immortalWingsGrad)">
          {/* Majestic Outward Feathered Wings */}
          <Path d="M 24,30 C 5,12 -2,32 16,48 C 8,44 6,56 22,54 Z" />
          <Path d="M 76,30 C 95,12 102,32 84,48 C 92,44 94,56 78,54 Z" />
        </G>
      )}

      {/* Main Badge Base Crest Shield Shape */}
      <G>
        {/* Outer Rim path (Embossed boundary) */}
        <Path
          d="M 50,12 Q 63,16 76,14 L 76,48 Q 76,64 50,74 Q 24,64 24,48 L 24,14 Q 37,16 50,12 Z"
          fill={`url(#${badgeType}BorderGrad)`}
          stroke={borderStops.bottom}
          strokeWidth={0.5}
        />
        
        {/* Inner Panel path (Offset inset filled dark) */}
        <Path
          d="M 50,16 Q 61,19 72,18 L 72,46 Q 72,60 50,69 Q 28,60 28,46 L 28,18 Q 39,19 50,16 Z"
          fill={`url(#${badgeType}PanelGrad)`}
        />

        {/* 3-Star Top Curved Arch */}
        {/* Center top star */}
        <Path d={getStarPath(50, 24, 4.8)} fill={starColor} />
        {/* Left top star */}
        <Path d={getStarPath(41, 26, 3.2)} fill={starColor} opacity={0.8} />
        {/* Right top star */}
        <Path d={getStarPath(59, 26, 3.2)} fill={starColor} opacity={0.8} />

        {/* Bottom Tip Star Accent */}
        <Path d={getStarPath(50, 60, 4.8)} fill={starColor} opacity={0.85} />

        {/* Centered Bold Level Text */}
        <SvgText
          x="50"
          y="48"
          fill={badgeType === 'immortal' ? '#FFD76B' : '#FFFFFF'} // Golden text on Level 30
          fontSize={level >= 100 ? "17" : "23"}
          fontWeight="900"
          fontFamily={Platform.OS === 'ios' ? 'System' : 'sans-serif'}
          textAnchor="middle"
          letterSpacing="-0.5"
        >
          {level}
        </SvgText>
      </G>
    </Svg>
  );
});

// ----------------------------------------------------
// LevelDetailBottomSheet Component
// ----------------------------------------------------
interface DetailBottomSheetProps {
  visible: boolean;
  milestone: MilestoneConfig;
  streakCount: number;
  onDismiss: () => void;
}

const LevelDetailBottomSheet: React.FC<DetailBottomSheetProps> = ({
  visible,
  milestone,
  streakCount,
  onDismiss,
}) => {
  const isUnlocked = streakCount >= milestone.minDays;
  const remainingDays = milestone.minDays - streakCount;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.sheetBackdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetCard}>
              <View style={styles.sheetHandle} />
              
              {/* Badge Preview */}
              <View style={tw`my-4 items-center`}>
                <LevelBadge level={milestone.level} badgeType={milestone.badgeType} isActive={true} />
              </View>

              {/* Title & Status */}
              <Text style={styles.sheetTitle}>{`Level ${milestone.level}: ${milestone.rank}`}</Text>
              
              <View style={[
                styles.statusTag, 
                isUnlocked ? styles.statusUnlockedBg : styles.statusLockedBg
              ]}>
                <Text style={styles.statusTagText}>
                  {isUnlocked ? '✦ Milestone Unlocked ✦' : `🔒 Locked — Needs ${remainingDays} more days`}
                </Text>
              </View>

              {/* Grid Specifications */}
              <View style={styles.specGrid}>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Days Required</Text>
                  <Text style={styles.specVal}>{milestone.minDays === 120 ? '120+ Days' : `${milestone.minDays}–${milestone.maxDays} Days`}</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Min XP Required</Text>
                  <Text style={styles.specVal}>{milestone.xpRequired.toLocaleString()}</Text>
                </View>
              </View>

              {/* Character Unlock */}
              <View style={styles.unlockedBox}>
                <Text style={styles.sectionHeading}>Companion Mascot Unlock</Text>
                <Text style={styles.characterName}>{milestone.unlockedCharacter}</Text>
              </View>

              {/* Rewards List */}
              <View style={tw`w-full mb-6`}>
                <Text style={styles.sectionHeading}>Unlocked Rewards</Text>
                {milestone.rewards.map((reward, i) => (
                  <View key={i} style={tw`flex-row items-center gap-2.5 mt-2`}>
                    <Text style={tw`text-[#7A5CFF] text-base`}>✦</Text>
                    <Text style={styles.rewardItemText}>{reward}</Text>
                  </View>
                ))}
              </View>

              {/* Dismiss Button */}
              <TouchableOpacity style={styles.sheetCta} onPress={onDismiss}>
                <Text style={styles.sheetCtaText}>Awesome! Let's Go</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ----------------------------------------------------
// Main LevelTimeline Component
// ----------------------------------------------------
interface LevelTimelineProps {
  currentStreak: number;
}

export const LevelTimeline: React.FC<LevelTimelineProps> = ({ currentStreak }) => {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneConfig | null>(null);
  
  // Animation driving drivers
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const checkAnimList = useRef(MILESTONES.map(() => new Animated.Value(0))).current;

  const { percentage, activeIndex } = calculateProgressPercentage(currentStreak, MILESTONES);

  useEffect(() => {
    // 1. Spring trigger progress line fill width
    Animated.spring(progressAnim, {
      toValue: percentage,
      tension: 18,
      friction: 6,
      useNativeDriver: false,
    }).start();

    // 2. Loop dynamic idle floating motion on the active level badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Loop pulsing active node orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.45,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Animate completed indicators sequentially
    MILESTONES.forEach((milestone, idx) => {
      const isCompleted = currentStreak >= milestone.minDays;
      Animated.spring(checkAnimList[idx], {
        toValue: isCompleted ? 1 : 0,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
        delay: idx * 120,
      }).start();
    });
  }, [currentStreak, percentage]);

  const handleBadgePress = (milestone: MilestoneConfig) => {
    triggerHaptic('light');
    setSelectedMilestone(milestone);
  };

  const handleBadgeLongPress = (milestone: MilestoneConfig) => {
    triggerHaptic('heavy');
    setSelectedMilestone(milestone);
  };

  // Node color helper corresponding to milestone tier
  const getNodeColor = (type: MilestoneConfig['badgeType']): string => {
    switch (type) {
      case 'bronze': return '#A35D2E';
      case 'silver': return '#8C909C';
      case 'gold': return '#FFD76B';
      case 'purple_champion': return '#7A5CFF';
      case 'sapphire': return '#549DFF';
      case 'legendary_gold': return '#FFD85A';
      case 'immortal': return '#FF57A0';
      default: return '#3A3C47';
    }
  };

  return (
    <View style={styles.container}>
      <View 
        accessible 
        accessibilityLabel={`Streak Level Progression. Current streak is ${currentStreak} days. Active milestone is level ${MILESTONES[activeIndex].level}, rank ${MILESTONES[activeIndex].rank}.`} 
        accessibilityRole="summary"
      />

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.trackContainer}>
          {/* Milestone Columns Container */}
          <View style={styles.milestonesWrapper}>
            {MILESTONES.map((milestone, index) => {
              const isCompleted = currentStreak >= milestone.minDays;
              const isActive = index === activeIndex;
              const nodeColor = getNodeColor(milestone.badgeType);
              
              return (
                <View 
                  key={milestone.level} 
                  style={styles.milestoneColumn}
                >
                  {/* Row 1: LevelBadge (Floating dynamic scaling wrapper) */}
                  <Animated.View
                    style={{
                      transform: [
                        { translateY: isActive ? floatAnim : 0 },
                        { scale: isActive ? 1.08 : 1.0 }
                      ]
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleBadgePress(milestone)}
                      onLongPress={() => handleBadgeLongPress(milestone)}
                      delayLongPress={350}
                      style={styles.badgeTouchArea}
                    >
                      <LevelBadge 
                        level={milestone.level} 
                        badgeType={milestone.badgeType} 
                        isActive={isActive} 
                      />
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Row 2: Upper Track Node & Continuous Line Segments */}
                  <View style={styles.upperNodeAnchor}>
                    {/* Left Line Segment */}
                    {index > 0 && (
                      <View 
                        style={[
                          styles.upperLineSegment, 
                          { 
                            left: 0, 
                            right: '50%', 
                            backgroundColor: index <= activeIndex ? '#7A5CFF' : '#20222B' 
                          }
                        ]} 
                      />
                    )}
                    
                    {/* Right Line Segment */}
                    {index < MILESTONES.length - 1 && (
                      <View 
                        style={[
                          styles.upperLineSegment, 
                          { 
                            left: '50%', 
                            right: 0, 
                            backgroundColor: index < activeIndex ? '#7A5CFF' : '#20222B' 
                          }
                        ]} 
                      />
                    )}

                    {/* Centered Node Dot */}
                    {isActive ? (
                      <View style={[styles.activeNodeOrb, { backgroundColor: nodeColor }]}>
                        {/* Soft Pulsing Glow Ring */}
                        <Animated.View style={[
                          styles.activeNodePulseRing,
                          {
                            borderColor: nodeColor,
                            transform: [{ scale: pulseAnim }],
                            opacity: pulseAnim.interpolate({
                              inputRange: [1, 1.45],
                              outputRange: [0.65, 0]
                            })
                          }
                        ]} />
                      </View>
                    ) : (
                      <View 
                        style={[
                          styles.inactiveNodeDot, 
                          { backgroundColor: isCompleted ? '#7A5CFF' : '#3A3C47' }
                        ]} 
                      />
                    )}
                  </View>

                  {/* Row 3: Level Title */}
                  <Text style={[styles.levelLabel, isActive && styles.activeText]}>
                    {`Level ${milestone.level}`}
                  </Text>

                  {/* Row 4: Rank Label */}
                  <Text style={styles.rankLabel}>
                    {milestone.rank}
                  </Text>

                  {/* Row 5: Days Range */}
                  <Text style={styles.daysRangeLabel}>
                    {milestone.minDays === 120 ? '120+ Days' : `${milestone.minDays}–${milestone.maxDays} Days`}
                  </Text>

                  {/* Row 6: Completion Checkmarks & Continuous Line Segments */}
                  <View style={styles.nodeIndicatorAnchor}>
                    {/* Left Line Segment */}
                    {index > 0 && (
                      <View 
                        style={[
                          styles.lowerLineSegment, 
                          { 
                            left: 0, 
                            right: '50%', 
                            backgroundColor: index <= activeIndex ? '#7A5CFF' : '#1E202B' 
                          }
                        ]} 
                      />
                    )}
                    
                    {/* Right Line Segment */}
                    {index < MILESTONES.length - 1 && (
                      <View 
                        style={[
                          styles.lowerLineSegment, 
                          { 
                            left: '50%', 
                            right: 0, 
                            backgroundColor: index < activeIndex ? '#7A5CFF' : '#1E202B' 
                          }
                        ]} 
                      />
                    )}

                    {/* Centered Checkmark Orb */}
                    {isCompleted ? (
                      <Animated.View
                        style={[
                          styles.checkmarkCircle,
                          {
                            transform: [{ scale: checkAnimList[index] }]
                          }
                        ]}
                      >
                        <Text style={styles.checkmarkIconText}>✓</Text>
                      </Animated.View>
                    ) : (
                      <View style={styles.emptyTrackCircle} />
                    )}
                  </View>

                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Detail Bottom Sheet */}
      {selectedMilestone && (
        <LevelDetailBottomSheet
          visible={!!selectedMilestone}
          milestone={selectedMilestone}
          streakCount={currentStreak}
          onDismiss={() => setSelectedMilestone(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 290, // Accommodates bigger badges + wider node spacing
    backgroundColor: 'transparent',
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  trackContainer: {
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  milestonesWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 3,
  },
  milestoneColumn: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  badgeTouchArea: {
    width: 110,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Upper Node Row & Segment Line Styles
  upperNodeAnchor: {
    width: '100%',
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    zIndex: 10,
    position: 'relative',
  },
  upperLineSegment: {
    position: 'absolute',
    top: 6,
    height: 4,
    zIndex: 1,
  },
  inactiveNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0D0F17',
    zIndex: 2,
  },
  activeNodeOrb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0D0F17',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  activeNodePulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },

  // Typography (SF Pro Display / Inter inspired alignments)
  levelLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 18,
    letterSpacing: -0.4,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  rankLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#D7D9E3',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: -0.2,
  },
  daysRangeLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#8C90A1',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
  
  // Lower Checkmark Row & Segment Line Styles
  nodeIndicatorAnchor: {
    width: '100%',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    position: 'relative',
    zIndex: 10,
  },
  lowerLineSegment: {
    position: 'absolute',
    top: 15.5,
    height: 3,
    zIndex: 1,
  },
  emptyTrackCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E202B',
    borderWidth: 2,
    borderColor: '#0D0F17',
    zIndex: 2,
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7A5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    // satisfying completion glow
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      }
    })
  },
  checkmarkIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  // Detail Sheet Styles
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    width: '100%',
    backgroundColor: '#161722',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 24,
    paddingHorizontal: 26,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      }
    })
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  statusTag: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statusUnlockedBg: {
    backgroundColor: 'rgba(122,92,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.3)',
  },
  statusLockedBg: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusTagText: {
    color: '#D7D9E3',
    fontSize: 13,
    fontWeight: '700',
  },
  specGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  specBox: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#1E1F2C',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  specLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#6F7283',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specVal: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  unlockedBox: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#1E1F2C',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  sectionHeading: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#8C90A1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  characterName: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#A679FF',
    fontSize: 17,
    fontWeight: '800',
  },
  rewardItemText: {
    color: '#D7D9E3',
    fontSize: 14,
    fontWeight: '600',
  },
  sheetCta: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7A5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  sheetCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});