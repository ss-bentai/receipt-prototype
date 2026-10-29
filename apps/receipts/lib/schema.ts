import { z } from "zod";
import { DEFAULT_THEME, THEME_KEYS } from "./themes";

const money = z.number().int().nonnegative(); // minor units, e.g. cents
const digits = (min: number, max: number) =>
  z.string().regex(new RegExp(`^\\d{${min},${max}}$`));

export const lineItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: money,
});

export const campaignSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().max(300).optional(),
  cta: z
    .object({
      label: z.string().min(1).max(40),
      url: z.url({ protocol: /^https?$/ }),
    })
    .optional(),
});

export const TRANSACTION_TYPES = {
  purchase: "Purchase",
  "pre-authorization": "Pre-Authorization",
  refund: "Refund",
  void: "Void",
} as const;

export const transactionSchema = z.object({
  transactionId: z.string().min(1).max(128),
  type: z
    .enum(Object.keys(TRANSACTION_TYPES) as [keyof typeof TRANSACTION_TYPES])
    .default("purchase"),
  // Terminal-local time with offset, e.g. 2026-10-29T15:11:32+08:00.
  // The receipt shows this wall-clock time as-is, regardless of viewer timezone.
  timestamp: z.iso.datetime({ offset: true }),
  currency: z
    .string()
    .length(3)
    .transform((c) => c.toUpperCase()),
  total: money,
  merchant: z.object({
    name: z.string().min(1).max(200),
    address: z.string().max(500).optional(),
  }),
  terminal: z.object({
    mid: digits(1, 20),
    tid: digits(1, 16),
    batchNo: digits(1, 6),
    traceNo: digits(1, 6),
  }),
  card: z.object({
    entryType: z.enum(["Contactless", "Chip", "Swipe", "Manual"]),
    cardType: z.string().min(1).max(30),
    appName: z.string().min(1).max(50),
    // Must already be masked (first 6 + last 4), so a full PAN is never stored.
    maskedPan: z.string().regex(/^\d{6}\*{2,9}\d{4}$/, "Card number must be masked"),
    expiry: z.literal("**/**").default("**/**"),
    aid: z.string().regex(/^[0-9A-F]{10,32}$/i),
  }),
  authorization: z.object({
    approvalCode: z.string().regex(/^[0-9A-Z]{6}$/i),
    refNo: digits(12, 12),
  }),
  theme: z.enum(THEME_KEYS).default(DEFAULT_THEME),
  campaign: campaignSchema.optional(),
  // Optional itemisation.
  items: z.array(lineItemSchema).min(1).max(100).optional(),
  subtotal: money.optional(),
  tax: money.optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

/** Shape returned by GET /api/receipts/[id] and rendered at /r/[id]. */
export type Receipt = {
  id: string;
  createdAt: string;
  transaction: Transaction;
};
