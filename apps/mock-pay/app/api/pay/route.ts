import { NextResponse } from "next/server";
import { buildSampleTransaction } from "@/lib/sample-transaction";

export async function POST() {
  const apiUrl = process.env.RECEIPTS_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.RECEIPTS_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "RECEIPTS_API_URL and RECEIPTS_API_KEY must be set" },
      { status: 500 },
    );
  }

  const transaction = buildSampleTransaction();

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/api/receipts`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(transaction),
      cache: "no-store",
    });
  } catch (err) {
    console.error("Receipts API unreachable", err);
    return NextResponse.json({ error: "Receipts API unreachable" }, { status: 502 });
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || typeof body?.url !== "string") {
    console.error("Receipts API error", res.status, body);
    return NextResponse.json(
      { error: body?.error ?? `Receipts API returned ${res.status}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    url: body.url as string,
    transactionId: transaction.transactionId,
    total: transaction.total,
    currency: transaction.currency,
  });
}
