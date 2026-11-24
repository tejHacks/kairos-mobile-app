import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Clock,
  Droplets,
  Heart,
  Moon,
  Play,
  Smartphone,
  Snowflake,
  Square,
  Sun,
  Sunrise,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";
import {
  scheduleFastingReminders,
  getFastingSchedule,
  to12Hour,
  to24Hour,
  WEEKDAYS,
} from "../../hooks/useFastingReminders";
import Navbar from "@/components/Navbar";
import TopBar from "../../components/TopBar";

import { c } from "@/constants/theme";

// ─── Types ──────────────────────────────────────────────────────────────────

type FastType = "water" | "partial" | "daniel" | "full" | "phone" | "word" | "dry";

interface FastState {
  active: boolean;
  type: FastType;
  startTime: number | null;
  plannedEnd: number | null;
  selectedDays: string[];
  dailyFast: boolean;
}

const STORAGE_KEY = "@kairos/fast_state";

// ─── Fast plan library ──────────────────────────────────────────────────────

const FAST_PLANS: {
  id: FastType;
  label: string;
  desc: string;
  icon: React.FC<any>;
  intensity: "gentle" | "moderate" | "intense";
  benefits: string[];
  verse: string;
  ref: string;
}[] = [
  {
    id: "water",
    label: "Water Fast",
    desc: "Water only — no food",
    icon: Droplets,
    intensity: "moderate",
    benefits: [
      "Deep focus — hunger reminds you to keep returning to prayer",
      "Traditional biblical pattern used throughout scripture",
      "Physically resets appetite and cravings",
    ],
    verse: "But thou, when thou fastest, anoint thine head, and wash thy face;",
    ref: "Matthew 6:17",
  },
  {
    id: "partial",
    label: "Partial Fast",
    desc: "One meal a day",
    icon: Sun,
    intensity: "gentle",
    benefits: [
      "Sustainable for daily life, work, and family responsibilities",
      "A good entry point if you're new to fasting",
      "Still creates real hunger that turns you toward God",
    ],
    verse: "So we fasted and besought our God for this: and he was intreated of us.",
    ref: "Ezra 8:23",
  },
  {
    id: "daniel",
    label: "Daniel Fast",
    desc: "Vegetables & water only",
    icon: Sunrise,
    intensity: "gentle",
    benefits: [
      "Extended fasts (10+ days) are realistic on this plan",
      "Removes rich food and indulgence while keeping strength up",
      "Modeled directly after Daniel's discipline in captivity",
    ],
    verse: "I ate no pleasant bread, neither came flesh nor wine in my mouth.",
    ref: "Daniel 10:3",
  },
  {
    id: "full",
    label: "Full Fast",
    desc: "Nothing — complete denial",
    icon: Moon,
    intensity: "intense",
    benefits: [
      "The most complete form of self-denial",
      "Reserved for serious, focused seasons of prayer",
      "Keep these shorter — 24-72 hours — unless medically guided",
    ],
    verse: "Turn ye even to me with all your heart, and with fasting, and with weeping, and with mourning.",
    ref: "Joel 2:12",
  },
  {
    id: "phone",
    label: "Phone Fast",
    desc: "Step away from your phone",
    icon: Smartphone,
    intensity: "gentle",
    benefits: [
      "Removes the biggest daily distraction from your attention",
      "Frees real hours for scripture, prayer, and stillness",
      "Can be combined with any food fast, or done on its own",
    ],
    verse: "Be still, and know that I am God.",
    ref: "Psalm 46:10",
  },
  {
    id: "word",
    label: "Word Fast",
    desc: "Eyes only on scripture for set hours",
    icon: BookOpen,
    intensity: "gentle",
    benefits: [
      "Trains your attention back to God's voice above every other input",
      "Great for a set window each day — mornings or evenings",
      "Pairs naturally with a phone fast",
    ],
    verse: "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.",
    ref: "Matthew 4:4",
  },
  {
    id: "dry",
    label: "Dry Fast",
    desc: "No food or water",
    icon: Snowflake,
    intensity: "intense",
    benefits: [
      "The most intense discipline in scripture — used rarely, for a reason",
      "Traditionally kept very short (hours, not days)",
      "Requires real physical caution — see health notes below",
    ],
    verse: "Fast ye for me, and neither eat nor drink three days, night or day.",
    ref: "Esther 4:16",
  },
];

const planById = (id: FastType) => FAST_PLANS.find((p) => p.id === id)!;

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDuration = (ms: number): { h: string; m: string; s: string } => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(sec).padStart(2, "0"),
  };
};

const formatClock = (epoch: number): string =>
  new Date(epoch).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Arc progress ───────────────────────────────────────────────────────────

const ArcRing: React.FC<{ progress: number; size: number }> = ({ progress, size }) => {
  const strokeW = scaleSize(6);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: size - strokeW,
          height: size - strokeW,
          borderRadius: (size - strokeW) / 2,
          borderWidth: strokeW,
          borderColor: c.goldA(0.1),
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size - strokeW,
          height: size - strokeW,
          borderRadius: (size - strokeW) / 2,
          borderWidth: strokeW,
          borderTopColor: progress > 0 ? c.gold : "transparent",
          borderRightColor: progress > 0.25 ? c.gold : "transparent",
          borderBottomColor: progress > 0.5 ? c.gold : "transparent",
          borderLeftColor: progress > 0.75 ? c.gold : "transparent",
          transform: [{ rotate: "-90deg" }],
        }}
      />
    </View>
  );
};

// ─── Main screen ────────────────────────────────────────────────────────────

export default function FastingScreen() {
  const insets = useSafeAreaInsets();

  const [fast, setFast] = useState<FastState>({
    active: false,
    type: "water",
    startTime: null,
    plannedEnd: null,
    selectedDays: [],
    dailyFast: false,
  });
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<FastType | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const [sheetPlan, setSheetPlan] = useState<FastType | null>(null);
  const [tempStart, setTempStart] = useState(new Date());
  const [tempEnd, setTempEnd] = useState(new Date(Date.now() + 6 * 3600_000));
  const [pickerField, setPickerField] = useState<"start" | "end" | null>(null);

  // ── Reminder time (hour 1-12 + AM/PM) ──
  const [reminderHour12, setReminderHour12] = useState(6);
  const [reminderPeriod, setReminderPeriod] = useState<"AM" | "PM">("AM");
  const [hourDropdownOpen, setHourDropdownOpen] = useState(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  // "Why Fast" greets you each time you arrive on Fasting (unless a fast is
  // running) and closes when you leave, so it never floats over other screens.
  const activeRef = useRef(false);
  activeRef.current = fast.active;
  const loadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (loadedRef.current && !activeRef.current) setWhyOpen(true);
      return () => setWhyOpen(false);
    }, []),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: FastState = JSON.parse(raw);
          setFast(saved);
          if (saved.active && saved.startTime) setElapsed(Date.now() - saved.startTime);
        }
        loadedRef.current = true;
        setWhyOpen(!(raw && JSON.parse(raw).active));
        const schedule = await getFastingSchedule();
        const { hour12, period } = to12Hour(schedule.reminderHour);
        setReminderHour12(hour12);
        setReminderPeriod(period);
      } catch (e) {
        console.error("[Kairos] Failed to load fast state:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (fast.active && fast.startTime) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - (fast.startTime ?? Date.now())), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fast.active, fast.startTime]);

  useEffect(() => {
    if (fast.active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [fast.active]);

  const persist = useCallback(async (state: FastState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("[Kairos] Failed to save fast state:", e);
    }
  }, []);

  // ── Schedule (days of the week / daily) — now actually reminds them ──
  const toggleDay = (day: string) => {
    const next: FastState = {
      ...fast,
      dailyFast: false,
      selectedDays: fast.selectedDays.includes(day)
        ? fast.selectedDays.filter((d) => d !== day)
        : [...fast.selectedDays, day],
    };
    setFast(next);
    persist(next);
    scheduleFastingReminders(
      next.selectedDays,
      next.dailyFast,
      to24Hour(reminderHour12, reminderPeriod),
      0,
    );
  };

  const toggleDaily = (value: boolean) => {
    const next: FastState = { ...fast, dailyFast: value, selectedDays: value ? [] : fast.selectedDays };
    setFast(next);
    persist(next);
    scheduleFastingReminders(
      next.selectedDays,
      next.dailyFast,
      to24Hour(reminderHour12, reminderPeriod),
      0,
    );
  };

  // ── Reminder time change (hour and/or AM-PM dropdown) ──
  const updateReminderTime = (hour12: number, period: "AM" | "PM") => {
    setReminderHour12(hour12);
    setReminderPeriod(period);
    scheduleFastingReminders(fast.selectedDays, fast.dailyFast, to24Hour(hour12, period), 0);
  };

  const openSheet = (id: FastType) => {
    const now = new Date();
    setTempStart(now);
    setTempEnd(new Date(now.getTime() + 6 * 3600_000));
    setSheetPlan(id);
  };

  const confirmStart = () => {
    if (tempEnd.getTime() <= tempStart.getTime()) {
      Alert.alert("Check your times", "End time should be after your start time.");
      return;
    }
    const next: FastState = {
      ...fast,
      active: true,
      type: sheetPlan!,
      startTime: tempStart.getTime(),
      plannedEnd: tempEnd.getTime(),
    };
    setFast(next);
    setElapsed(Date.now() - tempStart.getTime());
    persist(next);
    setSheetPlan(null);
  };

  const endFast = () => {
    Alert.alert(
      "End Fast",
      `You've fasted for ${time.h}h ${time.m}m. Break your fast gently — start with water, then light food.`,
      [
        { text: "Continue Fasting", style: "cancel" },
        {
          text: "End Fast",
          style: "destructive",
          onPress: () => {
            const next: FastState = { ...fast, active: false, startTime: null, plannedEnd: null };
            setFast(next);
            setElapsed(0);
            persist(next);
          },
        },
      ],
    );
  };

  const time = formatDuration(elapsed);
  const activePlan = planById(fast.type);
  const progress = fast.plannedEnd && fast.startTime ? elapsed / (fast.plannedEnd - fast.startTime) : elapsed / (24 * 3600_000);
  const arcSize = scaleSize(200);
  const showsDryToggleFor = (id: FastType) => id !== "phone" && id !== "word";

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <Droplets size={scaleSize(28)} color={c.gold} strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="Fasting" subtitle="Deny yourself · Draw near" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: scaleSize(16),
          paddingTop: scaleSize(16),
          paddingBottom: verticalScale(150) + insets.bottom + scaleSize(24),
        }}
        showsVerticalScrollIndicator={false}
      >
        {fast.active ? (
          <>
            <View style={{ alignItems: "center", marginBottom: scaleSize(16) }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: scaleSize(6),
                  backgroundColor: c.goldA(0.12),
                  paddingHorizontal: scaleSize(12),
                  paddingVertical: scaleSize(6),
                  borderRadius: scaleSize(20),
                  borderWidth: 1,
                  borderColor: c.goldA(0.25),
                }}
              >
                <View style={{ width: scaleSize(6), height: scaleSize(6), borderRadius: scaleSize(3), backgroundColor: c.gold }} />
                <Text style={{ fontSize: scaleFont(11), color: c.gold, fontWeight: "600" }}>
                  {activePlan.label} · started {fast.startTime ? formatClock(fast.startTime) : ""}
                </Text>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: "center", marginBottom: scaleSize(8) }}>
              <ArcRing progress={progress} size={arcSize} />
              <View style={{ position: "absolute", alignItems: "center", justifyContent: "center", width: arcSize, height: arcSize }}>
                <Text style={{ fontSize: scaleFont(38), fontWeight: "200", color: c.text, letterSpacing: 4 }}>
                  {time.h}:{time.m}
                </Text>
                <Text style={{ fontSize: scaleFont(13), color: c.ink(0.35), letterSpacing: 2 }}>{time.s}s</Text>
                <Text style={{ fontSize: scaleFont(10), color: c.gold, letterSpacing: 1.5, marginTop: scaleSize(4) }}>
                  {activePlan.label.toUpperCase()}
                </Text>
              </View>
            </Animated.View>

            {fast.plannedEnd && (
              <Text
                style={{
                  textAlign: "center",
                  fontSize: scaleFont(12),
                  color: c.ink(0.4),
                  marginBottom: scaleSize(20),
                }}
              >
                Planned end: {formatClock(fast.plannedEnd)}
              </Text>
            )}

            <View
              style={{
                width: "100%",
                backgroundColor: c.bg,
                borderRadius: scaleSize(16),
                padding: scaleSize(18),
                borderWidth: 1,
                borderColor: c.goldA(0.12),
                marginBottom: scaleSize(20),
              }}
            >
              <Text style={{ fontSize: scaleFont(10), color: c.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: scaleSize(10) }}>
                Scripture
              </Text>
              <Text style={{ fontSize: scaleFont(14), color: c.ink(0.8), lineHeight: scaleFont(22), fontStyle: "italic" }}>
                &quot;{activePlan.verse}&quot;
              </Text>
              <Text style={{ fontSize: scaleFont(11), color: c.goldA(0.6), marginTop: scaleSize(10), textAlign: "right" }}>
                — {activePlan.ref}
              </Text>
            </View>

            <HealthNote />

            <TouchableOpacity
              onPress={endFast}
              activeOpacity={0.85}
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: scaleSize(10),
                backgroundColor: "rgba(255,80,80,0.12)",
                borderRadius: scaleSize(14),
                paddingVertical: scaleSize(16),
                borderWidth: 1,
                borderColor: "rgba(255,80,80,0.25)",
                marginTop: scaleSize(20),
              }}
            >
              <Square size={scaleSize(16)} color={c.danger} strokeWidth={2} />
              <Text style={{ color: c.danger, fontSize: scaleFont(15), fontWeight: "700", letterSpacing: 0.8 }}>End Fast</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={sectionLabelStyle}>Set Your Rhythm</Text>
            <View
              style={{
                backgroundColor: c.surface,
                borderRadius: scaleSize(16),
                padding: scaleSize(16),
                borderWidth: 1,
                borderColor: c.ink(0.06),
                marginBottom: scaleSize(20),
              }}
            >
              <Text style={{ fontSize: scaleFont(12), color: c.ink(0.5), marginBottom: scaleSize(12) }}>
                Pick the days you plan to fast each week, or fast daily. We'll remind you at the time you choose below.
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: scaleSize(8), marginBottom: scaleSize(14) }}>
                {WEEKDAYS.map((day) => {
                  const selected = fast.selectedDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDay(day)}
                      disabled={fast.dailyFast}
                      style={{
                        width: scaleSize(40),
                        height: scaleSize(40),
                        borderRadius: scaleSize(20),
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected ? c.gold : c.ink(0.06),
                        opacity: fast.dailyFast ? 0.35 : 1,
                      }}
                    >
                      <Text style={{ fontSize: scaleFont(11), fontWeight: "700", color: selected ? c.bg : c.ink(0.5) }}>
                        {day[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: scaleFont(13), color: c.text, fontWeight: "600" }}>Fast daily</Text>
                <Switch
                  value={fast.dailyFast}
                  onValueChange={toggleDaily}
                  trackColor={{ false: c.ink(0.1), true: c.goldA(0.4) }}
                  thumbColor={fast.dailyFast ? c.gold : c.textMuted}
                />
              </View>

              <View style={{ height: 1, backgroundColor: c.wash(0.06), marginTop: scaleSize(14), marginBottom: scaleSize(14) }} />

              <Text style={{ fontSize: scaleFont(13), color: c.text, fontWeight: "600", marginBottom: scaleSize(10) }}>
                Reminder time
              </Text>
              <View style={{ flexDirection: "row", gap: scaleSize(10) }}>
                {/* Hour dropdown */}
                <TouchableOpacity
                  onPress={() => setHourDropdownOpen(true)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: c.surface2,
                    borderRadius: scaleSize(12),
                    paddingHorizontal: scaleSize(14),
                    paddingVertical: scaleSize(12),
                  }}
                >
                  <Text style={{ fontSize: scaleFont(14), color: c.gold, fontWeight: "700" }}>{reminderHour12}:00</Text>
                  <ChevronDown size={scaleSize(14)} color={c.ink(0.4)} strokeWidth={2} />
                </TouchableOpacity>

                {/* AM/PM dropdown */}
                <TouchableOpacity
                  onPress={() => setPeriodDropdownOpen(true)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: c.surface2,
                    borderRadius: scaleSize(12),
                    paddingHorizontal: scaleSize(14),
                    paddingVertical: scaleSize(12),
                  }}
                >
                  <Text style={{ fontSize: scaleFont(14), color: c.gold, fontWeight: "700" }}>{reminderPeriod}</Text>
                  <ChevronDown size={scaleSize(14)} color={c.ink(0.4)} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: scaleFont(11), color: c.ink(0.3), marginTop: scaleSize(8) }}>
                We'll notify you at {reminderHour12}:00 {reminderPeriod} on{" "}
                {fast.dailyFast ? "every day you've set to fast daily" : "each selected day"}.
              </Text>
            </View>

            <Text style={sectionLabelStyle}>Choose Your Plan</Text>
            <View style={{ gap: scaleSize(8), marginBottom: scaleSize(20) }}>
              {FAST_PLANS.map((plan) => {
                const expanded = expandedPlan === plan.id;
                const Icon = plan.icon;
                return (
                  <View
                    key={plan.id}
                    style={{
                      backgroundColor: c.surface,
                      borderRadius: scaleSize(14),
                      borderWidth: 1,
                      borderColor: expanded ? c.goldA(0.25) : c.ink(0.05),
                      overflow: "hidden",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setExpandedPlan(expanded ? null : plan.id)}
                      activeOpacity={0.75}
                      style={{ flexDirection: "row", alignItems: "center", padding: scaleSize(14) }}
                    >
                      <View
                        style={{
                          width: scaleSize(38),
                          height: scaleSize(38),
                          borderRadius: scaleSize(10),
                          backgroundColor: c.goldA(0.1),
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: scaleSize(12),
                        }}
                      >
                        <Icon size={scaleSize(17)} color={c.gold} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSize(6) }}>
                          <Text style={{ fontSize: scaleFont(13), fontWeight: "600", color: c.text }}>{plan.label}</Text>
                          {plan.intensity === "intense" && <AlertTriangle size={scaleSize(12)} color="#F59E0B" strokeWidth={2} />}
                        </View>
                        <Text style={{ fontSize: scaleFont(11), color: c.ink(0.4), marginTop: 2 }}>{plan.desc}</Text>
                      </View>
                      <Animated.View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
                        <ChevronDown size={scaleSize(16)} color={c.ink(0.4)} strokeWidth={2} />
                      </Animated.View>
                    </TouchableOpacity>

                    {expanded && (
                      <View style={{ paddingHorizontal: scaleSize(14), paddingBottom: scaleSize(14) }}>
                        <View style={{ height: 1, backgroundColor: c.wash(0.06), marginBottom: scaleSize(12) }} />
                        {plan.benefits.map((b, i) => (
                          <View key={i} style={{ flexDirection: "row", marginBottom: scaleSize(6) }}>
                            <Text style={{ color: c.gold, marginRight: scaleSize(6), fontSize: scaleFont(12) }}>·</Text>
                            <Text style={{ flex: 1, fontSize: scaleFont(12), color: c.ink(0.6), lineHeight: scaleFont(18) }}>
                              {b}
                            </Text>
                          </View>
                        ))}
                        <Text
                          style={{
                            fontSize: scaleFont(11),
                            color: c.goldA(0.6),
                            fontStyle: "italic",
                            marginTop: scaleSize(8),
                            marginBottom: scaleSize(14),
                          }}
                        >
                          &quot;{plan.verse}&quot; — {plan.ref}
                        </Text>
                        <TouchableOpacity
                          onPress={() => openSheet(plan.id)}
                          activeOpacity={0.85}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: scaleSize(8),
                            backgroundColor: c.goldFill,
                            borderRadius: scaleSize(12),
                            paddingVertical: scaleSize(12),
                          }}
                        >
                          <Play size={scaleSize(14)} color={c.onGoldFill} strokeWidth={2} fill={c.onGoldFill} />
                          <Text style={{ color: c.onGoldFill, fontSize: scaleFont(13), fontWeight: "800" }}>Start Fast</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <HealthNote />
          </>
        )}
      </ScrollView>

      <Navbar />

      <WhyFastModal visible={whyOpen} onClose={() => setWhyOpen(false)} />

      <Modal visible={sheetPlan !== null} transparent animationType="slide" onRequestClose={() => setSheetPlan(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: c.overlay }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSheetPlan(null)} />
          <View
            style={{
              backgroundColor: c.bg,
              borderTopLeftRadius: scaleSize(20),
              borderTopRightRadius: scaleSize(20),
              padding: scaleSize(20),
              paddingBottom: scaleSize(20) + insets.bottom,
              borderWidth: 1,
              borderColor: c.goldA(0.15),
            }}
          >
            {sheetPlan && (
              <>
                <Text style={{ fontSize: scaleFont(18), fontWeight: "700", color: c.text, marginBottom: scaleSize(4) }}>
                  {planById(sheetPlan).label}
                </Text>
                <Text style={{ fontSize: scaleFont(12), color: c.ink(0.4), marginBottom: scaleSize(18) }}>
                  Pick when you'll start and when you plan to end.
                </Text>

                <TimeRow label="Start time" value={tempStart} onPress={() => setPickerField("start")} />
                <TimeRow label="End time" value={tempEnd} onPress={() => setPickerField("end")} />

                {showsDryToggleFor(sheetPlan) && sheetPlan !== "dry" && (
                  <Text style={{ fontSize: scaleFont(11), color: c.ink(0.3), marginTop: scaleSize(4), marginBottom: scaleSize(16) }}>
                    Want a stricter version? Choose the Dry Fast plan above instead of toggling mid-fast.
                  </Text>
                )}

                {sheetPlan === "dry" && (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: scaleSize(8),
                      backgroundColor: "rgba(245,158,11,0.1)",
                      borderRadius: scaleSize(12),
                      padding: scaleSize(12),
                      marginTop: scaleSize(4),
                      marginBottom: scaleSize(16),
                      borderWidth: 1,
                      borderColor: "rgba(245,158,11,0.25)",
                    }}
                  >
                    <AlertTriangle size={scaleSize(16)} color="#F59E0B" strokeWidth={2} />
                    <Text style={{ flex: 1, fontSize: scaleFont(12), color: c.ink(0.7), lineHeight: scaleFont(18) }}>
                      No food or water. Keep this short (a few hours, not days), stop immediately if you feel
                      unwell, and skip this entirely if pregnant, nursing, diabetic, or on medication that
                      requires food or water.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={confirmStart}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: scaleSize(8),
                    backgroundColor: c.goldFill,
                    borderRadius: scaleSize(14),
                    paddingVertical: scaleSize(16),
                    marginTop: scaleSize(4),
                  }}
                >
                  <Play size={scaleSize(16)} color={c.onGoldFill} strokeWidth={2} fill={c.onGoldFill} />
                  <Text style={{ color: c.onGoldFill, fontSize: scaleFont(15), fontWeight: "800" }}>Start Fasting</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Hour picker */}
      <Modal visible={hourDropdownOpen} transparent animationType="fade" onRequestClose={() => setHourDropdownOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: c.overlay, justifyContent: "center", alignItems: "center" }}
          activeOpacity={1}
          onPress={() => setHourDropdownOpen(false)}
        >
          <View
            style={{
              backgroundColor: c.bg,
              borderRadius: scaleSize(16),
              padding: scaleSize(12),
              width: scaleSize(160),
              maxHeight: scaleSize(320),
              borderWidth: 1,
              borderColor: c.goldA(0.2),
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => {
                    updateReminderTime(h, reminderPeriod);
                    setHourDropdownOpen(false);
                  }}
                  style={{
                    paddingVertical: scaleSize(10),
                    paddingHorizontal: scaleSize(12),
                    borderRadius: scaleSize(8),
                    backgroundColor: h === reminderHour12 ? c.goldA(0.15) : "transparent",
                  }}
                >
                  <Text style={{ fontSize: scaleFont(14), color: h === reminderHour12 ? c.gold : c.text, textAlign: "center" }}>
                    {h}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AM/PM picker */}
      <Modal visible={periodDropdownOpen} transparent animationType="fade" onRequestClose={() => setPeriodDropdownOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: c.overlay, justifyContent: "center", alignItems: "center" }}
          activeOpacity={1}
          onPress={() => setPeriodDropdownOpen(false)}
        >
          <View
            style={{
              backgroundColor: c.bg,
              borderRadius: scaleSize(16),
              padding: scaleSize(12),
              width: scaleSize(120),
              borderWidth: 1,
              borderColor: c.goldA(0.2),
            }}
          >
            {(["AM", "PM"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  updateReminderTime(reminderHour12, p);
                  setPeriodDropdownOpen(false);
                }}
                style={{
                  paddingVertical: scaleSize(10),
                  paddingHorizontal: scaleSize(12),
                  borderRadius: scaleSize(8),
                  backgroundColor: p === reminderPeriod ? c.goldA(0.15) : "transparent",
                }}
              >
                <Text style={{ fontSize: scaleFont(14), color: p === reminderPeriod ? c.gold : c.text, textAlign: "center" }}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {pickerField && (
        <DateTimePicker
          value={pickerField === "start" ? tempStart : tempEnd}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_event, selectedDate) => {
            if (Platform.OS === "android") setPickerField(null);
            if (selectedDate) {
              if (pickerField === "start") setTempStart(selectedDate);
              else setTempEnd(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

// ─── Shared bits ────────────────────────────────────────────────────────────

const sectionLabelStyle = {
  fontSize: scaleFont(10),
  color: c.ink(0.25),
  letterSpacing: 2,
  textTransform: "uppercase" as const,
  marginBottom: scaleSize(10),
  marginLeft: scaleSize(4),
};

function TimeRow({ label, value, onPress }: { label: string; value: Date; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: c.bg,
        borderRadius: scaleSize(12),
        paddingHorizontal: scaleSize(14),
        paddingVertical: scaleSize(12),
        marginBottom: scaleSize(10),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSize(8) }}>
        <Clock size={scaleSize(14)} color={c.ink(0.4)} strokeWidth={2} />
        <Text style={{ fontSize: scaleFont(13), color: c.ink(0.6) }}>{label}</Text>
      </View>
      <Text style={{ fontSize: scaleFont(14), color: c.gold, fontWeight: "700" }}>
        {value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </TouchableOpacity>
  );
}

function WhyFastModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: "center", padding: scaleSize(24) }}>
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: scaleSize(24),
            padding: scaleSize(24),
            borderWidth: 1,
            borderColor: c.goldA(0.3),
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              position: "absolute",
              top: scaleSize(14),
              right: scaleSize(14),
              width: scaleSize(32),
              height: scaleSize(32),
              borderRadius: scaleSize(16),
              backgroundColor: c.ink(0.06),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={scaleSize(16)} color={c.text} strokeWidth={2.2} />
          </TouchableOpacity>

          <Text style={{ fontSize: scaleFont(11), color: c.gold, letterSpacing: 2, fontWeight: "800", marginBottom: scaleSize(8) }}>
            WHY FAST
          </Text>
          <Text style={{ fontSize: scaleFont(22), fontWeight: "800", color: c.text, marginBottom: scaleSize(12), paddingRight: scaleSize(30) }}>
            Fast often, and pray much.
          </Text>
          <Text style={{ fontSize: scaleFont(15), color: c.textSecondary, lineHeight: scaleFont(24) }}>
            Jesus Himself, full of the Spirit, went into the wilderness and fasted forty days before He began His
            ministry. Fasting was part of His rhythm, not a rare event. Make it part of yours too.
          </Text>
          <Text style={{ fontSize: scaleFont(13), color: c.textMuted, marginTop: scaleSize(14), fontStyle: "italic", lineHeight: scaleFont(20) }}>
            &quot;And Jesus being full of the Holy Ghost returned from Jordan, and was led by the Spirit into the
            wilderness, being forty days tempted of the devil. And in those days he did eat nothing.&quot;
          </Text>
          <Text style={{ fontSize: scaleFont(12), color: c.gold, marginTop: scaleSize(6), fontWeight: "700", textAlign: "right" }}>
            Luke 4:1-2
          </Text>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={{
              backgroundColor: c.goldFill,
              borderRadius: scaleSize(14),
              paddingVertical: scaleSize(15),
              alignItems: "center",
              marginTop: scaleSize(20),
            }}
          >
            <Text style={{ color: c.onGoldFill, fontSize: scaleFont(15), fontWeight: "800" }}>See Fasting Plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function HealthNote() {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: scaleSize(10),
        backgroundColor: "rgba(239,68,68,0.08)",
        borderRadius: scaleSize(14),
        padding: scaleSize(14),
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.2)",
      }}
    >
      <Heart size={scaleSize(16)} color={c.danger} strokeWidth={2} />
      <Text style={{ flex: 1, fontSize: scaleFont(12), color: c.ink(0.6), lineHeight: scaleFont(18) }}>
        Fast with wisdom, not just zeal. Break every fast gently — water first, then light food — rather than
        a heavy meal. Stop early if you feel faint, dizzy, or unwell. If you're pregnant, nursing, managing
        diabetes, or on medication, talk to a doctor before longer or drier fasts.
      </Text>
    </View>
  );
}
