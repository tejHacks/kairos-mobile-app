import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import { PrayerTimer } from "../../components/PrayerTimer";
import { SacredHourDisplay } from "../../components/SacredHourDisplay";
import { COLORS } from "../../constants/appConstants";
import { usePrayerState, ViewState } from "../../hooks/usePrayerState";
import { usePrayerTimes } from "../../hooks/usePrayerTimes";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";
import TopBar from "../../components/TopBar";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width } = Dimensions.get("window");

const PRAYER_SCRIPTURES = [
  { ref: "1 Thessalonians 5:17", text: "Pray without ceasing." },
  {
    ref: "Jeremiah 29:13",
    text: "Ye shall seek me, and find me, when ye shall search for me with all your heart.",
  },
  {
    ref: "Philippians 4:6",
    text: "In every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
  },
  {
    ref: "Ephesians 6:18",
    text: "Praying always with all prayer and supplication in the Spirit.",
  },
  {
    ref: "Psalm 145:18",
    text: "The Lord is nigh unto all them that call upon him, to all that call upon him in truth.",
  },
  {
    ref: "James 5:16",
    text: "The effectual fervent prayer of a righteous man availeth much.",
  },
  {
    ref: "Matthew 21:22",
    text: "And all things, whatsoever ye shall ask in prayer, believing, ye shall receive.",
  },
];

const ANCHOR_SCRIPTURES = [
  { ref: "Luke 18:1", text: "Men ought always to pray, and not to faint." },
  {
    ref: "Psalm 55:17",
    text: "Evening, and morning, and at noon, will I pray, and cry aloud: and he shall hear my voice.",
  },
  {
    ref: "1 Chronicles 16:11",
    text: "Seek the Lord and his strength, seek his face continually.",
  },
  {
    ref: "Colossians 4:2",
    text: "Continue in prayer, and watch in the same with thanksgiving.",
  },
  {
    ref: "Romans 12:12",
    text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const format12h = (time24: string): string => {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
};

const getGreeting = (date: Date): string => {
  const h = date.getHours();
  if (h >= 0 && h < 5) return "Good Night";
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 17) return "Good Afternoon";
  if (h >= 17 && h < 21) return "Good Evening";
  return "Good Night";
};

/** Minutes until a "HH:MM" time from now */
const minsUntil = (time24: string): number => {
  const [hh, mm] = time24.split(":").map(Number);
  const now = new Date();
  const target = hh * 60 + mm;
  const current = now.getHours() * 60 + now.getMinutes();
  const diff = target - current;
  return diff > 0 ? diff : diff + 1440; // wrap to tomorrow
};

const formatUntil = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Home() {
  const insets = useSafeAreaInsets();
  const { getNextPrayer } = usePrayerTimes();
  const { savePrayerState, loadPrayerState, clearPrayerState } =
    usePrayerState();

  const [now, setNow] = useState(new Date());
  const [view, setView] = useState<ViewState>("altar");
  const [duration, setDuration] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [prayerStartTime, setPrayerStartTime] = useState<number | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // ── Static memos ──
  const anchorScripture = useMemo(
    () =>
      ANCHOR_SCRIPTURES[Math.floor(Math.random() * ANCHOR_SCRIPTURES.length)],
    [],
  );

  // ── Live clock ──
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Restore prayer session on mount ──
  useEffect(() => {
    (async () => {
      const restored = await loadPrayerState();
      if (!restored) return;
      setView(restored.view);
      setDuration(restored.duration);
      setPrayerStartTime(restored.prayerStartTime);
      if (restored.prayerStartTime) {
        const elapsed = Math.floor(
          (Date.now() - restored.prayerStartTime) / 1000,
        );
        if (restored.duration) {
          setRemaining(Math.max(0, restored.duration - elapsed));
        } else {
          setRemaining(elapsed);
        }
      }
    })();
  }, [loadPrayerState]);

  // ── Save session when active ──
  useEffect(() => {
    if (view === "praying" && prayerStartTime) {
      savePrayerState(view, duration, prayerStartTime, remaining);
    }
  }, [view, duration, remaining, prayerStartTime, savePrayerState]);

  // ── App foreground/background ──
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      const isNowActive = next === "active";
      const isNowBackground = next.match(/inactive|background/);

      if (wasBackground && isNowActive) {
        if (view === "praying" && prayerStartTime) {
          const elapsed = Math.floor((Date.now() - prayerStartTime) / 1000);
          if (duration) {
            setRemaining(Math.max(0, duration - elapsed));
          } else {
            setRemaining(elapsed);
          }
        }
        if (Platform.OS === "android") Vibration.cancel();
      }

      if (appState.current === "active" && isNowBackground) {
        if (view === "praying" && prayerStartTime) {
          savePrayerState(view, duration, prayerStartTime, remaining);
        }
      }

      appState.current = next;
    });
    return () => sub.remove();
  }, [view, duration, remaining, prayerStartTime, savePrayerState]);

  // ── Prayer countdown / countup ──
  useEffect(() => {
    if (view !== "praying" || !prayerStartTime) return;
    const interval = setInterval(() => {
      if (duration) {
        setRemaining((r) => Math.max(0, r - 1));
      } else {
        setRemaining((r) => r + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [view, duration, prayerStartTime]);

  // ── Auto-finish timed prayer ──
  useEffect(() => {
    if (duration && remaining <= 0 && view === "praying") {
      setShowModal(true);
    }
  }, [remaining, duration, view]);

  // ── Pulse for upcoming prayer ──
  const nextPrayer = useMemo(() => getNextPrayer(), [getNextPrayer]);

  const isTimeNow = useMemo(() => {
    if (!nextPrayer) return false;
    const [hh, mm] = nextPrayer.time.split(":").map(Number);
    return now.getHours() === hh && now.getMinutes() === mm;
  }, [nextPrayer, now]);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isTimeNow) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => loop?.stop();
  }, [isTimeNow, pulseAnim]);

  // ── Scripture rotation during prayer ──
  const activeScripture = useMemo(() => {
    const idx =
      Math.floor(Math.abs(remaining) / 120) % PRAYER_SCRIPTURES.length;
    return PRAYER_SCRIPTURES[idx];
  }, [remaining]);

  // ── Derived ──
  const greeting = useMemo(() => getGreeting(now), [now]);
  const canFinish = duration === null || (duration !== null && remaining <= 0);
  const minutes = Math.floor(Math.abs(remaining) / 60);
  const seconds = Math.abs(remaining) % 60;

  // ── Handlers ──
  const handleStartPraying = useCallback(() => {
    const startTime = Date.now();
    setRemaining(duration ?? 0);
    setPrayerStartTime(startTime);
    setView("praying");
    savePrayerState("praying", duration, startTime, 0);
  }, [duration, savePrayerState]);

  const handleFinish = useCallback(() => setShowModal(true), []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setView("altar");
    setPrayerStartTime(null);
    setDuration(null);
    setRemaining(0);
    clearPrayerState();
  }, [clearPrayerState]);

  const handleBackToAltar = useCallback(() => {
    setView("altar");
    setPrayerStartTime(null);
    setDuration(null);
    setRemaining(0);
    clearPrayerState();
  }, [clearPrayerState]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.secondary, COLORS.background]}
      style={{ flex: 1 }}
    >
      {/* // Remove appTitle Text, add above ScrollView: */}
      <TopBar title="Altar" subtitle="Come before the throne" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + scaleSize(16),
          paddingBottom: insets.bottom + verticalScale(100),
          paddingHorizontal: scaleSize(24),
          alignItems: "center",
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ALTAR VIEW ── */}
        {view === "altar" && (
          <>

            {/* Live clock */}
            <Text style={styles.time}>
              {now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            <Text style={styles.greeting}>{greeting}</Text>

            {/* Anchor scripture */}
            <View style={[styles.card, { width: width * 0.9, maxWidth: 440 }]}>
              <Text style={styles.scriptureText}>{anchorScripture.text}</Text>
              <View style={styles.divider} />
              <Text style={styles.scriptureRef}>{anchorScripture.ref}</Text>
            </View>

            {/* ── Next Prayer Card — from user's actual times ── */}
            {nextPrayer ? (
              <Animated.View
                style={[
                  styles.nextPrayerCard,
                  { transform: [{ scale: pulseAnim }] },
                  isTimeNow && styles.nextPrayerCardActive,
                ]}
              >
                {isTimeNow && (
                  <View style={styles.nowBadge}>
                    <Text style={styles.nowBadgeText}>NOW</Text>
                  </View>
                )}
                <Text style={styles.nextPrayerLabel}>
                  {isTimeNow ? "It's time to pray" : "Next Prayer"}
                </Text>
                <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
                <Text style={styles.nextPrayerTime}>
                  {format12h(nextPrayer.time)}
                  {!isTimeNow && (
                    <Text style={styles.nextPrayerCountdown}>
                      {"  ·  "}in {formatUntil(minsUntil(nextPrayer.time))}
                    </Text>
                  )}
                </Text>
                {!!nextPrayer.subtitle && (
                  <Text style={styles.nextPrayerSubtitle}>
                    {nextPrayer.subtitle}
                  </Text>
                )}
              </Animated.View>
            ) : (
              <View style={styles.noTimesCard}>
                <Text style={styles.noTimesText}>
                  No prayer times set.{"\n"}Go to Kairos to add them.
                </Text>
              </View>
            )}

            {/* Sacred hour banner (if current time matches a user prayer) */}
            {isTimeNow && nextPrayer && (
              <SacredHourDisplay
                currentSacredHour={{
                  hour: parseInt(nextPrayer.time.split(":")[0]),
                  name: nextPrayer.name,
                  subtitle: nextPrayer.subtitle,
                }}
                pulseAnim={pulseAnim}
              />
            )}

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setView("selectDuration")}
            >
              <Text style={styles.startIcon}>✨</Text>
              <Text style={styles.startText}>START PRAYING</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              &quot;LORD, TEACH US TO PRAY&quot;
            </Text>
          </>
        )}

        {/* ── SELECT DURATION ── */}
        {view === "selectDuration" && (
          <>
            <TouchableOpacity
              onPress={handleBackToAltar}
              style={{ alignSelf: "flex-start", marginBottom: scaleSize(8) }}
            >
              <Text style={styles.back}>← Go Back</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Choose Prayer Time</Text>

            {[5, 10, 15, 30, 45, 60].map((min) => {
              const selected = duration === min * 60;
              return (
                <TouchableOpacity
                  key={min}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setDuration(min * 60)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {min} Minutes
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.option,
                duration === null && styles.optionSelected,
              ]}
              onPress={() => setDuration(null)}
            >
              <Text
                style={[
                  styles.optionText,
                  duration === null && styles.optionTextSelected,
                ]}
              >
                I just wanna speak with God
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartPraying}
            >
              <Text style={styles.startIcon}>✨</Text>
              <Text style={styles.startText}>START PRAYING</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── PRAYING ── */}
        {view === "praying" && (
          <>
            <PrayerTimer
              minutes={minutes}
              seconds={seconds}
              canFinishPrayer={canFinish}
              onBack={handleBackToAltar}
              onFinish={handleFinish}
            />
            <View
              style={[
                styles.card,
                { width: width * 0.9, maxWidth: 440, marginTop: scaleSize(20) },
              ]}
            >
              <Text style={styles.scriptureText}>{activeScripture.text}</Text>
              <View style={styles.divider} />
              <Text style={styles.scriptureRef}>{activeScripture.ref}</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Finish Modal ── */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Pause. Write. Listen.</Text>
          <Text style={styles.modalText}>
            Write what the Lord has spoken. Guard it.
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleCloseModal}
          >
            <Text style={styles.startText}>AMEN</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  appTitle: {
    fontSize: scaleFont(18),
    color: COLORS.primary,
    letterSpacing: 5,
    fontWeight: "700",
    marginBottom: scaleSize(32),
  },
  time: {
    fontSize: scaleFont(42),
    color: COLORS.primary,
    fontWeight: "200",
    letterSpacing: 2,
    marginBottom: scaleSize(8),
  },
  greeting: {
    fontSize: scaleFont(22),
    fontWeight: "400",
    color: COLORS.text,
    marginBottom: scaleSize(24),
    textAlign: "center",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    padding: scaleSize(22),
    borderRadius: scaleSize(18),
    marginVertical: scaleSize(12),
    alignSelf: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scriptureText: {
    color: COLORS.text,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(24),
    textAlign: "center",
    fontStyle: "italic",
  },
  divider: {
    width: scaleSize(36),
    height: 1,
    backgroundColor: COLORS.primary,
    alignSelf: "center",
    marginVertical: scaleSize(10),
  },
  scriptureRef: {
    color: COLORS.primary,
    fontSize: scaleFont(11),
    textAlign: "center",
    letterSpacing: 1,
  },

  // ── Next prayer card ──
  nextPrayerCard: {
    width: width * 0.9,
    maxWidth: 440,
    backgroundColor: "rgba(212,175,55,0.07)",
    borderRadius: scaleSize(18),
    padding: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    alignItems: "center",
    marginVertical: scaleSize(12),
  },
  nextPrayerCardActive: {
    backgroundColor: "rgba(212,175,55,0.14)",
    borderColor: "rgba(212,175,55,0.5)",
  },
  nowBadge: {
    backgroundColor: "#D4AF37",
    borderRadius: scaleSize(20),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(3),
    marginBottom: scaleSize(8),
  },
  nowBadgeText: {
    color: "#1a0f2e",
    fontSize: scaleFont(10),
    fontWeight: "800",
    letterSpacing: 2,
  },
  nextPrayerLabel: {
    fontSize: scaleFont(10),
    color: "rgba(212,175,55,0.6)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: scaleSize(6),
  },
  nextPrayerName: {
    fontSize: scaleFont(20),
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.3,
    marginBottom: scaleSize(4),
  },
  nextPrayerTime: {
    fontSize: scaleFont(14),
    color: "#D4AF37",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  nextPrayerCountdown: {
    fontSize: scaleFont(12),
    color: "rgba(212,175,55,0.55)",
    fontWeight: "400",
  },
  nextPrayerSubtitle: {
    fontSize: scaleFont(11),
    color: "rgba(255,255,255,0.35)",
    marginTop: scaleSize(4),
    textAlign: "center",
  },
  noTimesCard: {
    width: width * 0.9,
    maxWidth: 440,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: scaleSize(18),
    padding: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    marginVertical: scaleSize(12),
  },
  noTimesText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: scaleFont(13),
    textAlign: "center",
    lineHeight: scaleFont(20),
  },

  // ── Buttons ──
  startButton: {
    backgroundColor: "transparent",
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(48),
    borderRadius: scaleSize(40),
    marginTop: scaleSize(24),
    marginBottom: scaleSize(16),
    minWidth: scaleSize(240),
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scaleSize(8),
  },
  startIcon: { fontSize: scaleFont(16) },
  startText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: scaleFont(14),
    letterSpacing: 2,
  },
  footerText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: scaleFont(10),
    marginTop: scaleSize(8),
    letterSpacing: 2,
    fontStyle: "italic",
  },
  back: {
    color: COLORS.primary,
    fontSize: scaleFont(15),
    marginVertical: scaleSize(12),
    fontWeight: "600",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: scaleFont(22),
    fontWeight: "400",
    marginBottom: scaleSize(24),
    textAlign: "center",
    letterSpacing: 0.5,
  },
  option: {
    backgroundColor: "rgba(255,255,255,0.07)",
    padding: scaleSize(16),
    borderRadius: scaleSize(16),
    width: width * 0.88,
    maxWidth: 400,
    marginVertical: scaleSize(6),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  optionSelected: {
    backgroundColor: "rgba(212,175,55,0.12)",
    borderColor: COLORS.primary,
  },
  optionText: {
    color: COLORS.text,
    fontSize: scaleFont(15),
    textAlign: "center",
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: scaleSize(36),
  },
  modalTitle: {
    fontSize: scaleFont(26),
    color: COLORS.text,
    marginBottom: scaleSize(20),
    textAlign: "center",
    fontWeight: "400",
  },
  modalText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: scaleFont(15),
    textAlign: "center",
    marginBottom: scaleSize(40),
    lineHeight: scaleFont(24),
  },
});
