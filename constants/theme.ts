/**
 * Kairos theme: Light and Dark only.
 *
 * Light: warm ivory and deep gold. Dark: near-black and warm gold. Gold is
 * the one accent: text and icons use `gold`, filled buttons use `goldFill`. By default Kairos follows the phone; Settings can pin one.
 *
 * Screens read colours through `c` (a live view of the current palette) and
 * wrap their StyleSheets in `themed(...)`, so a theme change only needs the
 * tree to re-render (the root layout re-keys the navigator when it changes).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Appearance } from "react-native";

export type Scheme = "light" | "dark";
export type ThemeChoice = "system" | Scheme;

export interface Palette {
  scheme: Scheme;
  /** Page background */
  bg: string;
  /** Cards and sheets */
  surface: string;
  /** Raised elements on a card (inputs, chips) */
  surface2: string;
  /** Main text */
  text: string;
  /** Secondary text */
  textSecondary: string;
  /** Muted text (meets 4.5:1 on bg) */
  textMuted: string;
  /** The ink colour at an alpha, for hairlines, tints and text tiers. */
  ink: (alpha: number) => string;
  /** A card wash: white cards in light mode, a faint lift in dark mode. */
  wash: (alpha: number) => string;
  /** Gold: highlights, times, the prayer button */
  gold: string;
  goldA: (alpha: number) => string;
  /** Text on a gold button */
  onGold: string;
  /** A bright gold for filled buttons that need to stand out */
  goldFill: string;
  /** Text and icons on `goldFill` */
  onGoldFill: string;
  danger: string;
  overlay: string;
}

/**
 * Alphas of 0.3 and above were used for text on the old purple background;
 * they are boosted so text tiers stay readable (4.5:1+) in both themes.
 * Lower alphas are hairlines and tints and stay subtle.
 */
const tier = (a: number, boost: number) => (a >= 0.3 ? Math.min(1, a + boost) : a);

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const light: Palette = {
  scheme: "light",
  bg: "#F7F5F0",
  surface: "#FFFFFF",
  surface2: "#F0ECE4",
  text: "#1B1A21",
  textSecondary: "#3E3B47",
  textMuted: "#5F5B6B",
  ink: (a) => rgba("#1B1A21", tier(a, 0.35)),
  wash: (a) => `rgba(255,255,255,${Math.min(1, a * 12)})`,
  gold: "#8A6516",
  goldA: (a) => rgba("#8A6516", tier(a, 0.3)),
  onGold: "#FFFFFF",
  goldFill: "#C9972B",
  onGoldFill: "#1A1405",
  danger: "#B42318",
  overlay: "rgba(20,18,26,0.5)",
};

export const dark: Palette = {
  scheme: "dark",
  bg: "#0E0D13",
  surface: "#17161F",
  surface2: "#201E2B",
  text: "#F4F1EA",
  textSecondary: "#D6D1E0",
  textMuted: "#A9A4B8",
  ink: (a) => rgba("#F4F1EA", tier(a, 0.2)),
  wash: (a) => rgba("#F4F1EA", a),
  gold: "#E0B850",
  goldA: (a) => rgba("#E0B850", tier(a, 0.15)),
  onGold: "#17130A",
  goldFill: "#E0B850",
  onGoldFill: "#17130A",
  danger: "#F87171",
  overlay: "rgba(0,0,0,0.6)",
};

const STORAGE_KEY = "@kairos/theme";
let choice: ThemeChoice = "system";
let current: Palette = Appearance.getColorScheme() === "dark" ? dark : light;
const listeners = new Set<(p: Palette) => void>();

function resolve(): Palette {
  if (choice === "light") return light;
  if (choice === "dark") return dark;
  return Appearance.getColorScheme() === "dark" ? dark : light;
}

function update() {
  const next = resolve();
  if (next !== current) {
    current = next;
    listeners.forEach((l) => l(current));
  }
}

Appearance.addChangeListener(update);

export async function loadThemeChoice(): Promise<ThemeChoice> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") choice = saved;
  } catch {}
  update();
  return choice;
}

export function getThemeChoice(): ThemeChoice {
  return choice;
}

export async function setThemeChoice(next: ThemeChoice) {
  choice = next;
  update();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, next);
  } catch {}
}

/** Live palette: always reads the current theme. */
export const c: Palette = new Proxy({} as Palette, {
  get: (_t, key: keyof Palette) => current[key],
});

/** A StyleSheet built once per scheme and read live. */
export function themed<T extends object>(build: () => T): T {
  const cache: Partial<Record<Scheme, T>> = {};
  return new Proxy({} as T, {
    get: (_t, key) => {
      const s = current.scheme;
      if (!cache[s]) cache[s] = build();
      return (cache[s] as Record<string | symbol, unknown>)[key];
    },
  });
}

/** Re-renders when the palette changes; returns the current palette. */
export function usePalette(): Palette {
  const [p, setP] = useState(current);
  useEffect(() => {
    listeners.add(setP);
    setP(current);
    return () => {
      listeners.delete(setP);
    };
  }, []);
  return p;
}
