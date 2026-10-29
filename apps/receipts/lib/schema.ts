import { z } from "zod";

const money = z.number().int().nonnegative(); // minor units, e.g. cents

export const lineItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: money,
});

export const transactionSchema = z.object({
  transactionId: z.string().min(1).max(128),
  timestamp: z.iso.datetime({ offset: true }),
  currency: z
    .string()
    .length(3)
    .transform((c) => c.toUpperCase()),
  merchant: z.object({
    name: z.string().min(1).max(200),
    address: z.string().max(500).optional(),
  }),
  items: z.array(lineItemSchema).min(1).max(100),
  subtotal: money,
  tax: money.default(0),
  total: money,
  payment: z.object({
    method: z.enum(["card", "ewallet", "cash", "other"]),
    brand: z.string().max(50).optional(),
    last4: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
  }),
});

export type Transaction = z.infer<typeof transactionSchema>;

/** Shape returned by GET /api/receipts/[id] and rendered at /r/[id]. */
export type Receipt = {
  id: string;
  createdAt: string;
  transaction: Transaction;
};
