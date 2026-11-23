import { dark, light, type Palette } from "@/constants/theme";

function lum(color: string): number {
  const [r, g, b] = toRgb(color).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toRgb(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** rgba(...) composited over an opaque background */
function over(rgba: string, bg: string): string {
  const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number);
  const [br, bgg, bb] = toRgb(bg);
  const mix = (f: number, back: number) => Math.round(f * a + back * (1 - a));
  return "#" + [mix(r, br), mix(g, bgg), mix(b, bb)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe.each<[string, Palette]>([
  ["light", light],
  ["dark", dark],
])("%s palette", (_name, p) => {
  it("main, secondary and muted text read clearly (WCAG AA 4.5:1)", () => {
    for (const fg of [p.text, p.textSecondary, p.textMuted]) {
      expect(contrast(fg, p.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fg, p.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gold and violet are readable as text", () => {
    expect(contrast(p.gold, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.violet, p.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("text on the gold button is readable", () => {
    expect(contrast(p.onGold, p.gold)).toBeGreaterThanOrEqual(4.5);
  });

  it("faded text tiers used by the old design stay readable", () => {
    for (const a of [0.35, 0.4, 0.5]) {
      expect(contrast(over(p.ink(a), p.bg), p.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("hairlines stay subtle", () => {
    expect(contrast(over(p.ink(0.08), p.bg), p.bg)).toBeLessThan(1.5);
  });
});
