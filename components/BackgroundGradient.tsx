// components/BackgroundGradient.tsx
import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { StyleSheet, ViewStyle } from "react-native";

import { usePalette } from "@/constants/theme";

/** The app-wide backdrop: the page colour with a faint gold warmth at the top. */
export default function BackgroundGradient({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const p = usePalette();
  return (
    <LinearGradient
      colors={[p.goldA(0.06), p.bg, p.bg]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[StyleSheet.absoluteFill, { flex: 1, backgroundColor: p.bg }, style]}
    >
      {children}
    </LinearGradient>
  );
}
