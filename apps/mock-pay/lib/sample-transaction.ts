import "server-only";
import { randomUUID } from "node:crypto";
import { CAMPAIGNS, type PayOptions } from "./options";

const MERCHANT = {
  name: "Mock Café",
  address: "Lot G-12, Ground Floor, Menara Contoh, No. 1 Jalan Sultan Ismail, 50250 Kuala Lumpur",
};

const MENU = [
  { name: "Flat White", unitPrice: 1200 },
  { name: "Iced Latte", unitPrice: 1400 },
  { name: "Butter Croissant", unitPrice: 900 },
  { name: "Banana Bread", unitPrice: 800 },
  { name: "Nasi Lemak", unitPrice: 1800 },
  { name: "Teh Tarik", unitPrice: 500 },
];

const SST_RATE = 0.06;

const TERMINAL_UTC_OFFSET = "+08:00"; // Malaysia

/** Current time as an ISO string in the terminal's local offset. */
function terminalTimestamp(now = new Date()) {
  const [sign, hh, mm] = TERMINAL_UTC_OFFSET.match(/([+-])(\d{2}):(\d{2})/)!.slice(1);
  const offsetMs = (sign === "-" ? -1 : 1) * (Number(hh) * 60 + Number(mm)) * 60_000;
  const local = new Date(now.getTime() + offsetMs).toISOString().slice(0, 19);
  return `${local}${TERMINAL_UTC_OFFSET}`;
}

/** 1–4 distinct menu items with subtotal, SST and total. */
function sampleItemization() {
  const count = 1 + Math.floor(Math.random() * 4);
  const items = [...MENU]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((item) => ({ ...item, quantity: 1 + Math.floor(Math.random() * 2) }));
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = Math.round(subtotal * SST_RATE);
  return { items, subtotal, tax, total: subtotal + tax };
}

/** Builds a sample card transaction matching the receipts API schema. */
export function buildSampleTransaction(options: PayOptions) {
  const amounts = options.itemized
    ? sampleItemization()
    : { total: 500 + Math.floor(Math.random() * 49_500) }; // MYR 5.00 – 499.99

  return {
    transactionId: `txn_${randomUUID()}`,
    type: "purchase" as const,
    timestamp: terminalTimestamp(),
    currency: "MYR",
    ...amounts,
    merchant: MERCHANT,
    terminal: {
      mid: "000001234567890",
      tid: "12345678",
      batchNo: "000001",
      traceNo: "000001",
    },
    card: {
      entryType: "Contactless" as const,
      cardType: "Visa",
      appName: "Visa",
      maskedPan: "427321******3212",
      expiry: "**/**" as const,
      aid: "A0000000031010",
    },
    authorization: {
      approvalCode: "123456",
      refNo: "123456789012",
    },
    theme: options.theme,
    campaign: CAMPAIGNS[options.campaign].campaign,
  };
}
