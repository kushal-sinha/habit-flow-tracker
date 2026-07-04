import React, { useState } from 'react';
import { useColorScheme, StatusBar as RNStatusBar } from 'react-native';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { PaperProvider } from 'react-native-paper';
import { tokenCache } from './src/utils/tokenCache';
import { HabitsProvider, useHabits } from './src/hooks/useHabits';
import { paperLightTheme, paperDarkTheme } from './src/utils/theme';
import { AuthScreen } from './src/screens/AuthScreen';
import { MainLayout } from './src/screens/MainLayout';
import { StatusBar } from 'expo-status-bar';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

function AppContent({ isGuestMode, setIsGuestMode }: { isGuestMode: boolean; setIsGuestMode: (val: boolean) => void }) {
  const { isSignedIn } = useAuth();
  const { settings } = useHabits();
  const systemColorScheme = useColorScheme();
  
  // Resolve system vs manual light/dark theme preference
  const resolvedTheme = settings.theme === 'system'
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : settings.theme;
    
  const paperTheme = resolvedTheme === 'dark' ? paperDarkTheme : paperLightTheme;
  
  // Update native status bar to match theme
  React.useEffect(() => {
    RNStatusBar.setBarStyle(resolvedTheme === 'dark' ? 'light-content' : 'dark-content');
  }, [resolvedTheme]);

  // If user is not authenticated and did not select Guest bypass, show login screen
  if (!isSignedIn && !isGuestMode) {
    return (
      <PaperProvider theme={paperTheme}>
        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
        <AuthScreen onContinueAsGuest={() => setIsGuestMode(true)} />
      </PaperProvider>
    );
  }
  
  // Otherwise show the authenticated dashboard layout
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <MainLayout onSignOut={() => setIsGuestMode(false)} />
    </PaperProvider>
  );
}

export default function App() {
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <HabitsProvider>
        <AppContent isGuestMode={isGuestMode} setIsGuestMode={setIsGuestMode} />
      </HabitsProvider>
    </ClerkProvider>
  );
}
