/**
 * Choices offered on the demo screen. Safe to import from client code.
 */

type Campaign = {
  title: string;
  body?: string;
  cta?: { label: string; url?: string }; // no url: receipt shows a disabled placeholder button
};

const SALE_LEAD_DAYS = 14;

/** e.g. "13 Nov 2026", in Malaysia time. */
function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
}

export const CAMPAIGNS: Record<
  string,
  { label: string; description: string; build: (now: Date) => Campaign }
> = {
  "rm5-next-visit": {
    label: "RM5 off next visit",
    description: "Voucher for the customer's next visit.",
    build: () => ({
      title: "RM5 off your next visit",
      body: "Show this receipt at the counter on your next visit. Min. spend RM20. Valid for 30 days.",
    }),
  },
  "app-rewards": {
    label: "Download our app",
    description: "Promote the merchant's app (button is a placeholder).",
    build: () => ({
      title: "Download our app for more rewards",
      body: "Earn points on every purchase and unlock members-only deals.",
      cta: { label: "Get the app" },
    }),
  },
  "store-sale": {
    label: "Upcoming store sale",
    description: `Announces a sale ${SALE_LEAD_DAYS} days after the payment date.`,
    build: (now) => {
      const saleDate = new Date(now.getTime() + SALE_LEAD_DAYS * 24 * 60 * 60 * 1000);
      return {
        title: `Store-wide sale on ${formatDate(saleDate)}`,
        body: "Up to 50% off selected items, one day only. Mark your calendar!",
      };
    },
  },
  "bank-card": {
    label: "Credit card sign-up",
    description: "Partner bank credit card offer (button is a placeholder).",
    build: () => ({
      title: "Sign up for the Contoh Bank Visa Platinum",
      body: "Get 5% cashback on dining and no annual fee for the first year.",
      cta: { label: "Apply now" },
    }),
  },
};

export type CampaignKey = keyof typeof CAMPAIGNS;
export const CAMPAIGN_KEYS = Object.keys(CAMPAIGNS);

// Keys must match apps/receipts/lib/providers.ts. The receipts app owns the
// logos and colours; logos are served from {RECEIPTS_API_URL}/providers/{key}.png.
export const PROVIDERS = {
  fasspay: { label: "Fasspay" },
  aeon: { label: "AEON" },
} as const;

export type ProviderKey = keyof typeof PROVIDERS;

export type PayOptions = {
  /** null = no campaign on the receipt. */
  campaign: CampaignKey | null;
  itemized: boolean;
  provider: ProviderKey;
};

export const DEFAULT_OPTIONS: PayOptions = {
  campaign: null,
  itemized: false,
  provider: "fasspay",
};

/** Validates an untrusted request body into PayOptions, falling back to defaults. */
export function parsePayOptions(input: unknown): PayOptions {
  const o = (input ?? {}) as Record<string, unknown>;
  return {
    campaign:
      typeof o.campaign === "string" && Object.hasOwn(CAMPAIGNS, o.campaign) ? o.campaign : null,
    itemized: o.itemized === true,
    provider:
      typeof o.provider === "string" && Object.hasOwn(PROVIDERS, o.provider)
        ? (o.provider as ProviderKey)
        : DEFAULT_OPTIONS.provider,
  };
}
