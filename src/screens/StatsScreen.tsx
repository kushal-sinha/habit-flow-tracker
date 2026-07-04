import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { useHabits } from '../hooks/useHabits';
import { tw } from '../utils/theme';
import { getTodayString, getLastNDays, getWeekdayAbbreviation, addDays } from '../utils/dateUtils';
import { calculateHabitStats, isHabitScheduled } from '../utils/streakUtils';

export const StatsScreen: React.FC = () => {
  const { habits, history, todayStr } = useHabits();
  const activeHabits = habits.filter((h) => !h.isArchived);

  // High-level statistics calculation
  const totalCompletedCount = history.filter((e) => e.completed).length;
  const totalMissedCount = history.filter((e) => !e.completed).length;

  // Calculate overall consistency percentage
  const totalHabitsCompletionsExpected = () => {
    let expected = 0;
    activeHabits.forEach((habit) => {
      const stats = calculateHabitStats(habit, history, todayStr);
      // Scheduled days
      expected += Math.round(stats.totalCompleted / (stats.completionRate / 100 || 1));
    });
    return expected || 0;
  };

  const overallCompletionRate = () => {
    if (activeHabits.length === 0) return 0;
    let sumRate = 0;
    activeHabits.forEach((h) => {
      const stats = calculateHabitStats(h, history, todayStr);
      sumRate += stats.completionRate;
    });
    return Math.round(sumRate / activeHabits.length);
  };

  // Find most successful and skipped habits
  const getInsights = () => {
    if (activeHabits.length === 0) {
      return { successful: 'N/A', skipped: 'N/A' };
    }
    
    let bestHabitName = 'N/A';
    let bestRate = -1;
    let worstHabitName = 'N/A';
    let worstSkips = -1;

    activeHabits.forEach((habit) => {
      const stats = calculateHabitStats(habit, history, todayStr);
      
      // Success comparison
      if (stats.completionRate > bestRate) {
        bestRate = stats.completionRate;
        bestHabitName = `${habit.emoji} ${habit.title}`;
      }
      
      // Skip comparison
      if (stats.missedDays > worstSkips) {
        worstSkips = stats.missedDays;
        worstHabitName = `${habit.emoji} ${habit.title}`;
      }
    });

    return {
      successful: bestRate > 0 ? `${bestHabitName} (${bestRate}%)` : 'None yet',
      skipped: worstSkips > 0 ? `${worstHabitName} (${worstSkips} missed)` : 'None yet',
    };
  };

  const insights = getInsights();

  // Weekly performance chart helper (last 7 days)
  const getWeeklyData = () => {
    const last7Days = getLastNDays(7);
    return last7Days.map((dateStr) => {
      const dayHabits = activeHabits.filter((h) => isHabitScheduled(h, dateStr));
      if (dayHabits.length === 0) return { dateStr, label: getWeekdayAbbreviation(dateStr), percent: 0 };
      
      const completions = history.filter((e) => e.date === dateStr && e.completed);
      const completedCount = dayHabits.filter((h) => completions.some((c) => c.habitId === h.id)).length;
      const percent = Math.round((completedCount / dayHabits.length) * 100);
      
      return {
        dateStr,
        label: getWeekdayAbbreviation(dateStr).toUpperCase().slice(0, 1),
        percent,
      };
    });
  };

  const weeklyData = getWeeklyData();

  // Heatmap helper (last 12 weeks = 84 days)
  const getHeatmapData = () => {
    const totalDays = 12 * 7; // 84 days
    const result = [];
    const today = getTodayString();
    
    for (let i = totalDays - 1; i >= 0; i--) {
      const dateStr = addDays(today, -i);
      const dayHabits = activeHabits.filter((h) => isHabitScheduled(h, dateStr));
      
      if (dayHabits.length === 0) {
        result.push({ dateStr, level: 'empty' }); // No scheduled habits
      } else {
        const completions = history.filter((e) => e.date === dateStr && e.completed);
        const completedCount = dayHabits.filter((h) => completions.some((c) => c.habitId === h.id)).length;
        
        if (completedCount === dayHabits.length) {
          result.push({ dateStr, level: 'all' }); // 100% completed
        } else if (completedCount > 0) {
          result.push({ dateStr, level: 'partial' }); // partial completed
        } else {
          result.push({ dateStr, level: 'missed' }); // 0% completed
        }
      }
    }
    return result;
  };

  const heatmapData = getHeatmapData();

  // Render heatmap cell color mappings
  const getHeatmapCellColor = (level: string) => {
    switch (level) {
      case 'all': return 'bg-emerald';
      case 'partial': return 'bg-amber';
      case 'missed': return 'bg-iosBorderLight dark:bg-iosBorderDark';
      case 'empty': default: return 'bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight/50 dark:border-iosBorderDark/50';
    }
  };

  return (
    <View style={tw`flex-1 bg-iosBgLight dark:bg-iosBgDark`}>
      <ScrollView contentContainerStyle={tw`px-5 pt-8 pb-10`}>
        {/* Title Header */}
        <View style={tw`mb-5`}>
          <Text style={tw`text-2xl font-black tracking-tight text-iosTextLight dark:text-iosTextDark`}>
            Analytics & Progress
          </Text>
        </View>

        {/* Metrics Grid */}
        <View style={tw`flex-row flex-wrap justify-between mb-6`}>
          {/* Card: Total Completed */}
          <Surface style={tw`w-[47%] p-4 rounded-2xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-4 items-center shadow-sm`}>
            <Text style={tw`text-2xl font-black text-iosTextLight dark:text-iosTextDark`}>
              {totalCompletedCount}
            </Text>
            <Text style={tw`text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark mt-1 uppercase tracking-wider text-center`}>
              Total Completed
            </Text>
          </Surface>

          {/* Card: Completion Rate */}
          <Surface style={tw`w-[47%] p-4 rounded-2xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-4 items-center shadow-sm`}>
            <Text style={tw`text-2xl font-black text-iosTextLight dark:text-iosTextDark`}>
              {overallCompletionRate()}%
            </Text>
            <Text style={tw`text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark mt-1 uppercase tracking-wider text-center`}>
              Consistency
            </Text>
          </Surface>

          {/* Card: Missed Days */}
          <Surface style={tw`w-[47%] p-4 rounded-2xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-4 items-center shadow-sm`}>
            <Text style={tw`text-2xl font-black text-iosTextLight dark:text-iosTextDark`}>
              {totalMissedCount}
            </Text>
            <Text style={tw`text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark mt-1 uppercase tracking-wider text-center`}>
              Missed Targets
            </Text>
          </Surface>

          {/* Card: Habits Tracked */}
          <Surface style={tw`w-[47%] p-4 rounded-2xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-4 items-center shadow-sm`}>
            <Text style={tw`text-2xl font-black text-iosTextLight dark:text-iosTextDark`}>
              {activeHabits.length}
            </Text>
            <Text style={tw`text-xxs font-bold text-iosSubtextLight dark:text-iosSubtextDark mt-1 uppercase tracking-wider text-center`}>
              Active Habits
            </Text>
          </Surface>
        </View>

        {/* Weekly Consistency Chart */}
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-5 uppercase tracking-wider`}>
            Weekly Performance
          </Text>
          
          <View style={tw`flex-row justify-between items-end h-28 px-2`}>
            {weeklyData.map((day, idx) => (
              <View key={idx} style={tw`items-center`}>
                {/* Percentage label */}
                <Text style={tw`text-xxs font-bold text-iosTextLight dark:text-iosTextDark mb-1`}>
                  {day.percent > 0 ? `${day.percent}%` : '0%'}
                </Text>
                {/* Bar */}
                <View style={tw`w-7 h-20 bg-iosBorderLight dark:bg-iosBorderDark rounded-full overflow-hidden justify-end`}>
                  <View 
                    style={[
                      tw`w-full bg-indigo rounded-full`, 
                      { height: `${day.percent}%` }
                    ]} 
                  />
                </View>
                {/* Day label */}
                <Text style={tw`text-xs font-semibold text-iosSubtextLight dark:text-iosSubtextDark mt-2`}>
                  {day.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Monthly Heatmap Card */}
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark mb-6 shadow-sm`}>
          <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-4 uppercase tracking-wider`}>
            12-Week Consistency Heatmap
          </Text>

          {/* Grid Layout (7 rows representing days of week, columns representing weeks) */}
          <View style={tw`flex-row`}>
            {/* Heatmap cells */}
            <View style={tw`flex-1 flex-row flex-wrap justify-between`}>
              {heatmapData.map((cell, idx) => (
                <View
                  key={idx}
                  style={[
                    tw`w-3.5 h-3.5 rounded-sm mb-1 mr-1`,
                    { width: `${100 / 14 - 1}%` }, // 12 weeks = ~14 cols to span cleanly
                    tw`${getHeatmapCellColor(cell.level)}`
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={tw`text-xxs text-iosSubtextLight dark:text-iosSubtextDark mt-2 text-right italic`}>
            Showing daily consistency grid from 12 weeks ago to today.
          </Text>
        </Card>

        {/* Insights Card */}
        <Card style={tw`p-5 rounded-3xl bg-iosCardLight dark:bg-iosCardDark border border-iosBorderLight dark:border-iosBorderDark shadow-sm`}>
          <Text style={tw`text-sm font-bold text-iosSubtextLight dark:text-iosSubtextDark mb-4 uppercase tracking-wider`}>
            Behavioral Insights
          </Text>

          <View style={tw`mb-4`}>
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark`}>MOST SUCCESSFUL ROUTINE</Text>
            <Text style={tw`text-base font-bold text-emerald mt-0.5`}>
              {insights.successful}
            </Text>
          </View>

          <View>
            <Text style={tw`text-xs text-iosSubtextLight dark:text-iosSubtextDark`}>MOST SKIPPED TARGET</Text>
            <Text style={tw`text-base font-bold text-coral mt-0.5`}>
              {insights.skipped}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};
