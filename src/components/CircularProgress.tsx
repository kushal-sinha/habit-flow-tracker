import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Diameter of the whole component in px */
  size?: number;
  /** Thickness of the progress stroke in px */
  strokeWidth?: number;
  /** Single solid color for the progress stroke (ignored if gradientColors is set) */
  color?: string;
  /** Two or more colors to render as a gradient stroke */
  gradientColors?: string[];
  /** Color of the background track circle */
  trackColor?: string;
  /** Round the ends of the progress stroke */
  roundedCap?: boolean;
  /** Animation duration in ms */
  duration?: number;
  /** Easing function for the animation */
  easing?: (value: number) => number;
  /** Show the built-in percentage label in the center */
  showPercentage?: boolean;
  /** Text color for the built-in percentage label */
  textColor?: string;
  /** Font size for the built-in percentage label */
  textSize?: number;
  /** Font weight for the built-in percentage label */
  textWeight?: '400' | '500' | '600' | '700' | '800' | '900';
  /** Show a glowing cursor handle at the tip of progress */
  showHandle?: boolean;
  /** Optional custom formatter, e.g. (p) => `${p}/100` */
  formatText?: (progress: number) => string;
  /** Replace the center content entirely (overrides showPercentage) */
  children?: React.ReactNode;
  /** Extra style applied to the outer wrapping View */
  style?: ViewStyle;
  /** Fires each time the animation completes */
  onAnimationComplete?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 140,
  strokeWidth = 12,
  color = '#7A5CFF',
  gradientColors = ['#D946EF', '#7A5CFF'],
  trackColor = '#171822',
  roundedCap = true,
  duration = 320,
  easing = Easing.out(Easing.cubic),
  showPercentage = true,
  textColor = '#FFFFFF',
  textSize,
  textWeight = '800',
  showHandle = true,
  formatText,
  children,
  style,
  onAnimationComplete,
}) => {
  const clampedProgress = clamp(progress, 0, 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const gradientId = useRef(`cp_grad_${Math.random().toString(36).slice(2, 10)}`).current;

  useEffect(() => {
    const anim = Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration,
      easing,
      useNativeDriver: false, // strokeDashoffset cannot run on native driver
    });
    anim.start(({ finished }) => {
      if (finished) onAnimationComplete?.();
    });
    return () => anim.stop();
  }, [clampedProgress]);

  // Handle cursor rotation calculations (Using GPU accelerated native transforms)
  const handleRotation = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  // Live-updating state for center label rendering
  const [displayValue, setDisplayValue] = React.useState(Math.round(clampedProgress));
  useEffect(() => {
    const id = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    return () => animatedValue.removeListener(id);
  }, [animatedValue]);

  const strokeColor = gradientColors ? `url(#${gradientId})` : color;
  const resolvedTextSize = textSize ?? Math.round(size * 0.22);
  const label = formatText ? formatText(displayValue) : `${displayValue}%`;

  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Svg width={size} height={size}>
        {gradientColors && gradientColors.length > 1 && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientColors.map((c, i) => (
                <Stop
                  key={i}
                  offset={`${(i / (gradientColors.length - 1)) * 100}%`}
                  stopColor={c}
                />
              ))}
            </LinearGradient>
          </Defs>
        )}

        {/* 1. Track background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* 2. Soft underlying neon glow circle wrapper */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth + 3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={roundedCap ? 'round' : 'butt'}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
          opacity={0.18}
        />

        {/* 3. Main crisp progress indicator stroke */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={roundedCap ? 'round' : 'butt'}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      {/* 4. Glowing leading-edge cursor handle (rotates to trace path tip) */}
      {showHandle && (
        <Animated.View 
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill, 
            { 
              transform: [{ rotate: handleRotation }] 
            }
          ]}
        >
          <View style={[
            styles.handleDot,
            {
              top: (strokeWidth / 2) - 5,
              left: (size / 2) - 5,
              borderColor: gradientColors ? gradientColors[0] : color,
            }
          ]} />
        </Animated.View>
      )}

      {/* 5. Center content container */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          {children
            ? children
            : showPercentage && (
                <Text
                  style={{
                    fontSize: resolvedTextSize,
                    fontWeight: textWeight,
                    color: textColor,
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
                  }}
                >
                  {label}
                </Text>
              )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      }
    })
  }
});

export default React.memo(CircularProgress);
