// Local (on-device) notifications for visit reminders.
// NOTE: even if the OS notification is dismissed from the phone's tray,
// the reminder still lives in the in-app Reminders screen (data in store.ts).

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show the notification even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Visit reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return granted;
}

export async function scheduleVisitReminder(
  title: string,
  body: string,
  date: Date
): Promise<string | undefined> {
  // Don't try to schedule something in the past.
  if (date.getTime() <= Date.now()) return undefined;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: 'reminders',
      },
    });
  } catch {
    // If scheduling isn't available (e.g. limited support in Expo Go),
    // the in-app Reminders list still records the visit.
    return undefined;
  }
}

export async function cancelScheduled(id?: string): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}
