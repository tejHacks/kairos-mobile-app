import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import Navbar from "../../components/Navbar";
import TopBar from "../../components/TopBar";
import { rescheduleSavedPrayerNotifications } from "../../hooks/usePrayerTimes";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";
import {
  cancelFastingReminders,
  getFastingSchedule,
  scheduleFastingReminders,
} from "../../hooks/useFastingReminders";

import { c, getThemeChoice, setThemeChoice, themed, type ThemeChoice } from "@/constants/theme";

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
      <LinearGradient colors={[c.bg, c.bg]} style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[c.bg, c.bg]} style={{ flex: 1 }}>
      <TopBar title="Settings" subtitle="Manage your preferences" />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: verticalScale(120) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ── */}
        <Section title="Appearance" desc="Kairos follows your phone by default. Pick Light or Dark to keep one look.">
          <AppearancePicker />
        </Section>

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
          <Text style={styles.footerTitle}>Evening, morning and noon</Text>
          <Text style={styles.footerText}>
            “Evening, and morning, and at noon, will I pray, and cry aloud: and he shall hear my voice.” Psalm 55:17
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
        thumbColor={Platform.OS === "android" ? c.gold : undefined}
        trackColor={{ false: c.ink(0.25), true: c.gold }}
      />
    </View>
  );
}

const APPEARANCE: { id: ThemeChoice; label: string; icon: string }[] = [
  { id: "system", label: "Match phone", icon: "◐" },
  { id: "light", label: "Light", icon: "☀" },
  { id: "dark", label: "Dark", icon: "☾" },
];

function AppearancePicker() {
  const [choice, setChoice] = useState<ThemeChoice>(getThemeChoice());
  return (
    <View style={styles.segment} accessibilityRole="radiogroup">
      {APPEARANCE.map((o) => {
        const on = o.id === choice;
        return (
          <TouchableOpacity
            key={o.id}
            style={[styles.segmentItem, on && styles.segmentItemOn]}
            onPress={() => {
              setChoice(o.id);
              void setThemeChoice(o.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentIcon, on && styles.segmentTextOn]}>{o.icon}</Text>
            <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = themed(() => StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: c.text, fontSize: scaleFont(16) },
  container: { paddingTop: scaleSize(24), paddingHorizontal: scaleSize(24) },
  section: {
    backgroundColor: c.surface,
    borderRadius: scaleSize(20),
    padding: scaleSize(20),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderColor: c.goldA(0.18),
  },
  sectionTitle: {
    color: c.gold,
    fontSize: scaleFont(16),
    fontWeight: "700",
    marginBottom: verticalScale(6),
    letterSpacing: 0.3,
  },
  sectionDescription: {
    color: c.ink(0.55),
    fontSize: scaleFont(13),
    lineHeight: scaleFont(20),
    marginBottom: verticalScale(14),
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: c.wash(0.04),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scaleSize(16),
    borderRadius: scaleSize(14),
    marginBottom: verticalScale(10),
  },
  optionLabel: { color: c.text, fontSize: scaleFont(15), flex: 1, marginRight: scaleSize(12) },
  segment: { flexDirection: "row", gap: scaleSize(8) },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: verticalScale(12),
    borderRadius: scaleSize(14),
    backgroundColor: c.wash(0.05),
    borderWidth: 1,
    borderColor: c.ink(0.08),
  },
  segmentItemOn: { backgroundColor: c.gold, borderColor: c.gold },
  segmentIcon: { fontSize: scaleFont(18), color: c.text, marginBottom: 2 },
  segmentText: { fontSize: scaleFont(13), fontWeight: "600", color: c.text },
  segmentTextOn: { color: c.onGold },
  footerCard: {
    padding: scaleSize(20),
    borderRadius: scaleSize(18),
    borderWidth: 1,
    borderColor: c.ink(0.08),
    backgroundColor: c.wash(0.04),
    marginBottom: scaleSize(8),
  },
  footerTitle: { color: c.gold, fontSize: scaleFont(15), fontWeight: "700", marginBottom: verticalScale(6) },
  footerText: { color: c.ink(0.55), fontSize: scaleFont(13), lineHeight: scaleFont(20) },
}));