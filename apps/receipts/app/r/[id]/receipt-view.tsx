"use client";

import { useEffect, useState } from "react";
import { TRANSACTION_TYPES, type Receipt } from "@/lib/schema";

type State =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "outdated" }
  | { status: "error" }
  | { status: "ready"; receipt: Receipt };

function formatMoney(minor: number, currency: string) {
  const amount = (minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${amount}`;
}

/** "2026-10-29T15:11:32+08:00" -> "29/10/2026 15:11:32" (terminal wall-clock time). */
function formatTerminalTime(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : iso;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "font-bold" : ""}`}>
      <dt>{label} :</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-white/80">{children}</p>;
}

export default function ReceiptView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/receipts/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) return setState({ status: "not-found" });
        if (res.status === 410) return setState({ status: "outdated" });
        if (!res.ok) return setState({ status: "error" });
        setState({ status: "ready", receipt: (await res.json()) as Receipt });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
  }, [id]);

  if (state.status === "loading") return <Message>Loading receipt…</Message>;
  if (state.status === "not-found") return <Message>Receipt not found.</Message>;
  if (state.status === "outdated") {
    return <Message>This receipt was created in an older format and can&apos;t be shown.</Message>;
  }
  if (state.status === "error") return <Message>Couldn&apos;t load this receipt.</Message>;

  const { transaction: tx } = state.receipt;
  const money = (minor: number) => formatMoney(minor, tx.currency);
  const title = `${TRANSACTION_TYPES[tx.type] ?? "Purchase"} Successful`;

  return (
    <div className="drop-shadow-2xl">
      <article className="torn-edges bg-white px-6 pt-10 pb-12 text-[15px] leading-relaxed text-gray-900">
        <header className="text-center">
          <img src="/merchant-logo.svg" alt="" className="mx-auto h-16 w-16" />
          <h1 className="mt-3 text-lg font-bold uppercase">{tx.merchant.name}</h1>
          {tx.merchant.address && (
            <p className="mt-1 uppercase">{tx.merchant.address}</p>
          )}
        </header>

        <hr className="my-4 border-t-2 border-gray-900" />

        <h2 className="mb-4 text-center text-xl font-extrabold uppercase">{title}</h2>

        <dl>
          <Row label="Date/Time" value={formatTerminalTime(tx.timestamp)} />
          <Row label="MID" value={tx.terminal.mid} />
          <Row label="TID" value={tx.terminal.tid} />
          <Row label="Entry Type" value={tx.card.entryType} />
          <Row label="Card Type" value={tx.card.cardType} />
          <Row label="App Name" value={tx.card.appName} />
          <div className="mt-3" />
          <Row label="Card Number" value={tx.card.maskedPan} bold />
          <Row label="Expiry" value={tx.card.expiry} />
          <Row label="Trace No" value={tx.terminal.traceNo} />
          <Row label="Approval Code" value={tx.authorization.approvalCode} />
          <Row label="Ref No" value={tx.authorization.refNo} />
          <Row label="Batch No" value={tx.terminal.batchNo} />
          <Row label="AID" value={tx.card.aid} />
        </dl>

        {tx.items && (
          <>
            <hr className="my-4 border-t border-dashed border-gray-400" />
            <ul>
              {tx.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <span className="tabular-nums">{money(item.quantity * item.unitPrice)}</span>
                </li>
              ))}
            </ul>
            {(tx.subtotal !== undefined || tx.tax !== undefined) && (
              <dl className="mt-2">
                {tx.subtotal !== undefined && <Row label="Subtotal" value={money(tx.subtotal)} />}
                {tx.tax !== undefined && <Row label="Tax" value={money(tx.tax)} />}
              </dl>
            )}
          </>
        )}

        <dl className="mt-3">
          <Row label="Total Amount" value={money(tx.total)} bold />
        </dl>

        <hr className="mt-4 border-t-2 border-gray-900" />
      </article>
    </div>
  );
}
