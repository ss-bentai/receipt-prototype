import type { Metadata } from "next";
import ReceiptView from "./receipt-view";

export const metadata: Metadata = {
  title: "Your receipt",
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <ReceiptView id={id} />
    </main>
  );
}
