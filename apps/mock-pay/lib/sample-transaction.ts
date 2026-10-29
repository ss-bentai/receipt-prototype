import "server-only";
import { randomUUID } from "node:crypto";

const MENU = [
  { name: "Flat White", unitPrice: 1200 },
  { name: "Iced Latte", unitPrice: 1400 },
  { name: "Butter Croissant", unitPrice: 900 },
  { name: "Banana Bread", unitPrice: 800 },
  { name: "Nasi Lemak", unitPrice: 1800 },
];

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** Builds a random transaction matching the receipts API schema. */
export function buildSampleTransaction() {
  const count = 1 + Math.floor(Math.random() * 3);
  const items = [...MENU]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((item) => ({ ...item, quantity: 1 + Math.floor(Math.random() * 2) }));
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = Math.round(subtotal * 0.06);

  return {
    transactionId: `txn_${randomUUID()}`,
    timestamp: new Date().toISOString(),
    currency: "MYR",
    merchant: { name: "Mock Café", address: "1 Jalan Contoh, Kuala Lumpur" },
    items,
    subtotal,
    tax,
    total: subtotal + tax,
    payment: {
      method: "card" as const,
      brand: pick(["Visa", "Mastercard"]),
      last4: String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
    },
  };
}
