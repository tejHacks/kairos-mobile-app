import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrayerHour {
  id: string;
  name: string;
  subtitle: string;
  time: string; // "HH:MM" 24h
  enabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@kairos/prayer_times";
const SETTINGS_KEY = "@kairos/settings";

export type NotificationSound =
  | "default"
  | "bells"
  | "soft_chime"
  | "harp"
  | "custom";

export interface NotificationPreferences {
  remindersEnabled: boolean;
  soundEnabled: boolean;
  sound: NotificationSound;
  customSoundUri?: string;
  customSoundName?: string;
}

const DEFAULT_NOTIFICATION_SOUND: NotificationSound = "default";

// 3 presets shown on first install — user can edit/delete/add freely
export const DEFAULT_HOURS: PrayerHour[] = [
  {
    id: "morning",
    name: "Morning Prayer",
    subtitle: "Start the day with God",
    time: "06:00",
    enabled: true,
  },
  {
    id: "midday",
    name: "Midday Prayer",
    subtitle: "Pause and seek His face",
    time: "12:00",
    enabled: true,
  },
  {
    id: "night",
    name: "Night Prayer",
    subtitle: "End the day in His presence",
    time: "21:00",
    enabled: true,
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function requestPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        remindersEnabled: true,
        soundEnabled: true,
        sound: DEFAULT_NOTIFICATION_SOUND,
      };
    }
    const settings = JSON.parse(raw) as {
      remindersEnabled?: boolean;
      soundEnabled?: boolean;
      notificationSound?: NotificationSound;
      customNotificationSoundUri?: string;
      customNotificationSoundName?: string;
    };
    return {
      remindersEnabled: settings.remindersEnabled ?? true,
      soundEnabled: settings.soundEnabled ?? true,
      sound: settings.notificationSound ?? DEFAULT_NOTIFICATION_SOUND,
      customSoundUri: settings.customNotificationSoundUri,
      customSoundName: settings.customNotificationSoundName,
    };
  } catch (e) {
    console.warn("[Kairos] Notification preferences read failed:", e);
    return {
      remindersEnabled: true,
      soundEnabled: true,
      sound: DEFAULT_NOTIFICATION_SOUND,
    };
  }
}

/** Short KJV verses on prayer, one per reminder. */
export const REMINDER_VERSES = [
  "Pray without ceasing. (1 Thessalonians 5:17)",
  "Evening, and morning, and at noon, will I pray, and cry aloud: and he shall hear my voice. (Psalm 55:17)",
  "Continue in prayer, and watch in the same with thanksgiving. (Colossians 4:2)",
  "Men ought always to pray, and not to faint. (Luke 18:1)",
  "Seek the LORD and his strength, seek his face continually. (1 Chronicles 16:11)",
  "The effectual fervent prayer of a righteous man availeth much. (James 5:16)",
  "Call unto me, and I will answer thee. (Jeremiah 33:3)",
];

async function rescheduleNotifications(hours: PrayerHour[]): Promise<void> {
  try {
    const granted = await requestPermission();
    if (!granted) return;

    const { remindersEnabled, soundEnabled, sound } = await getNotificationPreferences();
    const isCustom = sound === "custom";
    const notificationSound = soundEnabled
      ? isCustom
        ? "default"
        : sound
      : false;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("prayer", {
        name: "Prayer Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: notificationSound === false ? "default" : notificationSound,
      });
    }

    const all = await Notifications.getAllScheduledNotificationsAsync();
    const kairosIds = all
      .filter((n) => n.content.data?.kairos === true)
      .map((n) => n.identifier);
    await Promise.all(
      kairosIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );

    // Reminders switched off in Settings: leave nothing scheduled.
    if (!remindersEnabled) return;

    for (const [i, hour] of hours.filter((h) => h.enabled).entries()) {
      const [hStr, mStr] = hour.time.split(":");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕊️ ${hour.name}`,
          body: `${hour.subtitle}\n${REMINDER_VERSES[i % REMINDER_VERSES.length]}`,
          sound: notificationSound,
          data: { kairos: true, prayerHourId: hour.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parseInt(hStr, 10),
          minute: parseInt(mStr, 10),
          channelId: "prayer",
        },
      });
    }
  } catch (e) {
    console.error("[Kairos] Notification scheduling failed:", e);
  }
}

export async function rescheduleSavedPrayerNotifications(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const hours = raw ? (JSON.parse(raw) as PrayerHour[]) : DEFAULT_HOURS;
    await rescheduleNotifications(hours);
  } catch (e) {
    console.error("[Kairos] Saved prayer notification reschedule failed:", e);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePrayerTimes() {
  const [hours, setHours] = useState<PrayerHour[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: PrayerHour[] = JSON.parse(raw);
          // Sort by time, trust exactly what user saved
          setHours(saved.sort((a, b) => a.time.localeCompare(b.time)));
        }
        // First install: defaults are already set in useState
      } catch (e) {
        console.error("[Kairos] Load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    void rescheduleNotifications(hours);
  }, [loading, hours]);

  const persist = useCallback(async (updated: PrayerHour[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await rescheduleNotifications(updated);
    } catch (e) {
      console.error("[Kairos] Persist failed:", e);
    }
  }, []);

  const toggleHour = useCallback(
    (id: string) => {
      setHours((prev) => {
        const next = prev.map((h) =>
          h.id === id ? { ...h, enabled: !h.enabled } : h,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // Create or update — no restrictions whatsoever
  const saveHour = useCallback(
    (updated: PrayerHour) => {
      setHours((prev) => {
        const exists = prev.find((h) => h.id === updated.id);
        const next = exists
          ? prev.map((h) => (h.id === updated.id ? updated : h))
          : [...prev, updated];
        next.sort((a, b) => a.time.localeCompare(b.time));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // Delete any hour — user owns all of them
  const deleteHour = useCallback(
    (id: string) => {
      setHours((prev) => {
        const next = prev.filter((h) => h.id !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const getNextPrayer = useCallback((): PrayerHour | null => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const enabled = [...hours.filter((h) => h.enabled)].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
    if (!enabled.length) return null;
    return (
      enabled.find((h) => {
        const [hh, mm] = h.time.split(":").map(Number);
        return hh * 60 + mm > nowMins;
      }) ?? enabled[0]
    );
  }, [hours]);

  return { hours, loading, toggleHour, saveHour, deleteHour, getNextPrayer };
}
