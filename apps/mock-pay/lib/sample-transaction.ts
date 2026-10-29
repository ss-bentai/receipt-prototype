import "server-only";
import { randomUUID } from "node:crypto";

const MERCHANT = {
  name: "Mock Café",
  address: "Lot G-12, Ground Floor, Menara Contoh, No. 1 Jalan Sultan Ismail, 50250 Kuala Lumpur",
};

const TERMINAL_UTC_OFFSET = "+08:00"; // Malaysia

/** Current time as an ISO string in the terminal's local offset. */
function terminalTimestamp(now = new Date()) {
  const [sign, hh, mm] = TERMINAL_UTC_OFFSET.match(/([+-])(\d{2}):(\d{2})/)!.slice(1);
  const offsetMs = (sign === "-" ? -1 : 1) * (Number(hh) * 60 + Number(mm)) * 60_000;
  const local = new Date(now.getTime() + offsetMs).toISOString().slice(0, 19);
  return `${local}${TERMINAL_UTC_OFFSET}`;
}

/** Builds a sample card transaction matching the receipts API schema. */
export function buildSampleTransaction() {
  return {
    transactionId: `txn_${randomUUID()}`,
    type: "purchase" as const,
    timestamp: terminalTimestamp(),
    currency: "MYR",
    total: 500 + Math.floor(Math.random() * 49_500), // MYR 5.00 – 499.99
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
  };
}
