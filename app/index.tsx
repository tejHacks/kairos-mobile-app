import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  BookOpen,
  Clock,
  Cross,
  Droplets,
  Flame,
  PenTool,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { c, themed } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.9;
  return size;
};

const STORAGE_KEY = "@kairos:first_open_complete";
type Slide = {
  key: string;
  isSplash?: boolean;
  eyebrow?: string;
  title?: string;
  body?: string;
  Icon?: any;
  gradient: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    key: "splash",
    isSplash: true,
    gradient: [c.bg, c.bg, c.goldA(0.28)],
  },
  {
    key: "pray",
    eyebrow: "PRAY",
    title: "Never miss your\nappointed hour",
    body: "Set sacred reminders through your day — morning, noon, evening — so prayer becomes rhythm, not afterthought.",
    Icon: Clock,
    gradient: [c.bg, c.surface, c.goldA(0.28)],
  },
  {
    key: "meditate",
    eyebrow: "MEDITATE",
    title: "Let the Word\nsink deep",
    body: "Guided scripture meditations to slow you down and root your mind in truth, one verse at a time.",
    Icon: BookOpen,
    gradient: [c.bg, c.surface, c.goldA(0.28)],
  },
  {
    key: "fast",
    eyebrow: "FAST",
    title: "Deny the flesh.\nFeed the spirit.",
    body: "Plan, track, and stay accountable through seasons of fasting — with scripture and strength for every hour.",
    Icon: Droplets,
    gradient: [c.bg, c.surface, c.goldA(0.28)],
  },
  {
    key: "scribe",
    eyebrow: "SCRIBE",
    title: "Write it down.\nWatch Him answer.",
    body: "Journal your prayers and testimonies. Come back later and see just how faithful He's been.",
    Icon: PenTool,
    gradient: [c.bg, c.surface, c.goldA(0.28)],
  },
  {
    key: "altar",
    eyebrow: "ALTAR",
    title: "Build your\naltar here.",
    body: "Kairos — the appointed time is now. Come before the throne daily, and watch your life change.",
    Icon: Flame,
    gradient: [c.bg, c.surface, c.gold],
  },
];

export default function IndexScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [checking, setChecking] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "true") {
          router.replace("/(main)/home");
          return;
        }
      } catch (error) {
        console.warn("[Kairos] Launch state read failed:", error);
      }
      setChecking(false);
    })();
  }, [router]);

  React.useEffect(() => {
    if (!checking && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [checking, fontsLoaded]);

  if (checking || !fontsLoaded) return null;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
    } catch (error) {
      console.warn("[Kairos] Launch state save failed:", error);
    }
    router.replace("/(main)/home");
  };

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      finishOnboarding();
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        renderItem={({ item }) =>
          item.isSplash ? (
            <LinearGradient
              colors={[c.bg, c.bg]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={[styles.slide, styles.splashSlide]}
            >
              <Cross size={scale(72)} color={c.gold} strokeWidth={1.5} />
              <Text style={styles.greek}>καιρός</Text>
              <Text style={styles.appName}>Kairos</Text>
              <View style={styles.divider} />
              <Text style={styles.meaning}>the appointed time · god's perfect timing</Text>
              <Text style={styles.scripture}>
                &quot;To every thing there is a season,{"\n"}
                and a <Text style={styles.bold}>time</Text> to every purpose{"\n"}
                under the heaven.&quot;
              </Text>
              <Text style={styles.ref}>Ecclesiastes 3:1</Text>
              <Text style={styles.footer}>Seek Him in His time</Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={[c.bg, c.bg]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.slide}
            >
              <View style={styles.glowOrb} />
              <View style={styles.textBlock}>
                <View style={styles.iconCircle}>
                  <item.Icon size={34} color={c.gold} strokeWidth={2} />
                </View>
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            </LinearGradient>
          )
        }
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });
          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
            />
          );
        })}
      </View>

      <View style={styles.bottomRow}>
        {!isLast ? (
          <TouchableOpacity onPress={finishOnboarding} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}

        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextButtonText}>
            {isLast ? "Begin Praying" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  slide: { width, height, justifyContent: "center", paddingHorizontal: scale(32) },
  splashSlide: { alignItems: "center", paddingHorizontal: scale(24) },
  greek: {
    fontSize: scale(30),
    color: c.gold,
    marginTop: scale(16),
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
  },
  appName: {
    fontSize: scale(38),
    fontFamily: "Inter_700Bold",
    color: c.text,
    letterSpacing: 6,
    marginTop: scale(10),
    marginBottom: scale(14),
    textTransform: "uppercase",
  },
  divider: { width: 60, height: 1, backgroundColor: c.gold, opacity: 0.6, marginBottom: scale(14) },
  meaning: {
    fontSize: scale(13),
    color: c.goldA(0.7),
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: scale(28),
    fontFamily: "Inter_400Regular",
  },
  scripture: {
    fontSize: scale(14),
    color: c.ink(0.8),
    textAlign: "center",
    lineHeight: scale(22),
    fontStyle: "italic",
    marginBottom: scale(6),
    fontFamily: "Inter_400Regular",
  },
  bold: { color: c.gold, fontStyle: "italic", fontFamily: "Inter_600SemiBold" },
  ref: {
    fontSize: scale(11),
    color: c.goldA(0.55),
    letterSpacing: 2,
    marginBottom: scale(16),
    textTransform: "uppercase",
    fontFamily: "Inter_400Regular",
  },
  footer: {
    fontSize: scale(10),
    color: c.gold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: scale(8),
    fontFamily: "Inter_600SemiBold",
  },
  glowOrb: {
    position: "absolute",
    top: height * 0.14,
    alignSelf: "center",
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
    backgroundColor: c.gold,
    opacity: 0.14,
  },
  textBlock: { marginTop: scale(40) },
  iconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    borderWidth: 1.5,
    borderColor: c.gold,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: scale(22),
  },
  eyebrow: {
    fontSize: scale(13),
    fontFamily: "Inter_700Bold",
    color: c.gold,
    letterSpacing: 4,
    marginBottom: scale(14),
  },
  title: {
    fontSize: scale(30),
    fontFamily: "Inter_700Bold",
    color: c.text,
    lineHeight: scale(38),
    marginBottom: scale(18),
  },
  body: {
    fontSize: scale(16),
    lineHeight: scale(24),
    color: c.ink(0.78),
    maxWidth: "92%",
    fontFamily: "Inter_400Regular",
  },
  dotsRow: {
    position: "absolute",
    bottom: scale(130),
    flexDirection: "row",
    alignSelf: "center",
    gap: 8,
  },
  dot: { height: 8, borderRadius: 4, backgroundColor: c.gold },
  bottomRow: {
    position: "absolute",
    bottom: scale(50),
    left: scale(32),
    right: scale(32),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipText: {
    color: c.ink(0.6),
    fontSize: scale(15),
    fontFamily: "Inter_600SemiBold",
  },
  nextButton: {
    backgroundColor: c.gold,
    paddingHorizontal: scale(28),
    paddingVertical: scale(14),
    borderRadius: scale(28),
  },
  nextButtonText: {
    color: c.bg,
    fontFamily: "Inter_700Bold",
    fontSize: scale(15),
  },
}));