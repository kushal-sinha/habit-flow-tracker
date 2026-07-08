import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up default handler so notifications display even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  /**
   * Request local notification permissions from the OS.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: askStatus } = await Notifications.requestPermissionsAsync();
        return askStatus === 'granted';
      }
      return true;
    } catch (e) {
      console.warn('[NotificationService] Permission check failed:', e);
      return false;
    }
  },

  /**
   * Cancels all scheduled local notifications.
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('[NotificationService] Cancel all failed:', e);
    }
  },

  /**
   * Schedules a one-off local notification at the target date.
   */
  async scheduleNotification(title: string, body: string, date: Date): Promise<string | null> {
    // Avoid scheduling dates in the past
    if (date.getTime() <= Date.now()) {
      return null;
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default_reminders', {
          name: 'Habit Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7A5CFF',
        });
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: 'default_reminders',
        } as any,
      });
      return identifier;
    } catch (error) {
      console.error('[NotificationService] Error scheduling notification:', error);
      return null;
    }
  },
};
