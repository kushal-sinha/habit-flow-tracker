import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  useColorScheme,
  TouchableWithoutFeedback
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { tw } from '../utils/theme';
import { useCelebration } from '../hooks/useCelebration';
import { CharacterScene } from './CharacterScene';
import { triggerHaptic } from '../services/hapticService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const CelebrationDialog: React.FC = () => {
  const { currentCelebration, dismissCelebration } = useCelebration();
  const systemColorScheme = useColorScheme();
  const activeTheme = systemColorScheme === 'dark' ? 'dark' : 'light';

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const sheetScale = useRef(new Animated.Value(0.92)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Confetti Particle Animations
  const particleAnims = useRef<Animated.Value[]>(
    Array.from({ length: 40 }, () => new Animated.Value(0))
  ).current;

  // Streak counter display
  const [displayedStreak, setDisplayedStreak] = useState(0);

  const isOpen = currentCelebration !== null;

  useEffect(() => {
    if (isOpen && currentCelebration) {
      setDisplayedStreak(0);

      // 1. Trigger Entry Transitions (Backdrop fade + Spring slide up & scale)
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(sheetScale, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 2. Play Streak Counter Count-up Animation
        let currentCount = 0;
        const targetStreak = currentCelebration.streakCount;
        if (targetStreak > 0) {
          const duration = 1000;
          const intervalTime = Math.max(Math.floor(duration / targetStreak), 20);
          const counter = setInterval(() => {
            currentCount += 1;
            setDisplayedStreak(currentCount);
            if (currentCount >= targetStreak) {
              clearInterval(counter);
            }
          }, intervalTime);
        }

        // 3. Play Confetti Fall Animation
        const fallAnimations = particleAnims.map((anim) => {
          anim.setValue(0);
          return Animated.timing(anim, {
            toValue: 1,
            duration: 1800 + Math.random() * 1200,
            useNativeDriver: true,
          });
        });
        Animated.parallel(fallAnimations).start();
      });
    }
  }, [isOpen, currentCelebration]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleDismiss = () => {
    // Play exit haptic
    triggerHaptic('light');

    // Slide sheet down, fade out, scale down
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetScale, {
        toValue: 0.92,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissCelebration();
    });
  };

  if (!isOpen || !currentCelebration) return null;

  // Custom particle generator (tiny dots, sparkles, streaks, soft stars)
  const getParticleStyle = (index: number, animValue: Animated.Value) => {
    const leftOffset = (SCREEN_WIDTH / 40) * index + (Math.random() * 16 - 8);
    const size = Math.random() * 5 + 4; // Tiny dots/confetti
    const rotateStart = Math.random() * 360;
    const rotateEnd = rotateStart + 360 + Math.random() * 180;
    
    // Colors from spec
    const colors = ['#8A74FF', '#FF7BE8', '#FFD76B', '#6EC5FF', '#FFFFFF'];
    const color = colors[index % colors.length];

    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-30, SCREEN_HEIGHT - 60],
    });

    const rotate = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [`${rotateStart}deg`, `${rotateEnd}deg`],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 0.1, 0.8, 1],
      outputRange: [0, 0.3, 0.3, 0], // Strict 30% opacity max
    });

    return {
      position: 'absolute' as const,
      left: leftOffset,
      width: size,
      height: size,
      borderRadius: index % 3 === 0 ? size / 2 : 1, // mix tiny dots & stars
      backgroundColor: color,
      transform: [{ translateY }, { rotate }],
      opacity,
    };
  };

  const isMilestone = currentCelebration.milestoneLevel > 0;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        {/* Transparent Blurred Backdrop overlay */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}>
          <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="dark" />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleDismiss} />
        </Animated.View>

        {/* Floating Confetti Particle Layer */}
        {particleAnims.map((anim, idx) => (
          <Animated.View key={idx} style={getParticleStyle(idx, anim)} pointerEvents="none" />
        ))}

        {/* Modal Bottom Sheet Card Container */}
        <Animated.View 
          style={[
            styles.bottomSheet, 
            { 
              transform: [
                { translateY: sheetTranslateY },
                { scale: sheetScale }
              ] 
            }
          ]}
        >
          <View style={styles.dialogCard}>
            {/* Background Blur on Card itself */}
            <BlurView intensity={70} style={StyleSheet.absoluteFill} tint="dark" />

            {/* Circular Close Button (Top Right) */}
            <TouchableOpacity 
              onPress={handleDismiss} 
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Title Block */}
            <View style={tw`items-center mt-3`}>
              <Text style={styles.dialogTitle}>
                🎉 WOOHOO!
              </Text>
              <Text style={styles.dialogSubtitle}>
                You did it!
              </Text>
            </View>

            {/* 3D Mascot Character (Overlaps the bottom CTA area by negative margin) */}
            <View style={styles.mascotContainer}>
              <CharacterScene 
                animationName={currentCelebration.animationName} 
                milestoneLevel={currentCelebration.milestoneLevel}
                theme="dark" 
              />
            </View>

            {/* Streak Indicator (Animated scale trigger on load finish) */}
            <View style={tw`items-center z-10 mb-2`}>
              <Svg height="55" width="280">
                <Defs>
                  <SvgLinearGradient id="streakGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#B89DFF" />
                    <Stop offset="100%" stopColor="#6C4DFF" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText 
                  fill="url(#streakGrad)" 
                  fontSize="40" 
                  fontWeight="900" 
                  x="140" 
                  y="40" 
                  textAnchor="middle"
                >
                  {`${displayedStreak} Day Streak`}
                </SvgText>
              </Svg>
            </View>

            {/* Encouraging Custom Supporting Text */}
            <Text style={styles.supportingText}>
              Keep going,{"\n"}you're doing amazing!
            </Text>

            {/* Footer Buttons */}
            <View style={tw`w-full items-center z-10 gap-3 mt-4`}>
              <Animated.View style={[styles.ctaButtonWrapper, { transform: [{ scale: buttonScale }] }]}>
                <TouchableWithoutFeedback
                  onPress={handleDismiss}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <View style={styles.ctaButton}>
                    <Svg style={StyleSheet.absoluteFill} width="100%" height="58">
                      <Defs>
                        <SvgLinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <Stop offset="0%" stopColor="#7B5CFF" />
                          <Stop offset="100%" stopColor="#5A3DFF" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect width="100%" height="58" rx="20" fill="url(#btnGrad)" />
                    </Svg>
                    <Text style={styles.ctaButtonText}>
                      Let's Go! 🔥
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </Animated.View>

              {isMilestone && (
                <TouchableOpacity
                  onPress={() => triggerHaptic('light')}
                  activeOpacity={0.8}
                  style={styles.shareLink}
                >
                  <Text style={tw`font-extrabold text-sm text-[#D5D5E5]`}>
                    Share Achievement 🔗
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    width: '90%',
    alignItems: 'center',
  },
  dialogCard: {
    width: '100%',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 32,
    backgroundColor: 'rgba(25, 25, 35, 0.94)',
    overflow: 'hidden',
    alignItems: 'center',
    // Apple-style soft drop shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.45,
    shadowRadius: 80,
    elevation: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 50,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  dialogSubtitle: {
    color: '#D5D5E5',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  mascotContainer: {
    width: '100%',
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: -15, // overlapping creates interactive depth
  },
  supportingText: {
    color: '#D0D0DD',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 28,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  ctaButtonWrapper: {
    width: '90%',
    height: 58,
  },
  ctaButton: {
    width: '100%',
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    // Subtle button glow
    shadowColor: '#7B5CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  shareLink: {
    width: '90%',
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
});
