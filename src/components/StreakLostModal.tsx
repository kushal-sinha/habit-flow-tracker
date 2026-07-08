import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { MascotIllustration } from './MascotIllustration';
import { triggerHaptic } from '../services/hapticService';

interface StreakLostModalProps {
  visible: boolean;
  onDismiss: () => void;
  onViewStats: () => void;
}

export const StreakLostModal: React.FC<StreakLostModalProps> = ({ visible, onDismiss, onViewStats }) => {
  useEffect(() => {
    if (visible) {
      triggerHaptic('medium');
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
          {/* Mascot in Idle/Encouraging Pose */}
          <View style={styles.mascotContainer}>
            <MascotIllustration pose="idle" width={140} height={140} />
          </View>

          <Text style={styles.title}>Every Journey Has Rest Days</Text>
          
          <Text style={styles.message}>
            Every great streak starts with <Text style={styles.highlight}>Day One</Text>.
          </Text>
          
          <Text style={styles.subMessage}>
            We're ready whenever you are. Let's build an even stronger streak together!
          </Text>

          {/* CTAs */}
          <TouchableOpacity style={styles.primaryButton} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Start Today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onViewStats} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>View Statistics</Text>
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
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mascotContainer: {
    width: 140,
    height: 140,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E6E6FF',
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 26,
    paddingHorizontal: 10,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#7A5CFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.1,
  },
});
