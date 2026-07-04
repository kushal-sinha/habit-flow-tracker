import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { create } from 'twrnc';

// Custom tailwind configuration matching modern Apple color schemes
export const tw = create({
  theme: {
    extend: {
      colors: {
        iosBgLight: '#F5F5F7',
        iosBgDark: '#0A0A0C',
        iosCardLight: '#FFFFFF',
        iosCardDark: '#161618',
        iosTextLight: '#1C1C1E',
        iosTextDark: '#F5F5F7',
        iosSubtextLight: '#8E8E93',
        iosSubtextDark: '#9A9A9F',
        iosBorderLight: '#E5E5EA',
        iosBorderDark: '#2C2C2E',
        
        // Premium Apple accents
        coral: '#FF453A', 
        emerald: '#34C759', 
        indigo: '#5E5CE6', 
        sky: '#0A84FF', 
        amber: '#FFD60A', 
        purple: '#BF5AF2', 
      },
    },
  },
});

// React Native Paper theme overrides for Material Design 3 matching our premium design system
export const paperLightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#5E5CE6', // Calming Indigo
    secondary: '#0A84FF', // Apple Sky Blue
    background: '#F5F5F7', // iOS Light Background
    surface: '#FFFFFF', // iOS Light Card
    surfaceVariant: '#E5E5EA', // iOS Border/Input Light
    onSurface: '#1C1C1E',
    onSurfaceVariant: '#8E8E93',
    outline: '#E5E5EA',
    error: '#FF453A',
  },
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5E5CE6', // Calming Indigo
    secondary: '#0A84FF', // Apple Sky Blue
    background: '#0A0A0C', // iOS Dark Background
    surface: '#161618', // iOS Dark Card
    surfaceVariant: '#2C2C2E', // iOS Border/Input Dark
    onSurface: '#F5F5F7',
    onSurfaceVariant: '#9A9A9F',
    outline: '#2C2C2E',
    error: '#FF453A',
  },
};
