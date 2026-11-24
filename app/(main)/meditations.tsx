// app/(main)/meditation.tsx
import { LinearGradient } from "expo-linear-gradient";
import { ExternalLink } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import TopBar from "../../components/TopBar";

// Import external constants
import { dailyPsalms } from "../../constants/daily-psalms";
import { dailyVerses } from "../../constants/daily-verses";
import { dailyQuotes } from "../../constants/spiritual-quotes";
import { themes } from "../../constants/themes";

import { c, themed } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.9;
  return size;
};

const HAGAH_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.olateju.hagahapp&hl=en-US&ah=thyd46Pzht8alpa3zQhdBaOTByQ";

export default function MeditationScreen() {
  // Get daily content based on day of year
  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }, []);

  const todaysVerse = dailyVerses[dayOfYear % dailyVerses.length];
  const todaysQuote = dailyQuotes[dayOfYear % dailyQuotes.length];
  const todaysPsalm = dailyPsalms[dayOfYear % dailyPsalms.length];

  const themeKeys = Object.keys(themes);
  const todaysThemeKey = themeKeys[dayOfYear % themeKeys.length];
  const todaysTheme = themes[todaysThemeKey as keyof typeof themes];
  const todaysThemeVerse =
    todaysTheme.verses[
      Math.floor(dayOfYear / themeKeys.length) % todaysTheme.verses.length
    ];

  return (
    <LinearGradient
      colors={[c.bg, c.bg]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="Meditation" subtitle="Feed your soul with God's word" />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* VERSE OF THE DAY */}
          <View style={styles.dailyCard}>
            <Text style={styles.cardLabel}>VERSE OF THE DAY</Text>
            <Text style={styles.verseText} selectable>
              {todaysVerse.text}
            </Text>
            <Text style={styles.verseRef} selectable>
              {todaysVerse.ref}
            </Text>
          </View>

          {/* DAILY QUOTE */}
          <View style={styles.quoteCard}>
            <Text style={styles.cardLabel}>DAILY WISDOM</Text>
            <Text style={styles.quoteMark}>&ldquo;</Text>
            <Text style={styles.quoteText} selectable>
              {todaysQuote.text}
            </Text>
            <View style={styles.quoteRule} />
            <Text style={styles.quoteAuthor} selectable>
              {todaysQuote.author}
            </Text>
            <Text style={styles.quoteSource} selectable>
              {todaysQuote.source}
            </Text>
          </View>

          {/* DAILY PSALM */}
          <View style={styles.psalmCard}>
            <Text style={styles.cardLabel}>TODAY&apos;S PSALM</Text>
            <Text style={styles.psalmText} selectable>
              {todaysPsalm.text}
            </Text>
            <Text style={styles.psalmRef} selectable>
              {todaysPsalm.ref}
            </Text>
          </View>

          {/* TODAY'S THEME — the one theme surfaced each day, no browser needed */}
          <View style={styles.todaysThemeCard}>
            <Text style={styles.cardLabel}>TODAY&apos;S THEME</Text>
            <Text style={styles.todaysThemeTitle}>{todaysTheme.title}</Text>
            <Text style={styles.verseText}>{todaysThemeVerse.text}</Text>
            <Text style={styles.verseRef}>{todaysThemeVerse.ref}</Text>
          </View>

          {/* HAGAH CROSS-PROMO — want to go deeper than a daily verse? */}
          <View style={styles.hagahCard}>
            <Text style={styles.cardLabel}>GO DEEPER</Text>
            <Text style={styles.hagahText}>
              Want to speak these declarations out loud instead of just reading them? Hagah is our
              scripture-declaration app — spoken meditation with TTS, breathing rhythm, and full KJV
              battle topics.
            </Text>
            <TouchableOpacity
              style={styles.hagahButton}
              onPress={() => Linking.openURL(HAGAH_PLAY_STORE_URL)}
              activeOpacity={0.85}
            >
              <ExternalLink size={scale(14)} color={c.onGoldFill} strokeWidth={2.2} />
              <Text style={styles.hagahButtonText}>Get Hagah</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            &quot;Thy word is a lamp unto my feet, and a light unto my
            path.&quot;
            {"\n"}— Psalm 119:105 (KJV)
          </Text>
        </ScrollView>
      </SafeAreaView>

      <Navbar />
    </LinearGradient>
  );
}

const styles = themed(() => StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    // TopBar already renders above this — no extra top gap needed
    paddingTop: scale(20),
    paddingBottom: 180, // Extra space for navbar
    paddingHorizontal: isTablet ? 40 : 24,
    minHeight: height,
  },

  dailyCard: {
    backgroundColor: c.surface,
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.goldA(0.2),
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
  },

  quoteCard: {
    backgroundColor: c.surface,
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.goldA(0.2),
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
  },

  psalmCard: {
    backgroundColor: c.surface,
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: c.goldA(0.2),
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
  },

  todaysThemeCard: {
    backgroundColor: c.surface,
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
    borderColor: c.goldA(0.25),
  },

  hagahCard: {
    backgroundColor: c.goldA(0.08),
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 30,
    borderWidth: 1,
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
    borderColor: c.goldA(0.3),
  },

  hagahText: {
    fontSize: scale(14),
    color: c.ink(0.7),
    lineHeight: scale(21),
    marginBottom: 16,
  },

  hagahButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: c.goldFill,
    borderRadius: 14,
    paddingVertical: 13,
  },

  hagahButtonText: {
    color: c.onGoldFill,
    fontSize: scale(14),
    fontWeight: "700",
  },

  cardLabel: {
    fontSize: scale(11),
    fontWeight: "700",
    color: c.gold,
    letterSpacing: 2,
    marginBottom: 12,
  },

  verseText: {
    fontSize: scale(18),
    lineHeight: scale(30),
    color: c.text,
    marginBottom: 12,
    fontStyle: "italic",
  },

  verseRef: {
    fontSize: scale(14),
    color: c.gold,
    fontWeight: "600",
    textAlign: "right",
  },

  quoteMark: {
    fontSize: scale(52),
    lineHeight: scale(52),
    height: scale(30),
    color: c.gold,
    fontWeight: "700",
  },

  quoteText: {
    fontSize: scale(18),
    color: c.text,
    lineHeight: scale(29),
    marginBottom: 16,
    fontStyle: "italic",
  },

  quoteRule: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: c.gold,
    marginBottom: 10,
  },

  quoteAuthor: {
    fontSize: scale(15),
    color: c.gold,
    fontWeight: "700",
  },

  quoteSource: {
    fontSize: scale(12),
    color: c.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },

  psalmText: {
    fontSize: scale(17),
    color: c.text,
    lineHeight: scale(28),
    marginBottom: 12,
  },

  psalmRef: {
    fontSize: scale(14),
    color: c.gold,
    fontWeight: "600",
    textAlign: "right",
  },

  todaysThemeTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: c.text,
    marginBottom: 12,
  },

  footer: {
    marginTop: 40,
    fontSize: scale(15),
    color: c.ink(0.6),
    textAlign: "center",
    lineHeight: scale(24),
    fontStyle: "italic",
    marginBottom: 20,
  },
}));