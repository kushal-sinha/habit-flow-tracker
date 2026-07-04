import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Card, IconButton, Portal, Modal, Button, List, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabits } from '../hooks/useHabits';
import { tw } from '../utils/theme';
import { getCalendarGrid, parseDateString, WEEKDAYS, formatDateString, getTodayString } from '../utils/dateUtils';
import { isHabitScheduled } from '../utils/streakUtils';
import { Habit } from '../types';

export const CalendarScreen: React.FC = () => {
  const { habits, history, todayStr } = useHabits();

  // Current calendar view year and month
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Modal details state
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to determine the completion status and color of a date cell
  const getDateStatusColor = (dateStr: string): { bg: string; text: string; label: string } => {
    const activeHabits = habits.filter((h) => !h.isArchived);
    const dayHabits = activeHabits.filter((h) => isHabitScheduled(h, dateStr));
    
    if (dayHabits.length === 0) {
      // No habits scheduled on this day
      return { bg: 'bg-transparent', text: 'text-iosSubtextLight dark:text-iosSubtextDark', label: 'empty' };
    }

    const dayCompletions = history.filter((e) => e.date === dateStr && e.completed);
    const completedCount = dayHabits.filter((h) => dayCompletions.some((c) => c.habitId === h.id)).length;

    if (completedCount === dayHabits.length) {
      // All completed -> Apple Emerald Green
      return { bg: 'bg-emerald text-white', text: 'text-white font-bold', label: 'all' };
    } else if (completedCount > 0) {
      // Partial completed -> Apple Amber Yellow
      return { bg: 'bg-amber text-iosTextLight dark:text-iosBgDark', text: 'text-iosTextLight dark:text-iosBgDark font-bold', label: 'partial' };
    } else {
      // None completed / skipped -> Gray
      return { bg: 'bg-iosBorderLight dark:bg-iosBorderDark', text: 'text-iosTextLight dark:text-iosTextDark', label: 'missed' };
    }
  };

  const handleDayPress = (dateStr: string | null) => {
    if (!dateStr) return;
    setSelectedDateStr(dateStr);
    setModalVisible(true);
  };

  // Generate calendar grid
  const calendarCells = getCalendarGrid(year, month);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Prepare habits lists for selected day popup drawer
  const getSelectedDayHabits = () => {
    if (!selectedDateStr) return [];
    const activeHabits = habits.filter((h) => !h.isArchived);
    
    return activeHabits.map((habit) => {
      const isScheduled = isHabitScheduled(habit, selectedDateStr);
      const isCompleted = history.some(
        (e) => e.habitId === habit.id && e.date === selectedDateStr && e.completed
      );
      
      return {
        habit,
        isScheduled,
        isCompleted,
      };
    });
  };

  const selectedDayData = getSelectedDayHabits();
  const scheduledOnSelectedDay = selectedDayData.filter((d) => d.isScheduled);

  return (
    <View style={tw`flex-1 bg-iosBgLight dark:bg-iosBgDark`}>
      <ScrollView contentContainerStyle={tw`px-5 pt-8 pb-10`}>
        {/* Month Navigation Title Header */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <Text style={tw`text-2xl font-black text-iosTextLight dark:text-iosTextDark`}>
            {monthNames[month]} {year}
          </Text>
          <View style={tw`flex-row`}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={handlePrevMonth}
              iconColor={tw.color('iosTextLight')}
              style={tw`m-0`}
            />
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={handleNextMonth}
              iconColor={tw.color('iosTextLight')}
              style={tw`m-0 ml-1`}
            />
          </View>
        </View>

        {/* Legend Indicator */}
        <Surface style={tw`flex-row justify-around p-3.5 rounded-2xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`h-3.5 w-3.5 rounded-full bg-emerald mr-1.5`} />
            <Text style={tw`text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark uppercase tracking-wider`}>All Done</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <View style={tw`h-3.5 w-3.5 rounded-full bg-amber mr-1.5`} />
            <Text style={tw`text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark uppercase tracking-wider`}>Partial</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <View style={tw`h-3.5 w-3.5 rounded-full bg-iosBorderLight dark:bg-iosBorderDark mr-1.5`} />
            <Text style={tw`text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark uppercase tracking-wider`}>Missed</Text>
          </View>
        </Surface>

        {/* Calendar Grid Card */}
        <Card style={tw`p-4 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark shadow-sm mb-6`}>
          {/* Weekday Names Header */}
          <View style={tw`flex-row justify-between mb-4 border-b border-iosBorderLight dark:border-iosBorderDark pb-2`}>
            {WEEKDAYS.map((day) => (
              <Text
                key={day}
                style={tw`w-10 text-center text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark uppercase tracking-wider`}
              >
                {day.slice(0, 2)}
              </Text>
            ))}
          </View>

          {/* Monthly Days Cells */}
          <View style={tw`flex-row flex-wrap justify-between`}>
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateString === todayStr;
              const status = cell.dateString ? getDateStatusColor(cell.dateString) : null;
              
              return (
                <TouchableOpacity
                  key={idx}
                  disabled={!cell.dateString}
                  onPress={() => handleDayPress(cell.dateString)}
                  style={tw`w-10 h-10 items-center justify-center mb-2.5 rounded-xl`}
                >
                  {cell.dateString ? (
                    <View style={[
                      tw`w-8.5 h-8.5 rounded-xl items-center justify-center`,
                      status ? tw`${status.bg}` : null,
                      isToday && !status?.bg.includes('bg-') 
                        ? tw`border-2 border-indigo` 
                        : null
                    ]}>
                      <Text style={[
                        tw`text-sm font-medium`,
                        status ? tw`${status.text}` : tw`text-iosTextLight dark:text-iosTextDark`,
                        !cell.isCurrentMonth && tw`opacity-20`
                      ]}>
                        {cell.dayNumber}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      {/* Date Detail View Modal Drawer */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={tw`bg-iosBgLight dark:bg-iosBgDark m-5 p-6 rounded-3xl border border-iosBorderLight dark:border-iosBorderDark`}
        >
          <Text style={tw`text-xl font-black text-iosTextLight dark:text-iosTextDark mb-2`}>
            {selectedDateStr ? parseDateString(selectedDateStr).toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) : ''}
          </Text>
          <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark mb-4`}>
            Completed habits history record (Read-Only)
          </Text>

          <ScrollView style={tw`max-h-80 mb-4`}>
            {scheduledOnSelectedDay.length > 0 ? (
              scheduledOnSelectedDay.map(({ habit, isCompleted }) => (
                <Card 
                  key={habit.id}
                  style={tw`mb-2.5 rounded-xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark shadow-sm`}
                >
                  <View style={tw`flex-row justify-between items-center py-2 px-3`}>
                    <View style={tw`flex-row items-center flex-1 pr-2`}>
                      <Text style={tw`text-lg mr-2`}>{habit.emoji}</Text>
                      <Text style={tw`text-sm font-bold text-iosTextLight dark:text-iosTextDark`} numberOfLines={1}>
                        {habit.title}
                      </Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                      <MaterialCommunityIcons
                        name={isCompleted ? 'checkbox-marked-circle' : 'close-circle-outline'}
                        size={22}
                        color={isCompleted ? tw.color('emerald') : tw.color('coral')}
                      />
                      <Text style={[
                        tw`text-xs font-bold ml-1`,
                        isCompleted ? tw`text-emerald` : tw`text-coral`
                      ]}>
                        {isCompleted ? 'Completed' : 'Skipped'}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <View style={tw`items-center justify-center py-6`}>
                <Text style={tw`text-3xl mb-2`}>💤</Text>
                <Text style={tw`text-sm font-semibold text-iosSubtextLight dark:text-iosSubtextDark`}>
                  No habits scheduled on this day
                </Text>
              </View>
            )}
          </ScrollView>

          <Button 
            mode="contained" 
            onPress={() => setModalVisible(false)}
            style={tw`bg-indigo rounded-xl`}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};
