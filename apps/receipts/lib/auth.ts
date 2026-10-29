import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time check of the x-api-key header against RECEIPTS_API_KEY. */
export function isAuthorized(request: Request): boolean {
  const expected = process.env.RECEIPTS_API_KEY;
  const provided = request.headers.get("x-api-key");
  if (!expected || !provided) return false;
  return timingSafeEqual(sha256(provided), sha256(expected));
}
