import { useRouter } from "expo-router";
import { Info, Settings2 } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scaleFont, scaleSize } from "../hooks/useResponsive";

const GOLD = "#D4AF37";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        // insets.top alone keeps this clear of the notch/status bar on
        // every device — iPhone notch/Dynamic Island, Android punch-hole,
        // all handled automatically. Only a small fixed top gap added on
        // top of that so it doesn't sit flush against it.
        paddingTop: insets.top + scaleSize(8),
        paddingHorizontal: scaleSize(16), // was 20 — tightened
        paddingBottom: scaleSize(12), // was 20 — tightened
        backgroundColor: "#1a0f2e",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(212,175,55,0.12)",
      }}
    >
      {/* Title + icons — same row, icons pushed right */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Title — style freely here */}
        <Text
          style={{
            fontSize: scaleFont(20),
            fontWeight: "700",
            color: "#fff",
            letterSpacing: 0.4,
          }}
        >
          {title}
        </Text>

        {/* Icon buttons — About & Settings, right side, same row as title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: scaleSize(10), // space between the two icon buttons
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(main)/about" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: scaleSize(36), // was 34 — bumped up
              height: scaleSize(36), // was 34 — bumped up
              borderRadius: scaleSize(18),
              backgroundColor: "rgba(212,175,55,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Info size={scaleSize(18)} color={GOLD} strokeWidth={1.8} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(main)/settings" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: scaleSize(36), // was 34 — bumped up
              height: scaleSize(36), // was 34 — bumped up
              borderRadius: scaleSize(18),
              backgroundColor: "rgba(212,175,55,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings2 size={scaleSize(18)} color={GOLD} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle — style freely here */}
      {subtitle ? (
        <Text
          style={{
            fontSize: scaleFont(8), // was 11 — reduced
            color: "rgba(255,255,255,0.35)",
            letterSpacing: 2,
            marginTop: scaleSize(4), // was 5 — tightened
            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}