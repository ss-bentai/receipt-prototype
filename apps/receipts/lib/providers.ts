/**
 * Payment providers a receipt can be branded with. Callers pick one by key via
 * `provider`; the logo and colour scheme live here, not in the caller.
 */
export const PROVIDERS = {
  fasspay: {
    label: "Fasspay",
    logo: { src: "/providers/fasspay.png", width: 305, height: 285 },
    from: "#1565d8",
    to: "#0a2a73",
    glow: "#00b4f0",
    accent: "#1565d8",
  },
  aeon: {
    label: "AEON",
    logo: { src: "/providers/aeon.png", width: 646, height: 210 },
    from: "#b23a8a",
    to: "#5b1347",
    glow: "#f0a6d4",
    accent: "#a3307f",
  },
} as const;

export type ProviderKey = keyof typeof PROVIDERS;
export const PROVIDER_KEYS = Object.keys(PROVIDERS) as [ProviderKey, ...ProviderKey[]];
export const DEFAULT_PROVIDER: ProviderKey = "fasspay";

/** CSS background for the page behind the receipt. */
export function providerBackground(key: ProviderKey) {
  const p = PROVIDERS[key] ?? PROVIDERS[DEFAULT_PROVIDER];
  return `radial-gradient(ellipse at top left, ${p.glow} 0%, transparent 45%), linear-gradient(135deg, ${p.from} 0%, ${p.to} 70%)`;
}
