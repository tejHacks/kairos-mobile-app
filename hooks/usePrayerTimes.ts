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
        soundEnabled: true,
        sound: DEFAULT_NOTIFICATION_SOUND,
      };
    }
    const settings = JSON.parse(raw) as {
      soundEnabled?: boolean;
      notificationSound?: NotificationSound;
      customNotificationSoundUri?: string;
      customNotificationSoundName?: string;
    };
    return {
      soundEnabled: settings.soundEnabled ?? true,
      sound: settings.notificationSound ?? DEFAULT_NOTIFICATION_SOUND,
      customSoundUri: settings.customNotificationSoundUri,
      customSoundName: settings.customNotificationSoundName,
    };
  } catch (e) {
    console.warn("[Kairos] Notification preferences read failed:", e);
    return {
      soundEnabled: true,
      sound: DEFAULT_NOTIFICATION_SOUND,
    };
  }
}

async function rescheduleNotifications(hours: PrayerHour[]): Promise<void> {
  try {
    const granted = await requestPermission();
    if (!granted) return;

    const { soundEnabled, sound } = await getNotificationPreferences();
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

    for (const hour of hours.filter((h) => h.enabled)) {
      const [hStr, mStr] = hour.time.split(":");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕊️ ${hour.name}`,
          body: hour.subtitle,
          sound: notificationSound,
          data: { kairos: true, prayerHourId: hour.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parseInt(hStr, 10),
          minute: parseInt(mStr, 10),
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
