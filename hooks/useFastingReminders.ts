import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SCHEDULE_STORAGE_KEY = "@kairos/fasting_schedule";
const NOTIFICATION_IDS_KEY = "@kairos/fasting_notification_ids";

// expo-notifications weekday: Sunday = 1 ... Saturday = 7
const DAY_TO_WEEKDAY_NUM: Record<string, number> = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

const DEFAULT_HOUR_24 = 6; // 6:00 AM
const DEFAULT_MINUTE = 0;

export interface FastingSchedule {
  selectedDays: string[];
  dailyFast: boolean;
  reminderHour: number; // 0-23 (24hr, stored form)
  reminderMinute: number; // 0-59
}

// ─── 12hr <-> 24hr helpers (for the UI dropdowns) ───────────────────────────

export function to12Hour(hour24: number): { hour12: number; period: "AM" | "PM" } {
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

export function to24Hour(hour12: number, period: "AM" | "PM"): number {
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  return hour24;
}

// ─── Persisted schedule ─────────────────────────────────────────────────────

/** Read the persisted schedule (used by settings.tsx / FastingScreen to show what's currently set). */
export async function getFastingSchedule(): Promise<FastingSchedule> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selectedDays: parsed.selectedDays ?? [],
        dailyFast: parsed.dailyFast ?? false,
        reminderHour: parsed.reminderHour ?? DEFAULT_HOUR_24,
        reminderMinute: parsed.reminderMinute ?? DEFAULT_MINUTE,
      };
    }
  } catch (e) {
    console.error("[Kairos] Failed to read fasting schedule:", e);
  }
  return {
    selectedDays: [],
    dailyFast: false,
    reminderHour: DEFAULT_HOUR_24,
    reminderMinute: DEFAULT_MINUTE,
  };
}

async function cancelExistingReminders() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(
        ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
      );
    }
  } catch (e) {
    console.error("[Kairos] Failed to cancel existing reminders:", e);
  }
}

/**
 * Schedules (local) reminder notifications for the given weekdays, or daily,
 * at the given reminder time (24hr hour + minute).
 * Safe to call in Expo Go — this uses local scheduled notifications, not
 * remote push, so it isn't affected by the SDK 53 Expo Go push removal.
 */
export async function scheduleFastingReminders(
  selectedDays: string[],
  dailyFast: boolean,
  reminderHour: number = DEFAULT_HOUR_24,
  reminderMinute: number = DEFAULT_MINUTE,
): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("[Kairos] Notification permission not granted, skipping reminder scheduling.");
      return;
    }

    await cancelExistingReminders();

    const newIds: string[] = [];

    if (dailyFast) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to fast 🙏",
          body: "Today's your fasting day. Deny yourself, draw near.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminderHour,
          minute: reminderMinute,
        },
      });
      newIds.push(id);
    } else {
      for (const day of selectedDays) {
        const weekday = DAY_TO_WEEKDAY_NUM[day];
        if (!weekday) continue;
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to fast 🙏",
            body: "Today's your fasting day. Deny yourself, draw near.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: reminderHour,
            minute: reminderMinute,
          },
        });
        newIds.push(id);
      }
    }

    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(newIds));
    await AsyncStorage.setItem(
      SCHEDULE_STORAGE_KEY,
      JSON.stringify({ selectedDays, dailyFast, reminderHour, reminderMinute }),
    );
  } catch (e) {
    console.error("[Kairos] Failed to schedule fasting reminders:", e);
  }
}
