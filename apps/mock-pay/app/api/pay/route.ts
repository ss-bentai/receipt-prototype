import { NextResponse } from "next/server";
import { cartForOrder, parseCart, randomOrder } from "@/lib/cart";
import { parsePayOptions } from "@/lib/options";
import { buildSampleTransaction } from "@/lib/sample-transaction";

export async function POST(request: Request) {
  const apiUrl = process.env.RECEIPTS_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.RECEIPTS_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "RECEIPTS_API_URL and RECEIPTS_API_KEY must be set" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const options = parsePayOptions(body);
  const transaction = buildSampleTransaction(
    options,
    parseCart(body?.cart) ?? cartForOrder(randomOrder(), options.itemized),
  );

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

  const created = await res.json().catch(() => null);
  if (!res.ok || typeof created?.url !== "string") {
    console.error("Receipts API error", res.status, created);
    return NextResponse.json(
      { error: created?.error ?? `Receipts API returned ${res.status}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    url: created.url as string,
    transactionId: transaction.transactionId,
    total: transaction.total,
    currency: transaction.currency,
  });
}
