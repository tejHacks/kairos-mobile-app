import { useRouter } from "expo-router";
import { ArrowRight, Bell, BellOff, Clock, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import TopBar from "../../components/TopBar";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";
import { PrayerHour, usePrayerTimes } from "../../hooks/usePrayerTimes";

import { c } from "@/constants/theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const split12h = (time24: string) => {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  return { clock: `${h % 12 === 0 ? 12 : h % 12}:${mStr}`, period: h >= 12 ? "PM" : "AM" };
};

const format12h = (time24: string) => {
  const { clock, period } = split12h(time24);
  return `${clock} ${period}`;
};

const clamp = (val: number, min: number, max: number): number => Math.min(max, Math.max(min, val));

const toMinutes = (time24: string) => {
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
};

/** The next enabled prayer time from now (wrapping to tomorrow), with minutes until it. */
function nextPrayer(hours: PrayerHour[], now: Date) {
  const enabled = hours.filter((h) => h.enabled);
  if (enabled.length === 0) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let best: { hour: PrayerHour; inMin: number } | null = null;
  for (const hour of enabled) {
    let diff = toMinutes(hour.time) - nowMin;
    if (diff <= 0) diff += 24 * 60;
    if (!best || diff < best.inMin) best = { hour, inMin: diff };
  }
  return best;
}

const formatIn = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `in ${m} min`;
  if (m === 0) return `in ${h} hr`;
  return `in ${h} hr ${m} min`;
};

// ─── Next prayer hero ─────────────────────────────────────────────────────────

function NextPrayerCard({ hours }: { hours: PrayerHour[] }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const next = useMemo(() => nextPrayer(hours, now), [hours, now]);
  const enabledCount = hours.filter((h) => h.enabled).length;

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: scaleSize(22),
        padding: scaleSize(20),
        borderWidth: 1,
        borderColor: c.goldA(0.25),
        marginBottom: scaleSize(14),
        overflow: "hidden",
      }}
    >
      {/* soft gold wash in the corner */}
      <View
        style={{
          position: "absolute",
          top: -scaleSize(60),
          right: -scaleSize(60),
          width: scaleSize(180),
          height: scaleSize(180),
          borderRadius: scaleSize(90),
          backgroundColor: c.goldA(0.08),
        }}
      />

      <Text style={s.eyebrow}>{next ? "NEXT PRAYER" : "NO ACTIVE PRAYERS"}</Text>

      {next ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: scaleSize(6) }}>
            <Text style={{ fontSize: scaleFont(44), fontWeight: "200", color: c.text, letterSpacing: 1 }}>
              {split12h(next.hour.time).clock}
            </Text>
            <Text style={{ fontSize: scaleFont(16), fontWeight: "700", color: c.gold, marginLeft: scaleSize(6) }}>
              {split12h(next.hour.time).period}
            </Text>
          </View>
          <Text style={{ fontSize: scaleFont(16), fontWeight: "700", color: c.text, marginTop: scaleSize(2) }}>
            {next.hour.name}
          </Text>
          <Text style={{ fontSize: scaleFont(12), color: c.textMuted, marginTop: scaleSize(2) }}>
            {formatIn(next.inMin)}
          </Text>
        </>
      ) : (
        <Text style={{ fontSize: scaleFont(14), color: c.textMuted, marginTop: scaleSize(8), lineHeight: scaleFont(21) }}>
          Turn on a prayer time below, or add a new one, and Kairos will remind you when it comes.
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: scaleSize(6),
          marginTop: scaleSize(14),
          paddingTop: scaleSize(12),
          borderTopWidth: 1,
          borderTopColor: c.ink(0.06),
        }}
      >
        <Bell size={scaleSize(12)} color={c.gold} strokeWidth={2.2} />
        <Text style={{ fontSize: scaleFont(12), color: c.textSecondary, fontWeight: "600" }}>
          {enabledCount} of {hours.length} reminders on
        </Text>
      </View>
    </View>
  );
}

// ─── Gold buttons ─────────────────────────────────────────────────────────────

function AddPrayerButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Add prayer time"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: scaleSize(10),
        backgroundColor: c.goldFill,
        borderRadius: scaleSize(16),
        paddingVertical: scaleSize(16),
        marginBottom: scaleSize(22),
        shadowColor: c.goldFill,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View
        style={{
          width: scaleSize(24),
          height: scaleSize(24),
          borderRadius: scaleSize(12),
          backgroundColor: c.onGoldFill,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={scaleSize(15)} color={c.goldFill} strokeWidth={3} />
      </View>
      <Text style={{ fontSize: scaleFont(15), color: c.onGoldFill, fontWeight: "800", letterSpacing: 0.4 }}>
        Add Prayer Time
      </Text>
    </TouchableOpacity>
  );
}

// ─── Prayer Card ──────────────────────────────────────────────────────────────

interface PrayerCardProps {
  hour: PrayerHour;
  onToggle: (id: string) => void;
  onEdit: (hour: PrayerHour) => void;
  onDelete: (id: string) => void;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ hour, onToggle, onEdit, onDelete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { clock, period } = split12h(hour.time);
  const on = hour.enabled;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onEdit(hour)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c.surface,
          borderRadius: scaleSize(18),
          paddingVertical: scaleSize(14),
          paddingRight: scaleSize(14),
          marginBottom: scaleSize(10),
          borderWidth: 1,
          borderColor: on ? c.goldA(0.22) : c.ink(0.06),
          opacity: on ? 1 : 0.6,
          overflow: "hidden",
        }}
      >
        {/* gold edge when active */}
        <View
          style={{
            width: scaleSize(4),
            alignSelf: "stretch",
            backgroundColor: on ? c.goldFill : "transparent",
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4,
            marginRight: scaleSize(14),
          }}
        />

        {/* Time */}
        <View style={{ width: scaleSize(74) }}>
          <Text style={{ fontSize: scaleFont(22), fontWeight: "300", color: on ? c.text : c.textMuted }}>{clock}</Text>
          <Text style={{ fontSize: scaleFont(10), fontWeight: "800", color: on ? c.gold : c.textMuted, letterSpacing: 1.5 }}>
            {period}
          </Text>
        </View>

        {/* Name + note */}
        <View style={{ flex: 1, paddingRight: scaleSize(8) }}>
          <Text style={{ fontSize: scaleFont(15), fontWeight: "700", color: c.text }} numberOfLines={1}>
            {hour.name}
          </Text>
          {!!hour.subtitle && (
            <Text style={{ fontSize: scaleFont(12), color: c.textMuted, marginTop: 2 }} numberOfLines={1}>
              {hour.subtitle}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onDelete(hour.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={`Delete ${hour.name}`}
          style={{ marginRight: scaleSize(10), padding: scaleSize(4) }}
        >
          <Trash2 size={scaleSize(16)} color={c.ink(0.35)} strokeWidth={2} />
        </TouchableOpacity>

        <Switch
          value={on}
          onValueChange={() => onToggle(hour.id)}
          trackColor={{ false: c.ink(0.1), true: c.goldFill }}
          thumbColor={Platform.OS === "android" ? (on ? c.surface : c.ink(0.5)) : undefined}
          ios_backgroundColor={c.ink(0.1)}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Edit / Add sheet ─────────────────────────────────────────────────────────

interface ModalProps {
  visible: boolean;
  initial: PrayerHour | null;
  isNew: boolean;
  onSave: (hour: PrayerHour) => void;
  onClose: () => void;
}

const PRESETS = [
  { label: "Dawn", time: "05:00" },
  { label: "Morning", time: "06:00" },
  { label: "Noon", time: "12:00" },
  { label: "Evening", time: "18:00" },
  { label: "Night", time: "21:00" },
  { label: "Midnight", time: "00:00" },
];

const PrayerHourModal: React.FC<ModalProps> = ({ visible, initial, isNew, onSave, onClose }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [hourText, setHourText] = useState("06");
  const [minuteText, setMinuteText] = useState("00");
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");

  const setFrom24 = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    setAmpm(h >= 12 ? "PM" : "AM");
    setHourText(String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0"));
    setMinuteText(String(m).padStart(2, "0"));
  };

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setSubtitle(initial.subtitle);
      setFrom24(initial.time);
    } else {
      setName("");
      setSubtitle("");
      setFrom24("06:00");
    }
  }, [initial, visible]);

  // Digits only while typing; clamp once the field loses focus.
  const onHourChange = (text: string) => setHourText(text.replace(/[^0-9]/g, "").slice(0, 2));
  const onMinuteChange = (text: string) => setMinuteText(text.replace(/[^0-9]/g, "").slice(0, 2));
  const onHourBlur = () => setHourText(String(clamp(parseInt(hourText || "12", 10) || 12, 1, 12)).padStart(2, "0"));
  const onMinuteBlur = () => setMinuteText(String(clamp(parseInt(minuteText || "0", 10) || 0, 0, 59)).padStart(2, "0"));

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give this prayer time a name.");
      return;
    }
    const hourVal = clamp(parseInt(hourText || "12", 10) || 12, 1, 12);
    const minuteVal = clamp(parseInt(minuteText || "0", 10) || 0, 0, 59);
    let h24 = hourVal % 12;
    if (ampm === "PM") h24 += 12;
    onSave({
      id: initial?.id ?? `hour_${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim(),
      time: `${String(h24).padStart(2, "0")}:${String(minuteVal).padStart(2, "0")}`,
      enabled: initial?.enabled ?? true,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: c.overlay, justifyContent: "flex-end" }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: scaleSize(28),
            borderTopRightRadius: scaleSize(28),
            borderTopWidth: 1,
            borderColor: c.goldA(0.25),
            paddingHorizontal: scaleSize(22),
            paddingTop: scaleSize(10),
            paddingBottom: scaleSize(24) + insets.bottom,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: scaleSize(40),
              height: 4,
              borderRadius: 2,
              backgroundColor: c.ink(0.15),
              marginBottom: scaleSize(16),
            }}
          />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: scaleSize(8) }}>
            <Text style={{ fontSize: scaleFont(20), fontWeight: "800", color: c.text }}>
              {isNew ? "New Prayer Time" : "Edit Prayer Time"}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: c.textMuted, fontSize: scaleFont(14), fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: scaleSize(8),
              marginTop: scaleSize(10),
              backgroundColor: c.surface2,
              borderRadius: scaleSize(20),
              paddingVertical: scaleSize(14),
            }}
          >
            <TextInput
              value={hourText}
              onChangeText={onHourChange}
              onBlur={onHourBlur}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={s.timeInput}
              accessibilityLabel="Hour"
            />
            <Text style={{ color: c.gold, fontSize: scaleFont(36), fontWeight: "200" }}>:</Text>
            <TextInput
              value={minuteText}
              onChangeText={onMinuteChange}
              onBlur={onMinuteBlur}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={s.timeInput}
              accessibilityLabel="Minute"
            />
            <View style={{ gap: scaleSize(6), marginLeft: scaleSize(8) }}>
              {(["AM", "PM"] as const).map((p) => {
                const on = ampm === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setAmpm(p)}
                    style={{
                      paddingHorizontal: scaleSize(14),
                      paddingVertical: scaleSize(8),
                      borderRadius: scaleSize(10),
                      backgroundColor: on ? c.goldFill : c.surface,
                    }}
                  >
                    <Text style={{ color: on ? c.onGoldFill : c.textMuted, fontWeight: "800", fontSize: scaleFont(13) }}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quick picks */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: scaleSize(8), paddingVertical: scaleSize(12) }}
          >
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                onPress={() => setFrom24(p.time)}
                style={{
                  paddingHorizontal: scaleSize(12),
                  paddingVertical: scaleSize(7),
                  borderRadius: scaleSize(20),
                  backgroundColor: c.goldA(0.1),
                  borderWidth: 1,
                  borderColor: c.goldA(0.22),
                }}
              >
                <Text style={{ color: c.gold, fontSize: scaleFont(12), fontWeight: "700" }}>
                  {p.label} · {format12h(p.time)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Watch"
            placeholderTextColor={c.ink(0.3)}
            style={s.input}
            autoCapitalize="words"
          />

          <Text style={s.label}>Note (optional)</Text>
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. Intercession for the nation"
            placeholderTextColor={c.ink(0.3)}
            style={s.input}
          />

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={{
              backgroundColor: c.goldFill,
              borderRadius: scaleSize(16),
              paddingVertical: scaleSize(16),
              alignItems: "center",
              marginTop: scaleSize(22),
            }}
          >
            <Text style={{ color: c.onGoldFill, fontWeight: "800", fontSize: scaleFont(15), letterSpacing: 0.4 }}>
              {isNew ? "Add Prayer Time" : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  get eyebrow() {
    return { fontSize: scaleFont(10), color: c.gold, letterSpacing: 2, fontWeight: "800" as const };
  },
  get label() {
    return {
      fontSize: scaleFont(11),
      color: c.textMuted,
      letterSpacing: 1.2,
      fontWeight: "700" as const,
      textTransform: "uppercase" as const,
      marginBottom: scaleSize(6),
      marginTop: scaleSize(12),
    };
  },
  get input() {
    return {
      backgroundColor: c.surface2,
      borderRadius: scaleSize(12),
      color: c.text,
      fontSize: scaleFont(15),
      paddingHorizontal: scaleSize(14),
      paddingVertical: scaleSize(13),
    };
  },
  get timeInput() {
    return {
      backgroundColor: c.surface,
      borderRadius: scaleSize(14),
      color: c.text,
      fontSize: scaleFont(36),
      fontWeight: "300" as const,
      textAlign: "center" as const,
      minWidth: scaleSize(76),
      paddingVertical: scaleSize(6),
    };
  },
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hours, loading, toggleHour, saveHour, deleteHour } = usePrayerTimes();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHour, setEditingHour] = useState<PrayerHour | null>(null);
  const [isNewHour, setIsNewHour] = useState(false);

  const sorted = useMemo(() => [...hours].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)), [hours]);

  const openEdit = (hour: PrayerHour) => {
    setEditingHour(hour);
    setIsNewHour(false);
    setModalVisible(true);
  };

  const openNew = () => {
    setEditingHour(null);
    setIsNewHour(true);
    setModalVisible(true);
  };

  const handleSave = (updated: PrayerHour) => {
    saveHour(updated);
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Prayer Time", "Delete this prayer time?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteHour(id) },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <Clock size={scaleSize(26)} color={c.gold} strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={c.scheme === "dark" ? "light-content" : "dark-content"} />
      <TopBar title="Plans" subtitle="THE LITURGY OF THE HOURS" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: scaleSize(16),
          paddingTop: scaleSize(16),
          paddingBottom: verticalScale(90) + insets.bottom + scaleSize(24),
        }}
        showsVerticalScrollIndicator={false}
      >
        <NextPrayerCard hours={hours} />
        <AddPrayerButton onPress={openNew} />

        {sorted.length > 0 && <Text style={[s.eyebrow, { marginBottom: scaleSize(10), marginLeft: scaleSize(4) }]}>YOUR WATCHES</Text>}

        {sorted.length === 0 && (
          <View style={{ alignItems: "center", marginTop: scaleSize(24), marginBottom: scaleSize(12) }}>
            <BellOff size={scaleSize(30)} color={c.goldA(0.5)} strokeWidth={1.5} />
            <Text style={{ color: c.textMuted, marginTop: scaleSize(12), fontSize: scaleFont(14), textAlign: "center" }}>
              No prayer times yet.{"\n"}Add your first watch above.
            </Text>
          </View>
        )}

        {sorted.map((hour) => (
          <PrayerCard key={hour.id} hour={hour} onToggle={toggleHour} onEdit={openEdit} onDelete={handleDelete} />
        ))}

        {sorted.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(main)/home" as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: scaleSize(8),
              backgroundColor: c.goldA(0.12),
              borderRadius: scaleSize(16),
              paddingVertical: scaleSize(16),
              marginTop: scaleSize(12),
              borderWidth: 1.5,
              borderColor: c.goldFill,
            }}
          >
            <Text style={{ color: c.gold, fontSize: scaleFont(15), fontWeight: "800", letterSpacing: 0.4 }}>
              Begin Reflection
            </Text>
            <ArrowRight size={scaleSize(16)} color={c.gold} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <Navbar />

      <PrayerHourModal
        visible={modalVisible}
        initial={editingHour}
        isNew={isNewHour}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
