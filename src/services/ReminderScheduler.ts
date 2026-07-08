import { UserSettings, Habit, HistoryEntry } from '../types';
import { NotificationService } from './NotificationService';
import { getLogicalResetDate, parseResetTime } from '../utils/TimeWindowCalculator';
import { isHabitScheduled } from '../utils/streakUtils';
import { addDays, parseDateString } from '../utils/dateUtils';

/**
 * Dynamically plans and schedules notifications based on completion state.
 */
export async function scheduleReminders(
  settings: UserSettings,
  habits: Habit[],
  history: HistoryEntry[],
  currentTime: Date = new Date()
): Promise<void> {
  // 1. If notifications are disabled globally, cancel all and return
  if (!settings.notificationsEnabled) {
    await NotificationService.cancelAllNotifications();
    return;
  }

  // 2. Request OS permissions
  const hasPermission = await NotificationService.requestPermissions();
  if (!hasPermission) {
    return;
  }

  // 3. Cancel existing notifications to overwrite with fresh ones
  await NotificationService.cancelAllNotifications();

  // 4. Calculate today's logical date
  const logicalToday = getLogicalResetDate(currentTime, settings.dailyResetTime);
  const activeHabits = habits.filter((h) => !h.isArchived);
  const scheduledHabits = activeHabits.filter((h) => isHabitScheduled(h, logicalToday));
  const totalCount = scheduledHabits.length;

  if (totalCount === 0) {
    // If no habits are scheduled for today, we only schedule tomorrow's reminders
    await scheduleNextDayReminders(settings, currentTime);
    return;
  }

  // Find completions for today
  const todayCompletions = history.filter(
    (e) => e.date === logicalToday && e.completed && e.userId === settings.userId
  );
  const completedIds = new Set(todayCompletions.map((c) => c.habitId));
  const completedCount = scheduledHabits.filter((h) => completedIds.has(h.id)).length;
  const isGoalCompletedToday = completedCount === totalCount;

  // 5. Parse time settings
  const [morningHour, morningMinute] = settings.notificationTime.split(':').map(Number);
  const mHour = isNaN(morningHour) ? 9 : morningHour;
  const mMinute = isNaN(morningMinute) ? 0 : morningMinute;

  const { hours: resetHours, minutes: resetMinutes } = parseResetTime(settings.dailyResetTime);
  
  // Calculate final reminder (1 hour before reset)
  let finalHour = resetHours - 1;
  let finalMinute = resetMinutes;
  if (finalHour < 0) {
    finalHour += 24;
  }

  // Helper to make Date object on today's calendar date
  const getTodayTime = (hours: number, minutes: number): Date => {
    const d = new Date(currentTime);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  if (isGoalCompletedToday) {
    // 🎉 TODAY IS COMPLETED: We do not schedule reminders for today, and pre-schedule tomorrow's reminders.
    await scheduleNextDayReminders(settings, currentTime);
  } else {
    // ⏰ TODAY IS INCOMPLETE: Schedule today's remaining reminders
    const nowMs = currentTime.getTime();

    // Morning reminder (Configured time, default 9:00 AM)
    const morningDate = getTodayTime(mHour, mMinute);
    if (morningDate.getTime() > nowMs) {
      await NotificationService.scheduleNotification(
        '🌞 Ready for another great day?',
        "Let's keep your streak alive.",
        morningDate
      );
    }

    // Afternoon reminder (2:00 PM) - only if completed count is 0
    if (completedCount === 0) {
      const afternoonDate = getTodayTime(14, 0);
      if (afternoonDate.getTime() > nowMs) {
        await NotificationService.scheduleNotification(
          '🔥 Keep the focus',
          "You haven't started today's habits yet. Even five minutes today makes a difference.",
          afternoonDate
        );
      }
    }

    // Evening reminder (7:30 PM) - only if partially complete (completedCount > 0)
    if (completedCount > 0 && completedCount < totalCount) {
      const eveningDate = getTodayTime(19, 30);
      if (eveningDate.getTime() > nowMs) {
        await NotificationService.scheduleNotification(
          '✨ Keep Going',
          `You're almost there. Only ${totalCount - completedCount} habits remaining.`,
          eveningDate
        );
      }
    }

    // Final reminder (1 hour before reset)
    const finalReminderDate = getTodayTime(finalHour, finalMinute);
    if (finalReminderDate.getTime() > nowMs) {
      await NotificationService.scheduleNotification(
        '⏰ Final Reminder',
        `Complete today's habits before ${settings.dailyResetTime || 'midnight'} to continue your streak. This is the final reminder for today.`,
        finalReminderDate
      );
    }

    // Pre-schedule tomorrow morning's reminder just as a fallback in case they miss today's goal
    const tomorrowMorning = new Date(currentTime);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(mHour, mMinute, 0, 0);
    await NotificationService.scheduleNotification(
      '🌞 Ready for another great day?',
      "Let's keep your streak alive.",
      tomorrowMorning
    );
  }
}

/**
 * Schedules all reminders for the next calendar day.
 */
async function scheduleNextDayReminders(settings: UserSettings, currentTime: Date): Promise<void> {
  const [morningHour, morningMinute] = settings.notificationTime.split(':').map(Number);
  const mHour = isNaN(morningHour) ? 9 : morningHour;
  const mMinute = isNaN(morningMinute) ? 0 : morningMinute;

  const { hours: resetHours, minutes: resetMinutes } = parseResetTime(settings.dailyResetTime);
  let finalHour = resetHours - 1;
  let finalMinute = resetMinutes;
  if (finalHour < 0) {
    finalHour += 24;
  }

  // Helper to make Date object on tomorrow's calendar date
  const getTomorrowTime = (hours: number, minutes: number): Date => {
    const d = new Date(currentTime);
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // Morning reminder
  await NotificationService.scheduleNotification(
    '🌞 Ready for another great day?',
    "Let's keep your streak alive.",
    getTomorrowTime(mHour, mMinute)
  );

  // Afternoon reminder (2:00 PM) - defaults to 0 completed on start of new day
  await NotificationService.scheduleNotification(
    '🔥 Keep the focus',
    "You haven't started today's habits yet. Even five minutes today makes a difference.",
    getTomorrowTime(14, 0)
  );

  // Evening reminder (7:30 PM)
  await NotificationService.scheduleNotification(
    '✨ Keep Going',
    "You're almost there. Complete today's habits to protect your streak.",
    getTomorrowTime(19, 30)
  );

  // Final reminder
  await NotificationService.scheduleNotification(
    '⏰ Final Reminder',
    `Complete today's habits before ${settings.dailyResetTime || 'midnight'} to continue your streak. This is the final reminder for today.`,
    getTomorrowTime(finalHour, finalMinute)
  );
}

/**
 * Immediately triggers a local celebration alert for finishing today's goal.
 */
export async function triggerCompletionNotification(): Promise<void> {
  await NotificationService.scheduleNotification(
    '🎉 Amazing work!',
    "Today's streak is secured. See you tomorrow.",
    new Date(Date.now() + 1000) // 1 second in the future
  );
}
