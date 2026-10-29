/**
 * The order shown on the terminal before the card is tapped. Generated in the
 * browser so the amount is visible up front; the server re-validates it and
 * computes all prices itself (see priceCart).
 */

export const MENU = [
  { name: "Flat White", unitPrice: 1200 },
  { name: "Iced Latte", unitPrice: 1400 },
  { name: "Butter Croissant", unitPrice: 900 },
  { name: "Banana Bread", unitPrice: 800 },
  { name: "Nasi Lemak", unitPrice: 1800 },
  { name: "Teh Tarik", unitPrice: 500 },
] as const;

export const SST_RATE = 0.06;
const MIN_AMOUNT = 500; // MYR 5.00
const MAX_AMOUNT = 49_999; // MYR 499.99
const MAX_QUANTITY = 9;

export type Cart =
  | { kind: "itemized"; lines: { menuIndex: number; quantity: number }[] }
  | { kind: "amount"; amount: number };

export function randomCart(itemized: boolean): Cart {
  if (!itemized) {
    return {
      kind: "amount",
      amount: MIN_AMOUNT + Math.floor(Math.random() * (MAX_AMOUNT - MIN_AMOUNT + 1)),
    };
  }
  const count = 1 + Math.floor(Math.random() * 4);
  const lines = MENU.map((_, menuIndex) => menuIndex)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((menuIndex) => ({ menuIndex, quantity: 1 + Math.floor(Math.random() * 2) }));
  return { kind: "itemized", lines };
}

export type PricedCart = {
  items?: { name: string; quantity: number; unitPrice: number }[];
  subtotal?: number;
  tax?: number;
  total: number;
};

export function priceCart(cart: Cart): PricedCart {
  if (cart.kind === "amount") return { total: cart.amount };
  const items = cart.lines.map(({ menuIndex, quantity }) => ({ ...MENU[menuIndex], quantity }));
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = Math.round(subtotal * SST_RATE);
  return { items, subtotal, tax, total: subtotal + tax };
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

/** Validates an untrusted cart; returns null if it isn't well-formed. */
export function parseCart(input: unknown): Cart | null {
  const c = input as Record<string, unknown> | null;
  if (c?.kind === "amount" && isInt(c.amount, MIN_AMOUNT, MAX_AMOUNT)) {
    return { kind: "amount", amount: c.amount };
  }
  if (c?.kind === "itemized" && Array.isArray(c.lines) && c.lines.length > 0) {
    const lines = c.lines as Record<string, unknown>[];
    const seen = new Set<number>();
    for (const l of lines) {
      if (!isInt(l?.menuIndex, 0, MENU.length - 1) || !isInt(l?.quantity, 1, MAX_QUANTITY)) {
        return null;
      }
      if (seen.has(l.menuIndex)) return null;
      seen.add(l.menuIndex);
    }
    return {
      kind: "itemized",
      lines: lines.map((l) => ({ menuIndex: l.menuIndex as number, quantity: l.quantity as number })),
    };
  }
  return null;
}
