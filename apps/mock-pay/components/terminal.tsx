"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import type { PricedCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { BatteryIcon, CheckIcon, ContactlessIcon, WifiIcon } from "./icons";

export type Phase = "ready" | "tapping" | "processing" | "approved" | "receipt" | "error";

export type ScreenTheme = { from: string; to: string; accent: string };

export type TerminalProps = {
  phase: Phase;
  /** Colours of the payment app on the screen; the device itself stays the same. */
  screen: ScreenTheme;
  cart: PricedCart;
  currency: string;
  receiptUrl?: string;
  error?: string;
  onTap: () => void;
  onNewSale: () => void;
  onRetry: () => void;
};

function useClock() {
  const [now, setNow] = useState<Date | null>(null); // null until mounted (avoids hydration mismatch)
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? "";
}

function StatusBar() {
  const time = useClock();
  return (
    <div className="flex h-7 items-center justify-between px-5 text-[11px] font-medium text-white/70">
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5">
        <WifiIcon className="h-3.5 w-3.5" />
        <BatteryIcon className="h-3 w-5" />
      </span>
    </div>
  );
}

function SaleScreen({
  cart,
  currency,
  phase,
  onTap,
}: Pick<TerminalProps, "cart" | "currency" | "phase" | "onTap">) {
  const money = (minor: number) => formatMoney(minor, currency);
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-2">
        <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">Sale</p>
        <p className="mt-1 text-[2rem] leading-tight font-bold tabular-nums">{money(cart.total)}</p>
      </div>

      {cart.items && (
        <div className="mx-5 mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl bg-white/5 p-3 text-[13px]">
          <ul className="space-y-1">
            {cart.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-2">
                <span className="truncate text-white/80">
                  {item.quantity} × {item.name}
                </span>
                <span className="tabular-nums">{money(item.quantity * item.unitPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-0.5 border-t border-white/10 pt-2 text-white/60">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(cart.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>SST 6%</span>
              <span className="tabular-nums">{money(cart.tax ?? 0)}</span>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onTap}
        disabled={phase !== "ready"}
        className="mt-auto flex flex-col items-center gap-3 pt-4 pb-8 text-center"
      >
        <span className="relative flex h-24 w-24 items-center justify-center">
          {phase === "ready" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-(--accent)/20" />
          )}
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-(--accent)/15 ring-1 ring-(--accent)/40">
            <ContactlessIcon className="h-10 w-10 text-(--accent)" />
          </span>
        </span>
        <span className="text-base font-semibold">
          {phase === "tapping" ? "Reading card…" : "Tap card to pay"}
        </span>
        <span className="text-xs text-white/50">Contactless · Visa · Mastercard</span>
      </button>
    </div>
  );
}

function ProcessingScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <span className="h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-(--accent)" />
      <div>
        <p className="text-lg font-semibold">Processing</p>
        <p className="mt-1 text-sm text-white/50">Please wait…</p>
      </div>
    </div>
  );
}

function ApprovedScreen({ total }: { total: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400 text-slate-900">
        <CheckIcon className="h-10 w-10" />
      </span>
      <div>
        <p className="text-2xl font-bold">Approved</p>
        <p className="mt-1 text-lg tabular-nums text-white/70">{total}</p>
      </div>
    </div>
  );
}

function ReceiptScreen({
  url,
  total,
  onNewSale,
}: {
  url: string;
  total: string;
  onNewSale: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center px-5 pt-2 pb-5 text-center">
      <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-300">
        <CheckIcon className="h-4 w-4" /> Approved · <span className="tabular-nums">{total}</span>
      </p>
      <p className="mt-4 text-lg font-semibold">Scan for your e-receipt</p>
      <div className="mt-4 rounded-2xl bg-white p-3">
        <QRCodeSVG value={url} size={176} marginSize={0} />
      </div>
      <p className="mt-3 text-sm text-white/60">
        Or,{" "}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-(--accent) underline underline-offset-2 hover:opacity-80"
        >
          click here
        </a>
      </p>
      <button
        type="button"
        onClick={onNewSale}
        className="mt-auto w-full rounded-xl bg-white/10 py-3 font-semibold hover:bg-white/15"
      >
        New sale
      </button>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl font-bold text-red-400">
        !
      </span>
      <div>
        <p className="text-lg font-semibold">Transaction failed</p>
        {message && <p className="mt-1 text-sm break-words text-white/60">{message}</p>}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 w-full rounded-xl bg-white/10 py-3 font-semibold hover:bg-white/15"
      >
        Try again
      </button>
    </div>
  );
}

/** A handheld card terminal with a live screen. */
export function Terminal(props: TerminalProps) {
  const { phase, cart, currency, receiptUrl, error } = props;
  const total = formatMoney(cart.total, currency);

  return (
    <div className="relative w-[300px] rounded-[2.75rem] bg-[linear-gradient(180deg,#3a3d44_0%,#1c1d21_40%,#111214_100%)] p-3 pt-4 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.6)] ring-1 ring-black/50">
      {/* Receipt printer slot */}
      <div className="mx-auto mb-3 h-1.5 w-32 rounded-full bg-black/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />

      <div
        className="h-[480px] overflow-hidden rounded-[2rem] text-white ring-1 ring-white/5"
        style={
          {
            background: `radial-gradient(ellipse at top, ${props.screen.from} 0%, ${props.screen.to} 75%)`,
            "--accent": props.screen.accent,
          } as React.CSSProperties
        }
        aria-live="polite"
      >
        <StatusBar />
        <div className="h-[calc(100%-1.75rem)]">
          {(phase === "ready" || phase === "tapping") && <SaleScreen {...props} />}
          {phase === "processing" && <ProcessingScreen />}
          {phase === "approved" && <ApprovedScreen total={total} />}
          {phase === "receipt" && receiptUrl && (
            <ReceiptScreen url={receiptUrl} total={total} onNewSale={props.onNewSale} />
          )}
          {phase === "error" && <ErrorScreen message={error} onRetry={props.onRetry} />}
        </div>
      </div>

      {/* Bezel with contactless landing zone */}
      <div className="flex h-16 items-center justify-center">
        <ContactlessIcon className="h-6 w-6 text-white/30" />
      </div>
    </div>
  );
}
