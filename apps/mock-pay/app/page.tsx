import { Demo } from "@/components/demo";

// Read RECEIPTS_API_URL per request rather than baking it in at build time.
export const dynamic = "force-dynamic";

export default function Page() {
  // Provider logos are served by the receipts app.
  const receiptsUrl = process.env.RECEIPTS_API_URL?.replace(/\/$/, "") ?? "";
  return <Demo receiptsUrl={receiptsUrl} />;
}
