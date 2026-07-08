import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, Platform, View } from 'react-native';
import { getNextResetDateTime } from '../utils/TimeWindowCalculator';

interface UndoSnackbarProps {
  visible: boolean;
  resetTime: string;
  onDismiss: () => void;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({ visible, resetTime, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(350)).current; // hidden by default below bottom edge
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Slide UP (250ms spring)
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 11,
        useNativeDriver: true,
      }).start();

      // Dismiss automatically after 3 seconds
      timeoutRef.current = setTimeout(() => {
        onDismiss();
      }, 3000);
    } else {
      // Slide DOWN (200ms timing)
      Animated.timing(slideAnim, {
        toValue: 350,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const getRemainingTimeText = () => {
    try {
      const nextReset = getNextResetDateTime(new Date(), resetTime);
      const diffMs = nextReset.getTime() - Date.now();
      const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        return `You still have ${hours} hours and ${minutes} minutes remaining to finish today's goal.`;
      } else {
        return `You still have ${minutes} minutes remaining to finish today's goal.`;
      }
    } catch (e) {
      return `You still have until ${resetTime || 'midnight'} to finish today's goal.`;
    }
  };

  const remainingText = getRemainingTimeText();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Habit marked as incomplete. ${remainingText}`}
    >
      <View style={styles.row}>
        <Text style={styles.undoIcon}>↩</Text>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Habit marked as incomplete.</Text>
          <Text style={styles.subtitle}>
            {remainingText}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160, // Floats cleanly above the floating tab bar
    left: '5%',
    right: '5%',
    width: '90%',
    backgroundColor: '#161726',
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.2)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoIcon: {
    fontSize: 22,
    color: '#7A5CFF',
    marginRight: 12,
    fontWeight: 'bold',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E6E6FF',
    letterSpacing: -0.15,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});
