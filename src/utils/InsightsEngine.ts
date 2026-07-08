import { Habit, HistoryEntry } from '../types';

export interface DynamicInsight {
  id: string;
  type: 'insight' | 'recommendation';
  title: string;
  message: string;
}

export function generateInsights(habits: Habit[], history: HistoryEntry[]): DynamicInsight[] {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const completedEntries = history.filter((e) => e.completed);

  // Fallback if not enough data
  if (activeHabits.length === 0 || completedEntries.length < 5) {
    return [
      {
        id: 'no_data_insight',
        type: 'insight',
        title: '🌱 Insights Engine Warming Up',
        message: 'Complete at least 5 habits to unlock personalized, data-driven daily growth insights!',
      },
      {
        id: 'no_data_rec',
        type: 'recommendation',
        title: '💡 Smart Tip',
        message: 'Try scheduling your first habit in the morning to start your day with a win!',
      },
    ];
  }

  const insights: DynamicInsight[] = [];

  // 1. Identify Most Consistent Habit
  const completionCounts: { [habitId: string]: number } = {};
  completedEntries.forEach((e) => {
    completionCounts[e.habitId] = (completionCounts[e.habitId] || 0) + 1;
  });

  let bestHabitId = '';
  let maxCompletions = 0;
  Object.keys(completionCounts).forEach((id) => {
    if (completionCounts[id] > maxCompletions) {
      maxCompletions = completionCounts[id];
      bestHabitId = id;
    }
  });

  const bestHabit = activeHabits.find((h) => h.id === bestHabitId);
  if (bestHabit && maxCompletions >= 3) {
    insights.push({
      id: 'best_habit',
      type: 'insight',
      title: '🌟 Anchor Habit Found',
      message: `"${bestHabit.title}" is your most consistent habit, with ${maxCompletions} completions. Keep it up!`,
    });
  }

  // 2. Identify Completion Time Preferences (Morning vs Evening)
  let morningCount = 0;
  let eveningCount = 0;
  completedEntries.forEach((e) => {
    if (!e.completedAt || e.completedAt === 'shield_protected') return;
    try {
      const hour = new Date(e.completedAt).getHours();
      if (hour < 12) morningCount++;
      if (hour >= 18) eveningCount++;
    } catch {}
  });

  if (morningCount > eveningCount && morningCount >= 3) {
    const pct = Math.round((morningCount / (morningCount + eveningCount || 1)) * 100);
    insights.push({
      id: 'morning_preference',
      type: 'insight',
      title: '🌞 Morning Productive Peak',
      message: `You complete ${pct}% of your habits in the morning. Morning tasks work best for your flow.`,
    });
    // Add time-sensitive recommendation
    insights.push({
      id: 'morning_recommendation',
      type: 'recommendation',
      title: '⚡ Habit Stacking Recommendation',
      message: 'Try shifting complex tasks or meditation right after breakfast for maximum consistency.',
    });
  } else if (eveningCount > morningCount && eveningCount >= 3) {
    const pct = Math.round((eveningCount / (morningCount + eveningCount || 1)) * 100);
    insights.push({
      id: 'evening_preference',
      type: 'insight',
      title: '🌙 Night Owl Flow',
      message: `You complete ${pct}% of your habits after 6:00 PM. Night routines are your peak focus zone.`,
    });
  }

  // 3. Identify Most Missed Day / Weak Spot
  const dayMissCounts: { [day: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  
  // We check which days have the most skips (unscheduled or left empty)
  // Let's count completion entries by day of the week
  const dayCompletionCounts: { [day: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  completedEntries.forEach((e) => {
    try {
      const day = new Date(e.date).getDay();
      dayCompletionCounts[day]++;
    } catch {}
  });

  let worstDayIndex = -1;
  let minCompletions = Infinity;
  let totalCompletions = 0;

  Object.keys(dayCompletionCounts).forEach((dayStr) => {
    const day = parseInt(dayStr);
    totalCompletions += dayCompletionCounts[day];
    if (dayCompletionCounts[day] < minCompletions) {
      minCompletions = dayCompletionCounts[day];
      worstDayIndex = day;
    }
  });

  // Only highlight worst day if there's a clear discrepancy and enough history
  if (worstDayIndex !== -1 && totalCompletions >= 10 && minCompletions < totalCompletions / 12) {
    insights.push({
      id: 'weak_day',
      type: 'insight',
      title: '📈 Consistency Dip',
      message: `Your completions tend to drop on ${dayNames[worstDayIndex]}. Keep an eye on your routine that day!`,
    });
    insights.push({
      id: 'weak_day_rec',
      type: 'recommendation',
      title: '🛡️ Reset Protection Alert',
      message: `Reduce your weekend friction: try checking off water intake or simple habits first on ${dayNames[worstDayIndex]}.`,
    });
  }

  // Fallbacks to ensure we always return at least 2 insights
  if (insights.length < 2) {
    insights.push({
      id: 'general_insight',
      type: 'insight',
      title: '📈 Trend Steady',
      message: 'Your overall habit compliance score is building nicely. Consistency is cumulative!',
    });
    insights.push({
      id: 'general_rec',
      type: 'recommendation',
      title: '💡 Placement Tip',
      message: 'Pair a hard habit directly after a fully secured habit (like drinking water) to anchor it.',
    });
  }

  return insights;
}
