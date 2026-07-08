import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Habit, HistoryEntry, UserSettings } from '../types';
import { calculateStreakInfo, StreakState } from '../utils/StreakEngine';

interface StatusCardProps {
  habits: Habit[];
  history: HistoryEntry[];
  settings: UserSettings;
}

export const StatusCard: React.FC<StatusCardProps> = ({ habits, history, settings }) => {
  const info = calculateStreakInfo(habits, history, new Date(), settings);
  const { state, completedCount, totalCount, remainingCount } = info;

  // Determine title, description, and color palette based on state and time
  const getCardContent = () => {
    const activeHabits = habits.filter((h) => !h.isArchived);
    if (activeHabits.length === 0) {
      return {
        title: "🌱 Welcome to Habit Flow!",
        description: "Add a habit below to start building your streak.",
        bgColor: '#12131F',
        borderColor: 'rgba(122,92,255,0.2)',
        titleColor: '#FFFFFF',
        textColor: 'rgba(255,255,255,0.6)',
      };
    }

    if (state === 'SAFE') {
      return {
        title: "🎉 Today's Goal Completed",
        description: "Your streak is safe. See you tomorrow.",
        bgColor: '#142C1E',
        borderColor: 'rgba(16,185,129,0.3)',
        titleColor: '#A7F3D0',
        textColor: '#D1FAE5',
      };
    }

    if (state === 'AT_RISK') {
      return {
        title: "⚠️ One Hour Remaining",
        description: `Complete your remaining habits before today's reset at ${settings.dailyResetTime || 'midnight'}.`,
        bgColor: '#381F1A',
        borderColor: 'rgba(239,68,68,0.5)',
        titleColor: '#FECACA',
        textColor: '#FEE2E2',
      };
    }

    // Default 'IN_PROGRESS' states based on time of day
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        title: "🌞 Good Morning",
        description: `Day ${info.currentStreak + 1}. You have the whole day ahead. Let's make today count.`,
        bgColor: '#12131F',
        borderColor: 'rgba(255,255,255,0.06)',
        titleColor: '#FFFFFF',
        textColor: 'rgba(255,255,255,0.6)',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        title: "🔥 Great Progress",
        description: `${completedCount} / ${totalCount} habits completed. Only ${remainingCount} left.`,
        bgColor: '#12131F',
        borderColor: 'rgba(255,255,255,0.06)',
        titleColor: '#FFFFFF',
        textColor: 'rgba(255,255,255,0.6)',
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        title: "✨ Keep Going",
        description: "You're almost there. Complete today's habits to protect your streak.",
        bgColor: '#12131F',
        borderColor: 'rgba(255,255,255,0.06)',
        titleColor: '#FFFFFF',
        textColor: 'rgba(255,255,255,0.6)',
      };
    } else {
      return {
        title: "🌙 Quiet Hours",
        description: "Take it easy. Complete your habits when you're ready.",
        bgColor: '#12131F',
        borderColor: 'rgba(255,255,255,0.06)',
        titleColor: '#FFFFFF',
        textColor: 'rgba(255,255,255,0.6)',
      };
    }
  };

  const content = getCardContent();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Local state for deferred rendering during fade transitions
  const [displayContent, setDisplayContent] = useState(content);

  // Fade transition on content change
  useEffect(() => {
    if (content.title !== displayContent.title || content.description !== displayContent.description) {
      // 1. Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // 2. Set new content
        setDisplayContent(content);
        // 3. Spring fade in (400ms)
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }).start();
      });
    } else {
      setDisplayContent(content);
    }
  }, [content.title, content.description]);

  // Gentle 6-second pulse loop for AT_RISK warnings
  useEffect(() => {
    if (state === 'AT_RISK') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const animatedBorderColor = state === 'AT_RISK'
    ? pulseAnim.interpolate({
        inputRange: [0.4, 0.9],
        outputRange: ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.7)'],
      })
    : displayContent.borderColor;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: displayContent.bgColor,
          borderColor: animatedBorderColor,
          opacity: fadeAnim,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Status: ${displayContent.title}. ${displayContent.description}`}
    >
      {/* Decorative vertical strip on the left */}
      <View
        style={[
          styles.accentStrip,
          {
            backgroundColor:
              state === 'SAFE' ? '#10B981' : state === 'AT_RISK' ? '#EF4444' : '#7A5CFF',
          },
        ]}
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: displayContent.titleColor }]}>
          {displayContent.title}
        </Text>
        <Text style={[styles.description, { color: displayContent.textColor }]}>
          {displayContent.description}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 84,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  accentStrip: {
    width: 6,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
