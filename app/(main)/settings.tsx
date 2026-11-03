import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Navbar from "../../components/Navbar";
import TopBar from "../../components/TopBar";
import { COLORS } from "../../constants/appConstants";
import { rescheduleSavedPrayerNotifications } from "../../hooks/usePrayerTimes";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";
import {
  cancelFastingReminders,
  getFastingSchedule,
  scheduleFastingReminders,
} from "../../hooks/useFastingReminders";

const STORAGE_KEY = "@kairos/settings";

interface SettingsState {
  remindersEnabled: boolean;
  soundEnabled: boolean;
  fastingRemindersEnabled: boolean;
  dailyVerseEnabled: boolean;
  autoSaveJournal: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  remindersEnabled: true,
  soundEnabled: true,
  fastingRemindersEnabled: true,
  dailyVerseEnabled: true,
  autoSaveJournal: true,
};

export default function SettingsScreen() {
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
      if (next.remindersEnabled !== settings.remindersEnabled || next.soundEnabled !== settings.soundEnabled) {
        await rescheduleSavedPrayerNotifications();
      }
      if (next.fastingRemindersEnabled !== settings.fastingRemindersEnabled) {
        if (next.fastingRemindersEnabled) {
          const { selectedDays, dailyFast } = await getFastingSchedule();
          await scheduleFastingReminders(selectedDays, dailyFast);
        } else {
          await cancelFastingReminders();
        }
      }
    } catch (error) {
      console.error("[Kairos] Save settings failed:", error);
    }
  };

  const updateSetting = async <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    await saveSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0c0514", "#150926", "#271b4a"]} style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0c0514", "#150926", "#271b4a"]} style={{ flex: 1 }}>
      <TopBar title="Settings" subtitle="Manage your preferences" />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: verticalScale(120) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Prayer Reminders ── */}
        <Section title="Prayer Reminders" desc="Turn on reminders for your selected prayer times.">
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

        {/* ── Fasting Reminders ── */}
        <Section
          title="Fasting Reminders"
          desc="Get reminded on the mornings of the days you've set for fasting in the Fasting tab."
        >
          <OptionRow
            label="Remind me on fasting days"
            value={settings.fastingRemindersEnabled}
            onChange={(v) => updateSetting("fastingRemindersEnabled", v)}
          />
        </Section>

        {/* ── Daily Practice ── */}
        <Section title="Daily Practice" desc="Keep your daily verse and prayer journal features active.">
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

        {/* ── Footer ── */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>More coming soon</Text>
          <Text style={styles.footerText}>
            Themes, deeper personalization, and prayer reminder upgrades are on the way. Stay faithful.
          </Text>
        </View>
      </ScrollView>

      <Navbar />
    </LinearGradient>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{desc}</Text>
      {children}
    </View>
  );
}

function OptionRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
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

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: COLORS.text, fontSize: scaleFont(16) },
  container: { paddingTop: scaleSize(24), paddingHorizontal: scaleSize(24) },
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
  optionLabel: { color: COLORS.text, fontSize: scaleFont(15), flex: 1, marginRight: scaleSize(12) },
  footerCard: {
    padding: scaleSize(20),
    borderRadius: scaleSize(18),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: scaleSize(8),
  },
  footerTitle: { color: COLORS.primary, fontSize: scaleFont(15), fontWeight: "700", marginBottom: verticalScale(6) },
  footerText: { color: "rgba(255,255,255,0.55)", fontSize: scaleFont(13), lineHeight: scaleFont(20) },
});