"use client";

import { useEffect, useState } from "react";
import { OptionsPanel, summarizeOptions } from "@/components/options-panel";
import { PaymentCard } from "@/components/payment-card";
import { Terminal, type Phase } from "@/components/terminal";
import { cartForOrder, priceCart, randomOrder, type OrderLines } from "@/lib/cart";
import { CAMPAIGN_KEYS, DEFAULT_OPTIONS, type PayOptions } from "@/lib/options";

const CURRENCY = "MYR";
const TAP_MS = 700;
const MIN_PROCESSING_MS = 1200;
const APPROVED_MS = 1400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Options panel + simulated terminal; drives the payment phases. */
export function Demo({ receiptsUrl }: { receiptsUrl: string }) {
  const [options, setOptions] = useState<PayOptions>(DEFAULT_OPTIONS);
  const [campaignChoice, setCampaignChoice] = useState(CAMPAIGN_KEYS[0]);
  // One random order per sale, generated after mount so server and client
  // render the same markup. The itemised switch only changes how it is sent.
  const [order, setOrder] = useState<OrderLines | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [receiptUrl, setReceiptUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => setOrder(randomOrder()), []);

  const cart = order && cartForOrder(order, options.itemized);

  async function pay() {
    if (phase !== "ready" || !cart) return;
    setError(undefined);
    setPhase("tapping");
    await wait(TAP_MS);
    setPhase("processing");

    try {
      const [res] = await Promise.all([
        fetch("/api/pay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...options, cart }),
        }),
        wait(MIN_PROCESSING_MS),
      ]);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Payment failed");

      setReceiptUrl(body.url);
      setPhase("approved");
      navigator.vibrate?.(80);
      await wait(APPROVED_MS);
      setPhase("receipt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPhase("error");
    }
  }

  function newSale() {
    setReceiptUrl(undefined);
    setOrder(randomOrder());
    setPhase("ready");
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 py-6 lg:grid lg:grid-cols-[340px_1fr] lg:gap-12 lg:py-12">
      <aside className="lg:order-1">
        <h1 className="text-xl font-semibold">Receipt Demo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Simulated card terminal for the e-receipt prototype.
        </p>

        <button
          type="button"
          onClick={() => setOptionsOpen((o) => !o)}
          aria-expanded={optionsOpen}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm lg:hidden"
        >
          <span className="min-w-0">
            <span className="block font-medium">Receipt options</span>
            <span className="block truncate text-slate-500">{summarizeOptions(options)}</span>
          </span>
          <span className="shrink-0 font-medium text-emerald-700">
            {optionsOpen ? "Done" : "Edit"}
          </span>
        </button>

        <div className={`${optionsOpen ? "block" : "hidden"} mt-4 lg:mt-8 lg:block`}>
          <OptionsPanel
            options={options}
            campaignChoice={campaignChoice}
            receiptsUrl={receiptsUrl}
            disabled={phase !== "ready"}
            onChange={setOptions}
            onCampaignChoice={setCampaignChoice}
          />
          {phase !== "ready" && (
            <p className="mt-3 text-xs text-slate-500">Options unlock when you start a new sale.</p>
          )}
        </div>
      </aside>

      <section className="mt-8 flex flex-col items-center lg:order-2 lg:mt-0 lg:justify-center">
        {cart && (
          <>
            <Terminal
              phase={phase}
              cart={priceCart(cart)}
              currency={CURRENCY}
              receiptUrl={receiptUrl}
              error={error}
              onTap={pay}
              onNewSale={newSale}
              onRetry={() => setPhase("ready")}
            />
            <div className="mt-6 flex flex-col items-center gap-3">
              <PaymentCard
                raised={phase === "tapping" || phase === "processing"}
                disabled={phase !== "ready"}
                onTap={pay}
              />
              <p className="h-5 text-sm text-slate-500">
                {phase === "ready" && "Tap the card to pay"}
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
