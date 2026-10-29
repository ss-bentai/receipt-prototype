import { NextResponse } from "next/server";
import { RECEIPT_ID_PATTERN } from "@/lib/id";
import type { Receipt } from "@/lib/schema";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!RECEIPT_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("receipts")
    .select("id, data, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load receipt", error);
    return NextResponse.json({ error: "Failed to load receipt" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const receipt: Receipt = {
    id: data.id,
    createdAt: data.created_at,
    transaction: data.data,
  };
  return NextResponse.json(receipt);
}
