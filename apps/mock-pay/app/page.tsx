"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type Result = { url: string; transactionId: string; total: number; currency: string };

export default function Home() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/pay", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Payment failed");
      setResult(body as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">Mock Pay</h1>

      <button
        onClick={pay}
        disabled={pending}
        className="w-full rounded-xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {pending ? "Processing…" : "Pay"}
      </button>

      {error && <p className="text-center text-red-400">{error}</p>}

      {result && (
        <section className="flex flex-col items-center gap-4 text-center">
          <p className="text-slate-300">
            Paid{" "}
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: result.currency,
            }).format(result.total / 100)}
            . Scan for your receipt:
          </p>
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG value={result.url} size={224} marginSize={0} />
          </div>
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-emerald-400 underline"
          >
            {result.url}
          </a>
        </section>
      )}
    </main>
  );
}
