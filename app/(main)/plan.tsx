import { useRouter } from "expo-router";
import { Bell, Clock, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const format12h = (time24: string): string => {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
};

const clamp = (val: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, val));

// ─── Prayer Card ──────────────────────────────────────────────────────────────

interface PrayerCardProps {
  hour: PrayerHour;
  onToggle: (id: string) => void;
  onEdit: (hour: PrayerHour) => void;
  onDelete: (id: string) => void;
}

const PrayerCard: React.FC<PrayerCardProps> = ({
  hour,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onEdit(hour)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: hour.enabled ? "#1e1035" : "#150c28",
          borderRadius: scaleSize(14),
          padding: scaleSize(14),
          marginBottom: scaleSize(10),
          borderWidth: 1,
          borderColor: hour.enabled
            ? "rgba(212,175,55,0.2)"
            : "rgba(255,255,255,0.05)",
        }}
      >
        {/* Time bubble */}
        <View
          style={{
            paddingHorizontal: scaleSize(10),
            paddingVertical: scaleSize(8),
            borderRadius: scaleSize(10),
            backgroundColor: hour.enabled
              ? "rgba(212,175,55,0.1)"
              : "rgba(255,255,255,0.04)",
            marginRight: scaleSize(12),
            alignItems: "center",
            minWidth: scaleSize(58),
          }}
        >
          <Text
            style={{
              fontSize: scaleFont(13),
              fontWeight: "700",
              color: hour.enabled ? "#D4AF37" : "rgba(255,255,255,0.2)",
              letterSpacing: 0.5,
            }}
          >
            {format12h(hour.time)}
          </Text>
        </View>

        {/* Name + subtitle */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: scaleFont(14),
              fontWeight: "600",
              color: hour.enabled ? "#FFFFFF" : "rgba(255,255,255,0.35)",
              letterSpacing: 0.2,
            }}
          >
            {hour.name}
          </Text>
          {!!hour.subtitle && (
            <Text
              style={{
                fontSize: scaleFont(11),
                color: hour.enabled
                  ? "rgba(255,255,255,0.4)"
                  : "rgba(255,255,255,0.18)",
                marginTop: 2,
              }}
            >
              {hour.subtitle}
            </Text>
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity
          onPress={() => onDelete(hour.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginRight: scaleSize(10) }}
        >
          <Trash2
            size={scaleSize(15)}
            color="rgba(255,80,80,0.45)"
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Toggle */}
        <Switch
          value={hour.enabled}
          onValueChange={() => onToggle(hour.id)}
          trackColor={{ false: "rgba(255,255,255,0.1)", true: "#7C3AED" }}
          thumbColor={hour.enabled ? "#D4AF37" : "rgba(255,255,255,0.5)"}
          ios_backgroundColor="rgba(255,255,255,0.1)"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Edit / Add Modal — redesigned time entry ─────────────────────────────────

interface ModalProps {
  visible: boolean;
  initial: PrayerHour | null;
  isNew: boolean;
  onSave: (hour: PrayerHour) => void;
  onClose: () => void;
}

const PrayerHourModal: React.FC<ModalProps> = ({
  visible,
  initial,
  isNew,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  // Time is now plain text input instead of chevron spinners —
  // simpler, faster to set, and behaves like a real time field.
  const [hourText, setHourText] = useState("06");
  const [minuteText, setMinuteText] = useState("00");
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setSubtitle(initial.subtitle);
      const [h, m] = initial.time.split(":").map(Number);
      setAmpm(h >= 12 ? "PM" : "AM");
      const h12 = h % 12 === 0 ? 12 : h % 12;
      setHourText(String(h12).padStart(2, "0"));
      setMinuteText(String(m).padStart(2, "0"));
    } else {
      setName("");
      setSubtitle("");
      setHourText("06");
      setMinuteText("00");
      setAmpm("AM");
    }
  }, [initial, visible]);

  // Only allow digits while typing, clamp once the field loses focus
  // so partial input (like a single "1") doesn't get force-corrected
  // mid-keystroke.
  const onHourChange = (text: string) => {
    setHourText(text.replace(/[^0-9]/g, "").slice(0, 2));
  };
  const onMinuteChange = (text: string) => {
    setMinuteText(text.replace(/[^0-9]/g, "").slice(0, 2));
  };
  const onHourBlur = () => {
    const n = clamp(parseInt(hourText || "12", 10) || 12, 1, 12);
    setHourText(String(n).padStart(2, "0"));
  };
  const onMinuteBlur = () => {
    const n = clamp(parseInt(minuteText || "0", 10) || 0, 0, 59);
    setMinuteText(String(n).padStart(2, "0"));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give this prayer time a name.");
      return;
    }
    const hourVal = clamp(parseInt(hourText || "12", 10) || 12, 1, 12);
    const minuteVal = clamp(parseInt(minuteText || "0", 10) || 0, 0, 59);
    let h24 = hourVal % 12;
    if (ampm === "PM") h24 += 12;
    const time24 = `${String(h24).padStart(2, "0")}:${String(minuteVal).padStart(2, "0")}`;
    onSave({
      id: initial?.id ?? `hour_${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim(),
      time: time24,
      enabled: initial?.enabled ?? true,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(8,4,18,0.92)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#1a0f2e",
            borderTopLeftRadius: scaleSize(24),
            borderTopRightRadius: scaleSize(24),
            borderTopWidth: 1,
            borderColor: "rgba(212,175,55,0.2)",
            padding: scaleSize(24),
            paddingBottom: scaleSize(48),
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: scaleSize(20),
            }}
          >
            <Text
              style={{
                fontSize: scaleFont(18),
                fontWeight: "700",
                color: "#D4AF37",
              }}
            >
              {isNew ? "New Prayer Time" : "Edit Prayer Time"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: scaleFont(14),
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text style={s.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Watch"
            placeholderTextColor="rgba(255,255,255,0.18)"
            style={s.input}
            autoCapitalize="words"
          />

          {/* Subtitle */}
          <Text style={s.label}>Note (optional)</Text>
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. Intercession for the nation"
            placeholderTextColor="rgba(255,255,255,0.18)"
            style={s.input}
          />

          {/* Time — clean input fields, no spinners */}
          <Text style={[s.label, { marginTop: scaleSize(18) }]}>Time</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: scaleSize(10),
              marginTop: scaleSize(10),
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
            />

            <Text
              style={{
                color: "#D4AF37",
                fontSize: scaleFont(30),
                fontWeight: "200",
              }}
            >
              :
            </Text>

            <TextInput
              value={minuteText}
              onChangeText={onMinuteChange}
              onBlur={onMinuteBlur}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              style={s.timeInput}
            />

            {/* AM / PM */}
            <View style={{ gap: scaleSize(8), marginLeft: scaleSize(6) }}>
              {(["AM", "PM"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setAmpm(p)}
                  style={{
                    paddingHorizontal: scaleSize(16),
                    paddingVertical: scaleSize(10),
                    borderRadius: scaleSize(8),
                    backgroundColor:
                      ampm === p ? "#7C3AED" : "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor:
                      ampm === p ? "#7C3AED" : "rgba(255,255,255,0.1)",
                  }}
                >
                  <Text
                    style={{
                      color: ampm === p ? "#fff" : "rgba(255,255,255,0.35)",
                      fontWeight: "700",
                      fontSize: scaleFont(13),
                    }}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick minute jumps — still handy for fast entry */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: scaleSize(8),
              marginTop: scaleSize(14),
            }}
          >
            {[5, 10, 15, 30].map((step) => (
              <TouchableOpacity
                key={step}
                onPress={() => {
                  const current = parseInt(minuteText || "0", 10) || 0;
                  const next = (current + step) % 60;
                  setMinuteText(String(next).padStart(2, "0"));
                }}
                style={{
                  paddingHorizontal: scaleSize(12),
                  paddingVertical: scaleSize(5),
                  borderRadius: scaleSize(20),
                  backgroundColor: "rgba(212,175,55,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(212,175,55,0.18)",
                }}
              >
                <Text
                  style={{
                    color: "rgba(212,175,55,0.6)",
                    fontSize: scaleFont(11),
                    fontWeight: "600",
                  }}
                >
                  +{step}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#7C3AED",
              borderRadius: scaleSize(14),
              padding: scaleSize(16),
              alignItems: "center",
              marginTop: scaleSize(24),
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.25)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: scaleFont(15),
                letterSpacing: 0.5,
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  label: {
    fontSize: scaleFont(11),
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    marginBottom: scaleSize(6),
    marginTop: scaleSize(10),
  },
  input: {
    backgroundColor: "#120a22",
    borderRadius: scaleSize(10),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: scaleFont(14),
    paddingHorizontal: scaleSize(14),
    paddingVertical: scaleSize(12),
  },
  timeInput: {
    backgroundColor: "#120a22",
    borderRadius: scaleSize(12),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    color: "#fff",
    fontSize: scaleFont(32),
    fontWeight: "200" as const,
    letterSpacing: 3,
    textAlign: "center" as const,
    minWidth: scaleSize(68),
    paddingVertical: scaleSize(8),
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

  const enabledCount = hours.filter((h) => h.enabled).length;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#120a22",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Clock size={scaleSize(26)} color="#D4AF37" strokeWidth={1.5} />
        <Text
          style={{
            color: "rgba(255,255,255,0.25)",
            marginTop: scaleSize(10),
            fontSize: scaleFont(11),
            letterSpacing: 2,
          }}
        >
          ENTERING PRAYER PLANS...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#120a22" }}>
      <StatusBar barStyle="light-content" backgroundColor="#120a22" />

      {/* Shared TopBar handles the notch, About, and Settings now —
          no more duplicate header clutter on this screen. */}
      <TopBar title="Plans" subtitle="THE LITURGY OF THE HOURS" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: scaleSize(16),
          paddingTop: scaleSize(16),
          paddingBottom: verticalScale(90) + insets.bottom + scaleSize(24),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active pill */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: scaleSize(5),
            alignSelf: "flex-start",
            backgroundColor: "rgba(124,58,237,0.18)",
            paddingHorizontal: scaleSize(10),
            paddingVertical: scaleSize(5),
            borderRadius: scaleSize(20),
            borderWidth: 1,
            borderColor: "rgba(124,58,237,0.3)",
            marginBottom: scaleSize(16),
          }}
        >
          <Bell size={scaleSize(10)} color="#a78bfa" strokeWidth={2} />
          <Text
            style={{
              fontSize: scaleFont(10),
              color: "#a78bfa",
              fontWeight: "600",
            }}
          >
            {enabledCount} of {hours.length} active
          </Text>
        </View>

        {hours.length === 0 && (
          <View
            style={{
              alignItems: "center",
              marginTop: scaleSize(48),
              opacity: 0.5,
            }}
          >
            <Clock size={scaleSize(32)} color="#D4AF37" strokeWidth={1} />
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                marginTop: scaleSize(12),
                fontSize: scaleFont(13),
                textAlign: "center",
              }}
            >
              No prayer times yet.{"\n"}Tap + to add your first one.
            </Text>
          </View>
        )}

        {hours.map((hour) => (
          <PrayerCard
            key={hour.id}
            hour={hour}
            onToggle={toggleHour}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}

        {/* Add */}
        <TouchableOpacity
          onPress={openNew}
          activeOpacity={0.75}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: scaleSize(8),
            borderWidth: 1,
            borderColor: "rgba(212,175,55,0.2)",
            borderStyle: "dashed",
            borderRadius: scaleSize(14),
            paddingVertical: scaleSize(14),
            marginTop: scaleSize(4),
          }}
        >
          <Plus
            size={scaleSize(15)}
            color="rgba(212,175,55,0.55)"
            strokeWidth={2}
          />
          <Text
            style={{
              fontSize: scaleFont(13),
              color: "rgba(212,175,55,0.55)",
              fontWeight: "600",
              letterSpacing: 0.4,
            }}
          >
            Add Prayer Time
          </Text>
        </TouchableOpacity>

        {/* Begin Reflection */}
        {hours.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(main)/home" as any)}
            style={{
              backgroundColor: "#7C3AED",
              borderRadius: scaleSize(14),
              paddingVertical: scaleSize(15),
              alignItems: "center",
              marginTop: scaleSize(16),
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.2)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: scaleFont(14),
                fontWeight: "700",
                letterSpacing: 0.8,
              }}
            >
              Begin Reflection →
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Modal ── */}
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