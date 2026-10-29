/**
 * Choices offered on the mock-pay screen. Safe to import from client code.
 */

export const CAMPAIGNS = {
  none: { label: "No campaign", campaign: undefined },
  "rm5-next-visit": {
    label: "RM5 off next visit",
    campaign: {
      title: "RM5 off your next visit",
      body: "Show this receipt at the counter on your next visit. Min. spend RM20. Valid for 30 days.",
    },
  },
  "app-rewards": {
    label: "Download our app",
    campaign: {
      title: "Download our app for more rewards",
      body: "Earn points on every purchase and unlock members-only deals.",
      cta: { label: "Get the app", url: "https://example.com/app" },
    },
  },
} as const;

export type CampaignKey = keyof typeof CAMPAIGNS;

// Keys must match apps/receipts/lib/themes.ts; colours are only for the swatches here.
export const THEMES = {
  fasspay: { label: "Fasspay Blue", from: "#1565d8", to: "#0a2a73" },
  feedme: { label: "FeedMe Orange", from: "#f97316", to: "#9a3412" },
  emerald: { label: "Emerald", from: "#059669", to: "#064e3b" },
  berry: { label: "Berry", from: "#9333ea", to: "#4c1d95" },
  midnight: { label: "Midnight", from: "#374151", to: "#030712" },
} as const;

export type ThemeKey = keyof typeof THEMES;

export type PayOptions = {
  campaign: CampaignKey;
  itemized: boolean;
  theme: ThemeKey;
};

export const DEFAULT_OPTIONS: PayOptions = {
  campaign: "none",
  itemized: false,
  theme: "fasspay",
};

/** Validates an untrusted request body into PayOptions, falling back to defaults. */
export function parsePayOptions(input: unknown): PayOptions {
  const o = (input ?? {}) as Record<string, unknown>;
  return {
    campaign:
      typeof o.campaign === "string" && o.campaign in CAMPAIGNS
        ? (o.campaign as CampaignKey)
        : DEFAULT_OPTIONS.campaign,
    itemized: o.itemized === true,
    theme:
      typeof o.theme === "string" && o.theme in THEMES
        ? (o.theme as ThemeKey)
        : DEFAULT_OPTIONS.theme,
  };
}
