"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import {
  CAMPAIGNS,
  DEFAULT_OPTIONS,
  THEMES,
  type CampaignKey,
  type PayOptions,
  type ThemeKey,
} from "@/lib/options";

type Result = { url: string; transactionId: string; total: number; currency: string };

function formatMoney(minor: number, currency: string) {
  return `${currency} ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function OptionsForm({
  options,
  onChange,
}: {
  options: PayOptions;
  onChange: (options: PayOptions) => void;
}) {
  const set = <K extends keyof PayOptions>(key: K, value: PayOptions[K]) =>
    onChange({ ...options, [key]: value });

  return (
    <div className="space-y-8">
      <Section title="Campaign">
        {(Object.keys(CAMPAIGNS) as CampaignKey[]).map((key) => {
          const { label, campaign } = CAMPAIGNS[key];
          return (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4 transition has-checked:border-emerald-400 has-checked:bg-emerald-400/10"
            >
              <input
                type="radio"
                name="campaign"
                checked={options.campaign === key}
                onChange={() => set("campaign", key)}
                className="mt-1 accent-emerald-400"
              />
              <span>
                <span className="block font-medium">{label}</span>
                {campaign && (
                  <span className="mt-0.5 block text-sm text-slate-400">{campaign.body}</span>
                )}
              </span>
            </label>
          );
        })}
      </Section>

      <Section title="Line items">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <span>
            <span className="block font-medium">Send itemised line items</span>
            <span className="mt-0.5 block text-sm text-slate-400">
              Adds sample items, subtotal and 6% SST
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={options.itemized}
            onChange={(e) => set("itemized", e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-7 w-12 shrink-0 rounded-full bg-slate-600 transition peer-checked:bg-emerald-400 peer-focus-visible:ring-2 peer-focus-visible:ring-white after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
          />
        </label>
      </Section>

      <Section title="Receipt colour">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const t = THEMES[key];
            return (
              <label key={key} className="cursor-pointer" title={t.label}>
                <input
                  type="radio"
                  name="theme"
                  checked={options.theme === key}
                  onChange={() => set("theme", key)}
                  className="peer sr-only"
                  aria-label={t.label}
                />
                <span
                  aria-hidden
                  className="block h-12 w-12 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-slate-900 transition peer-checked:ring-white peer-focus-visible:ring-emerald-400"
                  style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                />
              </label>
            );
          })}
        </div>
        <p className="text-sm text-slate-400">{THEMES[options.theme].label}</p>
      </Section>
    </div>
  );
}

function ResultView({ result, onReset }: { result: Result; onReset: () => void }) {
  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-2xl text-slate-900">
        ✓
      </div>
      <div>
        <p className="text-lg font-semibold">Payment approved</p>
        <p className="text-3xl font-bold tabular-nums">
          {formatMoney(result.total, result.currency)}
        </p>
      </div>
      <p className="text-slate-300">Scan for your e-receipt</p>
      <div className="rounded-2xl bg-white p-4">
        <QRCodeSVG value={result.url} size={220} marginSize={0} />
      </div>
      <a
        href={result.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm break-all text-emerald-400 underline"
      >
        {result.url}
      </a>
      <button
        onClick={onReset}
        className="mt-2 w-full rounded-xl border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800"
      >
        New payment
      </button>
    </section>
  );
}

export default function Home() {
  const [options, setOptions] = useState<PayOptions>(DEFAULT_OPTIONS);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(options),
      });
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
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-8 pb-32">
      <h1 className="mb-8 text-2xl font-semibold">Mock Pay</h1>

      {result ? (
        <ResultView result={result} onReset={() => setResult(null)} />
      ) : (
        <>
          <OptionsForm options={options} onChange={setOptions} />

          <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
            <div className="mx-auto max-w-md space-y-2">
              {error && (
                <p role="alert" className="text-center text-sm text-red-400">
                  {error}
                </p>
              )}
              <button
                onClick={pay}
                disabled={pending}
                className="w-full rounded-xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {pending ? "Processing…" : "Pay"}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
