import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Platform, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { triggerHaptic } from '../services/hapticService';

interface WelcomeLottieModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const WelcomeLottieModal: React.FC<WelcomeLottieModalProps> = ({ visible, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      triggerHaptic('success');
    }
  }, [visible]);

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
          {/* Lottie Animation Wrapper */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../assets/lottie/Wavey Birdie.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <Text style={styles.title}>Meet Your Companion!</Text>
          
          <Text style={styles.message}>
            Welcome! I'm your growth companion. Every habit you complete feeds my energy, helps us level up, and unlocks new regions!
          </Text>
          
          <Text style={styles.subMessage}>
            No shame, no guilt. Just steady progress together.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Let's Fly! 🚀</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.9)',
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
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  animationContainer: {
    width: 180,
    height: 180,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E6E6FF',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 26,
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#7A5CFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7A5CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
