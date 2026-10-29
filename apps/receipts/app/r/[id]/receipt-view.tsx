"use client";

import { useEffect, useState } from "react";
import type { Receipt } from "@/lib/schema";

type State =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; receipt: Receipt };

function formatMoney(minor: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    minor / 100,
  );
}

export default function ReceiptView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/receipts/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) return setState({ status: "not-found" });
        if (!res.ok) return setState({ status: "error" });
        setState({ status: "ready", receipt: (await res.json()) as Receipt });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
  }, [id]);

  if (state.status === "loading") {
    return <p className="text-center text-gray-500">Loading receipt…</p>;
  }
  if (state.status === "not-found") {
    return <p className="text-center text-gray-500">Receipt not found.</p>;
  }
  if (state.status === "error") {
    return <p className="text-center text-red-600">Couldn&apos;t load this receipt.</p>;
  }

  const { transaction: tx } = state.receipt;
  const money = (minor: number) => formatMoney(minor, tx.currency);

  return (
    <article className="rounded-lg bg-white p-6 shadow-sm">
      <header className="border-b border-dashed border-gray-300 pb-4 text-center">
        <h1 className="text-xl font-semibold">{tx.merchant.name}</h1>
        {tx.merchant.address && (
          <p className="mt-1 text-sm text-gray-500">{tx.merchant.address}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          {new Date(tx.timestamp).toLocaleString()}
        </p>
      </header>

      <ul className="divide-y divide-gray-100 py-4">
        {tx.items.map((item, i) => (
          <li key={i} className="flex justify-between py-2 text-sm">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span className="tabular-nums">{money(item.quantity * item.unitPrice)}</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-1 border-t border-dashed border-gray-300 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Subtotal</dt>
          <dd className="tabular-nums">{money(tx.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Tax</dt>
          <dd className="tabular-nums">{money(tx.tax)}</dd>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{money(tx.total)}</dd>
        </div>
      </dl>

      <footer className="mt-6 space-y-1 text-center text-xs text-gray-500">
        <p>
          Paid by {tx.payment.brand ?? tx.payment.method}
          {tx.payment.last4 && ` •••• ${tx.payment.last4}`}
        </p>
        <p>Transaction {tx.transactionId}</p>
      </footer>
    </article>
  );
}
