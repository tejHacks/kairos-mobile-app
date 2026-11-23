import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { DEFAULT_HOURS, REMINDER_VERSES, rescheduleSavedPrayerNotifications } from "../hooks/usePrayerTimes";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  setNotificationChannelAsync: jest.fn(async () => null),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => "id"),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly" },
}));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

it("schedules a daily reminder for every enabled prayer time, on the Prayer channel", async () => {
  await rescheduleSavedPrayerNotifications();
  const enabled = DEFAULT_HOURS.filter((h) => h.enabled);
  expect(schedule).toHaveBeenCalledTimes(enabled.length);
  const first = schedule.mock.calls[0][0];
  expect(first.trigger).toMatchObject({ type: "daily", hour: 6, minute: 0, channelId: "prayer" });
  expect(first.content.title).toContain(enabled[0].name);
  // every reminder carries a KJV verse on prayer
  expect(first.content.body).toContain(REMINDER_VERSES[0]);
});

it("schedules nothing when reminders are switched off in Settings", async () => {
  await AsyncStorage.setItem("@kairos/settings", JSON.stringify({ remindersEnabled: false }));
  await rescheduleSavedPrayerNotifications();
  expect(schedule).not.toHaveBeenCalled();
});

it("only reminds for the hours the user kept on", async () => {
  const hours = DEFAULT_HOURS.map((h, i) => ({ ...h, enabled: i === 1 }));
  await AsyncStorage.setItem("@kairos/prayer_times", JSON.stringify(hours));
  await rescheduleSavedPrayerNotifications();
  expect(schedule).toHaveBeenCalledTimes(1);
  expect(schedule.mock.calls[0][0].trigger).toMatchObject({ hour: 12, minute: 0 });
});

it("cancels the old Kairos reminders before scheduling new ones", async () => {
  (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([
    { identifier: "old-1", content: { data: { kairos: true } } },
    { identifier: "other-app", content: { data: {} } },
  ]);
  await rescheduleSavedPrayerNotifications();
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-1");
  expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith("other-app");
});
