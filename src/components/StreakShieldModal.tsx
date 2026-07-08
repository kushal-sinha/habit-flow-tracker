import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { MascotIllustration } from './MascotIllustration';
import { triggerHaptic } from '../services/hapticService';

interface StreakShieldModalProps {
  visible: boolean;
  streakCount: number;
  onDismiss: () => void;
}

export const StreakShieldModal: React.FC<StreakShieldModalProps> = ({ visible, streakCount, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      triggerHaptic('success');
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Shield Glow Accent */}
          <View style={styles.shieldGlow}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </View>

          {/* Mascot in Cheer Pose */}
          <View style={styles.mascotContainer}>
            <MascotIllustration pose="cheer" width={140} height={140} />
          </View>

          <Text style={styles.title}>Streak Protected!</Text>
          
          <Text style={styles.message}>
            Your Streak Shield protected your{' '}
            <Text style={styles.highlight}>{streakCount}-day</Text> streak!
          </Text>
          
          <Text style={styles.subMessage}>
            We've saved your progress. Keep showing up for yourself!
          </Text>

          <TouchableOpacity style={styles.button} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#121320',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.25)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
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
  shieldGlow: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(122, 92, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(122, 92, 255, 0.3)',
  },
  shieldEmoji: {
    fontSize: 32,
  },
  mascotContainer: {
    width: 140,
    height: 140,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6E6FF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  highlight: {
    color: '#7A5CFF',
    fontWeight: '900',
  },
  subMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#7A5CFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
