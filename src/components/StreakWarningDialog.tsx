import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { tw } from '../utils/theme';
import { CharacterScene } from './CharacterScene';
import { triggerHaptic } from '../services/hapticService';

interface StreakWarningDialogProps {
  visible: boolean;
  streakCount: number;
  onDismiss: () => void;
}

export const StreakWarningDialog: React.FC<StreakWarningDialogProps> = ({
  visible,
  streakCount,
  onDismiss,
}) => {
  const [shouldRender, setShouldRender] = useState(visible);
  
  // Animation value drivers
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Play warning haptic
      triggerHaptic('heavy');
      
      // Parallel entry animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    onDismiss();
  };

  if (!shouldRender) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              style={[
                styles.dialogCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              {/* Background Glass Blur */}
              <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />

              {/* Close Button (Top Right) */}
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
                  Streak In Danger! ⚠️
                </Text>
                <Text style={styles.dialogSubtitle}>
                  Don't break your momentum!
                </Text>
              </View>

              {/* Crimson Warning 3D Model Container */}
              <View style={styles.mascotContainer}>
                <CharacterScene 
                  animationName="sad" 
                  milestoneLevel={1}
                  theme="dark"
                  modelType="crimson"
                />
              </View>

              {/* Streak Counter display */}
              <View style={tw`items-center z-10 mb-2`}>
                <Svg height="55" width="280">
                  <Defs>
                    <SvgLinearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#FF9F9F" />
                      <Stop offset="100%" stopColor="#FF453A" />
                    </SvgLinearGradient>
                  </Defs>
                  <SvgText 
                    fill="url(#warningGrad)" 
                    fontSize="36" 
                    fontWeight="900" 
                    x="140" 
                    y="40" 
                    textAnchor="middle"
                  >
                    {`${streakCount} Day Streak`}
                  </SvgText>
                </Svg>
              </View>

              {/* Body Text copy explaining the risk */}
              <Text style={styles.supportingText}>
                Complete today's routine to save your streak and keep your companion happy!
              </Text>

              {/* Call-to-action save button */}
              <Animated.View style={[styles.ctaButtonWrapper, { transform: [{ scale: buttonScale }] }]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleDismiss}
                  style={styles.ctaButton}
                >
                  <Text style={styles.ctaButtonText}>Complete Now! 🔥</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCard: {
    width: width * 0.90,
    backgroundColor: 'rgba(28, 30, 43, 0.94)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.12)', // Subtle warning red outline
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 30 },
        shadowOpacity: 0.45,
        shadowRadius: 80,
      },
      android: {
        elevation: 12,
      }
    })
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  closeButtonText: {
    color: '#A6A8B8',
    fontSize: 16,
    fontWeight: '600',
  },
  dialogTitle: {
    color: '#FF453A', // Warning Red
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dialogSubtitle: {
    color: '#D3D4E0',
    fontSize: 16,
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
    color: '#A6A8B8',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  ctaButtonWrapper: {
    width: '90%',
    height: 58,
  },
  ctaButton: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#FF453A', // Red color for urgency
    alignItems: 'center',
    justifyContent: 'center',
    // Glowing warning shadow
    ...Platform.select({
      ios: {
        shadowColor: '#FF453A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      }
    })
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
