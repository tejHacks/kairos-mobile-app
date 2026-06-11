import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { COLORS } from "../../constants/appConstants";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";

const STORAGE_KEY = "@kairos/settings";

interface SettingsState {
  remindersEnabled: boolean;
  soundEnabled: boolean;
  dailyVerseEnabled: boolean;
  autoSaveJournal: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  remindersEnabled: true,
  soundEnabled: true,
  dailyVerseEnabled: true,
  autoSaveJournal: true,
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings(JSON.parse(raw));
        }
      } catch (error) {
        console.error("[Kairos] Load settings failed:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSetting = async <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("[Kairos] Save settings failed:", error);
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
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + verticalScale(24),
            paddingBottom: insets.bottom + verticalScale(120),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage Kairos app preferences.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Reminders</Text>
          <Text style={styles.sectionDescription}>
            Turn on reminders for your selected prayer times and alerts.
          </Text>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Reminders</Text>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={(value) =>
                updateSetting("remindersEnabled", value)
              }
              thumbColor={
                Platform.OS === "android" ? COLORS.primary : undefined
              }
              trackColor={{ false: "#555", true: COLORS.primary }}
            />
          </View>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Notification sound</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting("soundEnabled", value)}
              thumbColor={
                Platform.OS === "android" ? COLORS.primary : undefined
              }
              trackColor={{ false: "#555", true: COLORS.primary }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Practice</Text>
          <Text style={styles.sectionDescription}>
            Keep your daily verse and prayer journal features active.
          </Text>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Daily verse</Text>
            <Switch
              value={settings.dailyVerseEnabled}
              onValueChange={(value) =>
                updateSetting("dailyVerseEnabled", value)
              }
              thumbColor={
                Platform.OS === "android" ? COLORS.primary : undefined
              }
              trackColor={{ false: "#555", true: COLORS.primary }}
            />
          </View>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Auto-save journal</Text>
            <Switch
              value={settings.autoSaveJournal}
              onValueChange={(value) => updateSetting("autoSaveJournal", value)}
              thumbColor={
                Platform.OS === "android" ? COLORS.primary : undefined
              }
              trackColor={{ false: "#555", true: COLORS.primary }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Kairos</Text>
          <Text style={styles.sectionDescription}>
            Learn more about the app, new updates, and how to support our work.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/about")}
            style={styles.aboutButton}
          >
            <Text style={styles.aboutButtonText}>Open About</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(main)/and-yeah")}
            style={[styles.aboutButton, { marginTop: 12, backgroundColor: "#4d35a8" }]}
          >
            <Text style={styles.aboutButtonText}>Open And Yeah</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Want more?</Text>
          <Text style={styles.footerText}>
            New settings and personalization options are coming soon. Stay tuned
            for themes, prayer reminders, and more.
          </Text>
        </View>
      </ScrollView>

      <Navbar />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scaleSize(24),
  },
  loadingText: {
    color: COLORS.text,
    fontSize: scaleFont(16),
  },
  container: {
    paddingHorizontal: scaleSize(24),
  },
  title: {
    color: COLORS.text,
    fontSize: scaleFont(34),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: scaleFont(15),
    marginBottom: verticalScale(24),
    lineHeight: scaleFont(22),
  },
  section: {
    backgroundColor: "rgba(72, 20, 111, 0.26)",
    borderRadius: scaleSize(20),
    padding: scaleSize(20),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.18)",
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: scaleFont(18),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  sectionDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: verticalScale(16),
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: verticalScale(14),
    paddingHorizontal: scaleSize(16),
    borderRadius: scaleSize(16),
    marginBottom: verticalScale(12),
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: scaleFont(15),
    flex: 1,
    marginRight: scaleSize(12),
  },
  footerCard: {
    padding: scaleSize(20),
    borderRadius: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  aboutButton: {
    marginTop: verticalScale(12),
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(14),
    borderRadius: scaleSize(18),
    alignItems: "center",
  },
  aboutButtonText: {
    color: "#FFFFFF",
    fontSize: scaleFont(15),
    fontWeight: "700",
  },
  footerTitle: {
    color: COLORS.primary,
    fontSize: scaleFont(16),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  footerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
  },
});
