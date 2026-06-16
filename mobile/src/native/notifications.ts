import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission and returns an Expo push token (or null when
 * unavailable, e.g. on a simulator or without a configured EAS projectId). The
 * token can be sent to the backend later to deliver remote reminders.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    return null;
  }

  const legacy = Constants as unknown as { easConfig?: { projectId?: string } };
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? legacy.easConfig?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch {
    return null;
  }
}

/**
 * Schedules a local notification at the given time. Local notifications work in
 * Expo Go and standalone builds without any server, so reminders fire on-device.
 */
export async function scheduleReminderNotification(
  title: string,
  body: string,
  when: Date,
): Promise<string | null> {
  if (when.getTime() <= Date.now()) {
    return null;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });
}

export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

/**
 * Cancels the pending local notification for a removed reminder so it never
 * fires. Reminders are scheduled with the reminder's title as the body and a
 * DATE trigger, so we match on body (and the trigger time when available).
 */
export async function cancelReminderNotification(reminderTitle: string, when: Date): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const targetMs = when.getTime();
    for (const item of scheduled) {
      if (item.content?.body !== reminderTitle) continue;

      const trigger = item.trigger as { date?: number | string } | null;
      const rawDate = trigger?.date;
      const triggerMs =
        rawDate == null ? null : typeof rawDate === "number" ? rawDate : new Date(rawDate).getTime();
      const sameTime = triggerMs == null || Math.abs(triggerMs - targetMs) < 60_000;

      if (sameTime) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch {
    // Best effort: if scheduled notifications can't be read, skip silently.
  }
}

/**
 * Ensures notification permission is granted (prompting once if needed) so that
 * on-device reminders can fire. Returns true when notifications are allowed.
 * This is independent of remote push tokens, which additionally require FCM.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}
