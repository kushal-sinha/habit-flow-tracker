import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { tw } from '../utils/theme';
import { useHabits } from '../hooks/useHabits';
import { HomeScreen } from './HomeScreen';
import { CalendarScreen } from './CalendarScreen';
import { StatsScreen } from './StatsScreen';
import { ProfileScreen } from './ProfileScreen';
import { triggerHaptic } from '../services/hapticService';

interface MainLayoutProps {
  onSignOut: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onSignOut }) => {
  const { loading } = useHabits();
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'stats' | 'profile'>('home');

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-iosBgLight dark:bg-[#0B0B12]`}>
        <ActivityIndicator size="large" color="#6C4DFF" />
        <Text style={tw`mt-4 text-iosSubtextLight dark:text-iosSubtextDark font-semibold`}>
          Syncing local database...
        </Text>
      </View>
    );
  }

  const tabs = [
    { id: 'home' as const, activeIcon: 'checkbox-marked-circle', inactiveIcon: 'checkbox-marked-circle-outline' },
    { id: 'calendar' as const, activeIcon: 'calendar-month', inactiveIcon: 'calendar-month-outline' },
    { id: 'stats' as const, activeIcon: 'chart-bar', inactiveIcon: 'chart-bar-stacked' },
    { id: 'profile' as const, activeIcon: 'account', inactiveIcon: 'account-outline' },
  ];

  return (
    <View style={tw`flex-1 bg-iosBgLight dark:bg-[#0B0B12]`}>
      {/* Main Content Area */}
      <View style={tw`flex-1`}>
        <View style={{ flex: 1, display: activeTab === 'home' ? 'flex' : 'none' }}>
          <HomeScreen onNavigateToStats={() => setActiveTab('stats')} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'calendar' ? 'flex' : 'none' }}>
          <CalendarScreen />
        </View>
        <View style={{ flex: 1, display: activeTab === 'stats' ? 'flex' : 'none' }}>
          <StatsScreen />
        </View>
        <View style={{ flex: 1, display: activeTab === 'profile' ? 'flex' : 'none' }}>
          <ProfileScreen onSignOut={onSignOut} />
        </View>
      </View>

      {/* Floating Apple-Style Blurred Tab Bar */}
      <View style={styles.tabBarContainer}>
        <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                triggerHaptic('light');
                setActiveTab(tab.id);
              }}
              activeOpacity={0.7}
              style={tw`items-center justify-center h-full w-14`}
            >
              <MaterialCommunityIcons
                name={(isActive ? tab.activeIcon : tab.inactiveIcon) as any}
                size={26}
                color={isActive ? '#7B5CFF' : '#7A7A88'}
              />
              {/* Soft glowing active underline */}
              {isActive ? (
                <View style={styles.activeIndicator} />
              ) : (
                <View style={tw`h-[3px] w-5 bg-transparent mt-1`} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 68,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(26, 27, 40, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      }
    })
  },
  activeIndicator: {
    height: 3,
    width: 20,
    backgroundColor: '#7B5CFF',
    borderRadius: 2,
    marginTop: 4,
    // Glowing underline
    shadowColor: '#7B5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
});
