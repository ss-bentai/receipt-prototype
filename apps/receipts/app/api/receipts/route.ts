import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { generateReceiptId } from "@/lib/id";
import { transactionSchema } from "@/lib/schema";
import { getSupabaseAdmin } from "@/lib/supabase";

const UNIQUE_VIOLATION = "23505";

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const transaction = parsed.data;

  const id = generateReceiptId();
  const { data, error } = await getSupabaseAdmin()
    .from("receipts")
    .insert({ id, transaction_id: transaction.transactionId, data: transaction })
    .select("id, created_at")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "A receipt already exists for this transactionId" },
        { status: 409 },
      );
    }
    console.error("Failed to store receipt", error);
    return NextResponse.json({ error: "Failed to store receipt" }, { status: 500 });
  }

  const baseUrl =
    process.env.RECEIPTS_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;

  return NextResponse.json(
    { id: data.id, url: `${baseUrl}/r/${data.id}`, createdAt: data.created_at },
    { status: 201 },
  );
}
