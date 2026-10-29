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
    <main>
      <ReceiptView id={id} />
    </main>
  );
}
