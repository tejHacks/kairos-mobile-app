// app/(main)/meditation.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  // TouchableOpacity,
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

// Responsive helper functions
const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.9;
  return size;
};

export default function MeditationScreen() {
  // const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // Get daily content based on day of year
  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }, []);

  // Today's rotating content
  const todaysVerse = dailyVerses[dayOfYear % dailyVerses.length];
  const todaysQuote = dailyQuotes[dayOfYear % dailyQuotes.length];
  const todaysPsalm = dailyPsalms[dayOfYear % dailyPsalms.length];

  // TODAY'S THEME - picks ONE theme per day
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
            <Text style={styles.quoteText} selectable>
              &quot;{todaysQuote.text}&quot;
            </Text>
            <Text style={styles.quoteAuthor} selectable>
              — {todaysQuote.author}
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

          {/* TODAY'S THEME - ONE THEME PER DAY */}
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

          {/* ALL THEMES - BROWSE */}
          {/* <Text style={styles.sectionTitle}>All Themes</Text>
        <Text style={styles.sectionSubtitle}>
          Tap to explore scriptures by theme
        </Text>
        {Object.entries(themes).map(([key, theme]) => (
          <View key={key} style={styles.themeCard}>
            <TouchableOpacity
              style={styles.themeHeaderButton}
              onPress={() =>
                setSelectedTheme(selectedTheme === key ? null : key)
              }
            >
              <View
                style={[styles.themeDot, { backgroundColor: theme.color }]}
              />
              <Text style={styles.themeTitle}>{theme.title}</Text>
              <Text style={styles.themeChevron}>
                {selectedTheme === key ? "▼" : "▶"}
              </Text>
            </TouchableOpacity>

            {selectedTheme === key && (
              <View style={styles.themeExpanded}>
                {theme.verses.map((verse, idx) => (
                  <View key={idx} style={styles.themeVerse}>
                    <Text style={styles.themeVerseText}>{verse.text}</Text>
                    <Text style={styles.themeVerseRef}>— {verse.ref}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))} */}

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
    paddingTop: scale(80),
    paddingBottom: 180, // Extra space for navbar
    paddingHorizontal: isTablet ? 40 : 24,
    minHeight: height,
  },

  header: {
    fontSize: scale(34),
    fontWeight: "700",
    color: "#D4AF37",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: scale(16),
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: scale(30),
    letterSpacing: 1,
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
    marginBottom: 30,
    borderWidth: 1,
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
    borderColor: "rgba(212, 175, 55, 0.25)",
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

  todaysThemeTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  sectionTitle: {
    fontSize: scale(24),
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 10,
    textAlign: isTablet ? "center" : "left",
  },

  sectionSubtitle: {
    fontSize: scale(14),
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 20,
    textAlign: isTablet ? "center" : "left",
  },

  themeCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    width: "100%",
    maxWidth: isTablet ? 700 : undefined,
    alignSelf: "center",
  },

  themeHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },

  themeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  themeTitle: {
    flex: 1,
    fontSize: scale(18),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  themeChevron: {
    fontSize: scale(14),
    color: "#D4AF37",
  },

  themeExpanded: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  themeVerse: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  themeVerseText: {
    fontSize: scale(16),
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: scale(26),
    marginBottom: 8,
  },

  themeVerseRef: {
    fontSize: scale(13),
    color: "#D4AF37",
    fontWeight: "600",
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
