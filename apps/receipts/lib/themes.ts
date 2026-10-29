/**
 * Named colour palettes a receipt can use. Callers pick one by key via
 * `theme` on the transaction; arbitrary colours aren't accepted.
 */
export const THEMES = {
  fasspay: { label: "Fasspay Blue", from: "#1565d8", to: "#0a2a73", glow: "#00b4f0", accent: "#1565d8" },
  orange: { label: "Orange", from: "#f97316", to: "#9a3412", glow: "#fdba74", accent: "#c2410c" },
  emerald: { label: "Emerald", from: "#059669", to: "#064e3b", glow: "#6ee7b7", accent: "#047857" },
  berry: { label: "Berry", from: "#9333ea", to: "#4c1d95", glow: "#f472b6", accent: "#7e22ce" },
  midnight: { label: "Midnight", from: "#374151", to: "#030712", glow: "#9ca3af", accent: "#111827" },
} as const;

export type ThemeKey = keyof typeof THEMES;
export const THEME_KEYS = Object.keys(THEMES) as [ThemeKey, ...ThemeKey[]];
export const DEFAULT_THEME: ThemeKey = "fasspay";

/** Renamed palettes, so receipts stored under an old key still render. */
export const THEME_ALIASES: Record<string, ThemeKey> = { feedme: "orange" };

/** CSS background for the page behind the receipt. */
export function themeBackground(key: ThemeKey) {
  const t = THEMES[key] ?? THEMES[DEFAULT_THEME];
  return `radial-gradient(ellipse at top left, ${t.glow} 0%, transparent 45%), linear-gradient(135deg, ${t.from} 0%, ${t.to} 70%)`;
}
