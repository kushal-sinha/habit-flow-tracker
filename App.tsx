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
import { CelebrationProvider } from './src/hooks/useCelebration';
import { CelebrationDialog } from './src/components/CelebrationDialog';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

function AppContent({ isGuestMode, setIsGuestMode }: { isGuestMode: boolean; setIsGuestMode: (val: boolean) => void }) {
  const { isSignedIn } = useAuth();
  const { settings } = useHabits();
  
  // Force premium dark mode as the default layout setting
  const resolvedTheme = 'dark';
  const paperTheme = paperDarkTheme;
  
  // Update native status bar to match dark theme
  React.useEffect(() => {
    RNStatusBar.setBarStyle('light-content');
  }, []);

  // If user is not authenticated and did not select Guest bypass, show login screen
  if (!isSignedIn && !isGuestMode) {
    return (
      <PaperProvider theme={paperTheme}>
        <StatusBar style="light" />
        <AuthScreen onContinueAsGuest={() => setIsGuestMode(true)} />
      </PaperProvider>
    );
  }
  
  // Otherwise show the authenticated dashboard layout
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="light" />
      <MainLayout onSignOut={() => setIsGuestMode(false)} />
    </PaperProvider>
  );
}

export default function App() {
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <HabitsProvider>
        <CelebrationProvider>
          <AppContent isGuestMode={isGuestMode} setIsGuestMode={setIsGuestMode} />
          <CelebrationDialog />
        </CelebrationProvider>
      </HabitsProvider>
    </ClerkProvider>
  );
}
