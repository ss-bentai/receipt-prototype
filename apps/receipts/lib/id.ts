import "server-only";
import { randomBytes } from "node:crypto";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const RECEIPT_ID_LENGTH = 22;
export const RECEIPT_ID_PATTERN = /^[0-9A-Za-z]{22}$/;

// Largest multiple of 62 below 256; bytes >= this are rejected to avoid modulo bias.
const MAX_UNBIASED = 256 - (256 % ALPHABET.length);

/** 22 base62 chars ≈ 131 bits of entropy from a CSPRNG. */
export function generateReceiptId(): string {
  let id = "";
  while (id.length < RECEIPT_ID_LENGTH) {
    for (const byte of randomBytes(RECEIPT_ID_LENGTH * 2)) {
      if (byte >= MAX_UNBIASED) continue;
      id += ALPHABET[byte % ALPHABET.length];
      if (id.length === RECEIPT_ID_LENGTH) break;
    }
  }
  return id;
}
