// app/(main)/meditation.tsx
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen, ExternalLink, Quote, Sparkles } from "lucide-react-native";
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

const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.9;
  return size;
};

const GOLD = "#D4AF37";
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
      colors={["#0f0518", "#1a0f2e", "#29143d"]}
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
            <View style={styles.cardLabelRow}>
              <Sparkles size={scale(13)} color={GOLD} strokeWidth={2} />
              <Text style={styles.cardLabel}>VERSE OF THE DAY</Text>
            </View>
            <Text style={styles.verseText} selectable>
              {todaysVerse.text}
            </Text>
            <Text style={styles.verseRef} selectable>
              {todaysVerse.ref}
            </Text>
          </View>

          {/* DAILY QUOTE */}
          <View style={styles.quoteCard}>
            <View style={styles.cardLabelRow}>
              <Quote size={scale(13)} color={GOLD} strokeWidth={2} />
              <Text style={styles.cardLabel}>DAILY WISDOM</Text>
            </View>
            <Text style={styles.quoteText} selectable>
              &quot;{todaysQuote.text}&quot;
            </Text>
            <Text style={styles.quoteAuthor} selectable>
              — {todaysQuote.author}
            </Text>
          </View>

          {/* DAILY PSALM */}
          <View style={styles.psalmCard}>
            <View style={styles.cardLabelRow}>
              <BookOpen size={scale(13)} color={GOLD} strokeWidth={2} />
              <Text style={styles.cardLabel}>TODAY&apos;S PSALM</Text>
            </View>
            <Text style={styles.psalmText} selectable>
              {todaysPsalm.text}
            </Text>
            <Text style={styles.psalmRef} selectable>
              {todaysPsalm.ref}
            </Text>
          </View>

          {/* TODAY'S THEME — the one theme surfaced each day, no browser needed */}
          <View
            style={[
              styles.todaysThemeCard,
              { borderColor: todaysTheme.color + "80" },
            ]}
          >
            <Text style={styles.cardLabel}>TODAY&apos;S THEME</Text>
            <View style={styles.themeHeader}>
              <View
                style={[
                  styles.themeDot,
                  { backgroundColor: todaysTheme.color },
                ]}
              />
              <Text style={styles.todaysThemeTitle}>{todaysTheme.title}</Text>
            </View>
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
              <ExternalLink size={scale(14)} color="#1a0f2e" strokeWidth={2.2} />
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

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(77, 21, 123, 0.28)",
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
  },

  quoteCard: {
    backgroundColor: "rgba(90, 37, 168, 0.25)",
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
  },

  psalmCard: {
    backgroundColor: "rgba(60, 18, 110, 0.25)",
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
  },

  todaysThemeCard: {
    backgroundColor: "rgba(48, 11, 98, 0.3)",
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
    borderColor: "rgba(212, 175, 55, 0.25)",
  },

  hagahCard: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    padding: isTablet ? 28 : 24,
    borderRadius: 24,
    marginBottom: 30,
    borderWidth: 1,
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
    borderColor: "rgba(212, 175, 55, 0.3)",
  },

  hagahText: {
    fontSize: scale(14),
    color: "rgba(255,255,255,0.7)",
    lineHeight: scale(21),
    marginBottom: 16,
  },

  hagahButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 13,
  },

  hagahButtonText: {
    color: "#1a0f2e",
    fontSize: scale(14),
    fontWeight: "700",
  },

  cardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },

  cardLabel: {
    fontSize: scale(11),
    fontWeight: "700",
    color: "#D4AF37",
    letterSpacing: 2,
    marginBottom: 12,
  },

  verseText: {
    fontSize: scale(18),
    lineHeight: scale(30),
    color: "#FFFFFF",
    marginBottom: 12,
    fontStyle: "italic",
  },

  verseRef: {
    fontSize: scale(14),
    color: "#D4AF37",
    fontWeight: "600",
    textAlign: "right",
  },

  quoteText: {
    fontSize: scale(17),
    color: "#FFFFFF",
    lineHeight: scale(28),
    marginBottom: 12,
    fontStyle: "italic",
  },

  quoteAuthor: {
    fontSize: scale(14),
    color: "#A78BFA",
    fontWeight: "600",
    textAlign: "right",
  },

  psalmText: {
    fontSize: scale(17),
    color: "#FFFFFF",
    lineHeight: scale(28),
    marginBottom: 12,
  },

  psalmRef: {
    fontSize: scale(14),
    color: "#14B8A6",
    fontWeight: "600",
    textAlign: "right",
  },

  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  todaysThemeTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  footer: {
    marginTop: 40,
    fontSize: scale(15),
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: scale(24),
    fontStyle: "italic",
    marginBottom: 20,
  },
});