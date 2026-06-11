import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Cross } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Dimensions, Text, TouchableOpacity } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// Prevent splash from hiding until fonts are ready
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get("window");

const STORAGE_KEY = "@kairos:first_open_complete";

// Responsive helper functions
const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.9;
  return size;
};

export default function SplashScreenComponent() {
  const router = useRouter();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  // Animation values
  const iconScale = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Run entrance animation once fonts are loaded
  useEffect(() => {
    (async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedValue === "true") {
          router.replace("/(main)/home");
          return;
        }
      } catch (error) {
        console.warn("[Kairos] Launch state read failed:", error);
      }
      setIsFirstLaunch(true);
    })();
  }, [router]);

  useEffect(() => {
    if (!fontsLoaded || isFirstLaunch === null) return;

    SplashScreen.hideAsync();

    // Icon zooms in smoothly
    iconScale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [fontsLoaded, isFirstLaunch, iconScale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Whole screen fade-out animation
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  // Handle Start button press
  const finishStart = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
    } catch (error) {
      console.warn("[Kairos] Launch state save failed:", error);
    }

    router.replace("/(main)/home");
  };

  const handleStart = () => {
    // Fade screen out
    screenOpacity.value = withTiming(
      0,
      { duration: 500, easing: Easing.inOut(Easing.ease) },
      () => {
        // Navigate only after animation finishes
        runOnJS(finishStart)();
      },
    );
  };

  // While fonts load or launch state resolves, keep the native splash screen visible
  if (!fontsLoaded || isFirstLaunch === null) {
    return null;
  }

  return (
    <Animated.View style={[{ flex: 1 }, screenStyle]}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1a0f2e" }}>
        <LinearGradient
          colors={["#1a0f2e", "#2d1b4e", "#1a0f2e"]}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: scale(20),
          }}
        >
          {/* App Icon */}
          <Animated.View style={iconStyle}>
            <Cross size={scale(200)} color="#FFFFFF" strokeWidth={1.5} />
          </Animated.View>

          {/* App Title */}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: scale(36),
              color: "#FFFFFF",
              marginTop: scale(20),
              textAlign: "center",
            }}
          >
            Kairos
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: scale(20),
              color: "#FFFFFF",
              opacity: 0.85,
              marginTop: scale(10),
              marginBottom: scale(30),
              textAlign: "center",
            }}
          >
            Seek your Father in prayer. He hears you.
          </Text>

          {/* Scripture */}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: scale(16),
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: scale(24),
              opacity: 0.9,
            }}
          >
            &quot;Men ought always to pray, and not to faint.&quot;{"\n"}– Luke
            18:1 (KJV)
          </Text>

          {/* Start Button */}
          <TouchableOpacity
            onPress={handleStart}
            style={{
              position: "absolute",
              bottom: scale(60),
              backgroundColor: "#FFFFFF",
              paddingVertical: scale(14),
              paddingHorizontal: scale(110),
              borderRadius: scale(30),
            }}
          >
            <Text
              style={{
                color: "#5B21B6",
                fontSize: scale(16),
                fontFamily: "Inter_600SemiBold",
                letterSpacing: 1,
              }}
            >
              START
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    </Animated.View>
  );
}
