import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import TopBar from "../../components/TopBar";
import { COLORS } from "../../constants/appConstants";
import {
  NotificationSound,
  rescheduleSavedPrayerNotifications,
} from "../../hooks/usePrayerTimes";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";
import { playCustomSound } from "../../lib/customSound";

const STORAGE_KEY = "@kairos/settings";

// const NOTIFICATION_SOUNDS: {
//   id: NotificationSound;
//   label: string;
//   description: string;
// }[] = [
//     {
//       id: "default",
//       label: "Default",
//       description: "Use the device default notification tone.",
//     },
//     {
//       id: "bells",
//       label: "Gentle Bells",
//       description: "A calm bell chime for quiet reminders.",
//     },
//     {
//       id: "soft_chime",
//       label: "Sacred Chime",
//       description: "A soft tone to bring focus to prayer time.",
//     },
//     {
//       id: "harp",
//       label: "Harp Melody",
//       description: "A warm harp sound for sacred moments.",
//     },
//     {
//       id: "custom",
//       label: "Custom Sound",
//       description: "Select an MP3 from your phone for prayer reminders.",
//     },
//   ];

interface SettingsState {
  remindersEnabled: boolean;
  soundEnabled: boolean;
  dailyVerseEnabled: boolean;
  autoSaveJournal: boolean;
  notificationSound: NotificationSound;
  customNotificationSoundUri?: string;
  customNotificationSoundName?: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  remindersEnabled: true,
  soundEnabled: true,
  dailyVerseEnabled: true,
  autoSaveJournal: true,
  notificationSound: "default",
  customNotificationSoundUri: undefined,
  customNotificationSoundName: undefined,
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        }
      } catch (error) {
        console.error("[Kairos] Load settings failed:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSettings = async (next: SettingsState) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (
        next.soundEnabled !== settings.soundEnabled ||
        next.notificationSound !== settings.notificationSound ||
        next.customNotificationSoundUri !== settings.customNotificationSoundUri
      ) {
        await rescheduleSavedPrayerNotifications();
      }
    } catch (error) {
      console.error("[Kairos] Save settings failed:", error);
    }
  };

  const updateSetting = async <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    await saveSettings({ ...settings, [key]: value });
  };

  const pickCustomSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      await saveSettings({
        ...settings,
        notificationSound: "custom",
        customNotificationSoundUri: asset.uri,
        customNotificationSoundName: asset.name,
      });
    } catch (error) {
      console.error("[Kairos] Pick custom sound failed:", error);
    }
  };

  const previewCustomSound = async () => {
    if (!settings.customNotificationSoundUri) return;
    try {
      await playCustomSound(settings.customNotificationSoundUri);
    } catch (error) {
      console.warn("[Kairos] Custom sound preview failed:", error);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#0c0514", "#150926", "#271b4a"]}
        style={styles.loadingContainer}
      >
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0c0514", "#150926", "#271b4a"]}
      style={{ flex: 1 }}
    >
      {/* TopBar outside ScrollView — same pattern as every other screen */}
      <TopBar title="Settings" subtitle="Manage your preferences" />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + verticalScale(120) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Prayer Reminders ── */}
        <Section
          title="Prayer Reminders"
          desc="Turn on reminders for your selected prayer times and alerts."
        >
          <OptionRow
            label="Reminders"
            value={settings.remindersEnabled}
            onChange={(v) => updateSetting("remindersEnabled", v)}
          />
          <OptionRow
            label="Notification sound"
            value={settings.soundEnabled}
            onChange={(v) => updateSetting("soundEnabled", v)}
          />
        </Section>

        {/* ── Daily Practice ── */}
        <Section
          title="Daily Practice"
          desc="Keep your daily verse and prayer journal features active."
        >
          <OptionRow
            label="Daily verse"
            value={settings.dailyVerseEnabled}
            onChange={(v) => updateSetting("dailyVerseEnabled", v)}
          />
          <OptionRow
            label="Auto-save journal"
            value={settings.autoSaveJournal}
            onChange={(v) => updateSetting("autoSaveJournal", v)}
          />
        </Section>

        {/* ── Prayer Alerts ── */}
        <Section
          title="Prayer Alerts"
          desc="Choose the sound for prayer reminder notifications."
        >
          <OptionRow
            label="Play sound"
            value={settings.soundEnabled}
            onChange={(v) => updateSetting("soundEnabled", v)}
          />



          <TouchableOpacity
            onPress={pickCustomSound}
            style={styles.customButton}
          >
            <Text style={styles.customButtonText}>
              {settings.customNotificationSoundUri
                ? "Change custom sound"
                : "Choose a custom sound"}
            </Text>
          </TouchableOpacity>

          {settings.notificationSound === "custom" && (
            <View style={styles.customPreviewRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.soundLabel}>Selected file</Text>
                <Text style={styles.soundDescription}>
                  {settings.customNotificationSoundName ?? "No file selected"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={previewCustomSound}
                style={styles.previewButton}
              >
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
            </View>
          )}
        </Section>

        {/* ── Footer ── */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>More coming soon</Text>
          <Text style={styles.footerText}>
            Themes, deeper personalization, and prayer reminder upgrades are on
            the way. Stay faithful.
          </Text>
        </View>
      </ScrollView>

      <Navbar />
    </LinearGradient>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{desc}</Text>
      {children}
    </View>
  );
}

function OptionRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={Platform.OS === "android" ? COLORS.primary : undefined}
        trackColor={{ false: "#555", true: COLORS.primary }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.text,
    fontSize: scaleFont(16),
  },
  container: {
    paddingTop: scaleSize(24),
    paddingHorizontal: scaleSize(24),
  },
  section: {
    backgroundColor: "rgba(72,20,111,0.26)",
    borderRadius: scaleSize(20),
    padding: scaleSize(20),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: scaleFont(16),
    fontWeight: "700",
    marginBottom: verticalScale(6),
    letterSpacing: 0.3,
  },
  sectionDescription: {
    color: "rgba(255,255,255,0.55)",
    fontSize: scaleFont(13),
    lineHeight: scaleFont(20),
    marginBottom: verticalScale(14),
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: verticalScale(14),
    paddingHorizontal: scaleSize(16),
    borderRadius: scaleSize(14),
    marginBottom: verticalScale(10),
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: scaleFont(15),
    flex: 1,
    marginRight: scaleSize(12),
  },
  soundOption: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scaleSize(16),
    padding: scaleSize(14),
    marginBottom: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  soundOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(92,33,160,0.15)",
  },
  soundLabel: {
    color: "#fff",
    fontSize: scaleFont(15),
    fontWeight: "700",
    marginBottom: verticalScale(3),
  },
  soundDescription: {
    color: "rgba(255,255,255,0.5)",
    fontSize: scaleFont(12),
    lineHeight: scaleFont(18),
  },
  soundBadge: {
    borderRadius: scaleSize(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: verticalScale(5),
    paddingHorizontal: scaleSize(10),
  },
  soundBadgeActive: {
    borderRadius: scaleSize(12),
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(5),
    paddingHorizontal: scaleSize(10),
  },
  soundBadgeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: scaleFont(10),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  soundBadgeTextActive: {
    color: "#1a0f2e",
    fontSize: scaleFont(10),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  customButton: {
    marginTop: verticalScale(8),
    backgroundColor: "rgba(212,175,55,0.1)",
    borderRadius: scaleSize(14),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
  },
  customButtonText: {
    color: COLORS.primary,
    fontSize: scaleFont(14),
    fontWeight: "700",
  },
  customPreviewRow: {
    marginTop: verticalScale(12),
    padding: scaleSize(14),
    borderRadius: scaleSize(14),
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(12),
  },
  previewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: scaleSize(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scaleSize(14),
  },
  previewButtonText: {
    color: "#1a0f2e",
    fontSize: scaleFont(13),
    fontWeight: "700",
  },
  footerCard: {
    padding: scaleSize(20),
    borderRadius: scaleSize(18),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: scaleSize(8),
  },
  footerTitle: {
    color: COLORS.primary,
    fontSize: scaleFont(15),
    fontWeight: "700",
    marginBottom: verticalScale(6),
  },
  footerText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: scaleFont(13),
    lineHeight: scaleFont(20),
  },
});