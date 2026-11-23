import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";

import BackgroundGradient from "@/components/BackgroundGradient";
import { FONTS } from "@/constants/appConstants";
import { loadThemeChoice, usePalette } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { rescheduleSavedPrayerNotifications } from "../hooks/usePrayerTimes";

// Keep the splash up until fonts and the saved theme are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [FONTS.regular]: Inter_400Regular,
    [FONTS.semibold]: Inter_600SemiBold,
    [FONTS.bold]: Inter_700Bold,
  });
  const [themeReady, setThemeReady] = useState(false);
  const palette = usePalette();

  useEffect(() => {
    loadThemeChoice().finally(() => setThemeReady(true));
  }, []);

  // Make sure prayer reminders are scheduled every time the app starts
  // (after onboarding, so the permission prompt comes at the right moment).
  useEffect(() => {
    (async () => {
      const onboarded = await AsyncStorage.getItem("@kairos:first_open_complete").catch(() => null);
      if (onboarded === "true") await rescheduleSavedPrayerNotifications();
    })();
  }, []);

  const ready = (fontsLoaded || !!fontError) && themeReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(console.warn);
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={palette.scheme === "dark" ? "light-content" : "dark-content"} />
      <BackgroundGradient>
        {/* Re-keyed on theme change so every screen re-renders with the new palette */}
        <Stack
          key={palette.scheme}
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg }, animation: "fade" }}
        />
      </BackgroundGradient>
    </SafeAreaProvider>
  );
}
