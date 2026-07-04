import React, { useState } from 'react';
import { View, SafeAreaView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabits } from '../hooks/useHabits';
import { tw } from '../utils/theme';
import { HomeScreen } from './HomeScreen';
import { CalendarScreen } from './CalendarScreen';
import { StatsScreen } from './StatsScreen';
import { ProfileScreen } from './ProfileScreen';

interface MainLayoutProps {
  onSignOut: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onSignOut }) => {
  const { loading } = useHabits();
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'stats' | 'profile'>('home');

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-iosBgLight dark:bg-iosBgDark`}>
        <ActivityIndicator size="large" color={tw.color('indigo')} />
        <Text style={tw`mt-4 text-iosSubtextLight dark:text-iosSubtextDark font-medium`}>
          Syncing local database...
        </Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'profile':
        return <ProfileScreen onSignOut={onSignOut} />;
      default:
        return <HomeScreen />;
    }
  };

  const tabs = [
    { id: 'home' as const, label: 'Today', activeIcon: 'checkbox-marked-circle', inactiveIcon: 'checkbox-marked-circle-outline' },
    { id: 'calendar' as const, label: 'Calendar', activeIcon: 'calendar-month', inactiveIcon: 'calendar-month-outline' },
    { id: 'stats' as const, label: 'Stats', activeIcon: 'chart-bar', inactiveIcon: 'chart-bar-stacked' },
    { id: 'profile' as const, label: 'Profile', activeIcon: 'account', inactiveIcon: 'account-outline' },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-iosBgLight dark:bg-iosBgDark`}>
      <View style={tw`flex-1`}>
        {/* Main Content Area */}
        <View style={tw`flex-grow pb-16`}>
          {renderContent()}
        </View>

        {/* Premium Apple-Style Floating Tab Bar */}
        <View style={[
          tw`absolute bottom-0 left-0 right-0 h-18 bg-iosCardLight/95 dark:bg-iosCardDark/95 border-t border-iosBorderLight dark:border-iosBorderDark flex-row justify-around items-center px-4`,
          styles.tabBarBlur
        ]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
                style={tw`items-center justify-center w-16 py-1`}
              >
                <MaterialCommunityIcons
                  name={(isActive ? tab.activeIcon : tab.inactiveIcon) as any}
                  size={24}
                  color={isActive ? tw.color('indigo') : tw.color('iosSubtextLight')}
                />
                <Text style={[
                  tw`text-xs mt-1 font-medium`,
                  isActive 
                    ? tw`text-indigo font-bold` 
                    : tw`text-iosSubtextLight dark:text-iosSubtextDark`
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabBarBlur: {
    // Mimics iOS frosted glass (glassmorphism) when content scrolls underneath
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      }
    })
  }
});
