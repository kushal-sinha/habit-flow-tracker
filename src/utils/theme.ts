import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { create } from 'twrnc';

// Custom tailwind configuration matching modern premium dark schemes
export const tw = create({
  theme: {
    extend: {
      colors: {
        iosBgLight: '#0D0F17',
        iosBgDark: '#0D0F17',
        iosCardLight: '#1A1C28',
        iosCardDark: '#1A1C28',
        iosTextLight: '#FFFFFF',
        iosTextDark: '#FFFFFF',
        iosSubtextLight: '#D3D4E0',
        iosSubtextDark: '#D3D4E0',
        iosBorderLight: 'rgba(255, 255, 255, 0.05)',
        iosBorderDark: 'rgba(255, 255, 255, 0.05)',
        
        // Premium Apple accents
        coral: '#FF453A', 
        emerald: '#34C759', 
        indigo: '#7A5CFF', 
        sky: '#0A84FF', 
        amber: '#FFD60A', 
        purple: '#7A5CFF', 

        // V2 Purple Theme Accents
        primaryPurple: '#7A5CFF',
        secondaryPurple: '#906EFF',
        lightPurple: '#B497FF',
        accentPurple: '#7B5CFF',
        accentIndigo: '#6945FF',
      },
    },
  },
});

// React Native Paper theme overrides for Material Design 3 matching our premium design system
export const paperLightTheme = {
  ...MD3LightTheme,
  dark: true,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7A5CFF', // Premium V2 Purple
    secondary: '#0A84FF', // Apple Sky Blue
    background: '#0D0F17', // iOS Dark Background
    surface: '#1A1C28', // iOS Dark Card
    surfaceVariant: 'rgba(255, 255, 255, 0.05)', // iOS Border/Input Dark
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#D3D4E0',
    outline: 'rgba(255, 255, 255, 0.05)',
    error: '#FF453A',
  },
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7A5CFF', // Premium V2 Purple
    secondary: '#0A84FF', // Apple Sky Blue
    background: '#0D0F17', // iOS Dark Background
    surface: '#1A1C28', // iOS Dark Card
    surfaceVariant: 'rgba(255, 255, 255, 0.05)', // iOS Border/Input Dark
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#D3D4E0',
    outline: 'rgba(255, 255, 255, 0.05)',
    error: '#FF453A',
  },
};
