"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TRANSACTION_TYPES, type Receipt, type Transaction } from "@/lib/schema";
import { DEFAULT_PROVIDER, PROVIDERS, providerBackground, type ProviderKey } from "@/lib/providers";

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

const ctaClass =
  "mt-3 inline-block rounded-full bg-(--accent) px-5 py-2 text-sm font-semibold text-white print:hidden";

function Campaign({ campaign }: { campaign: NonNullable<Transaction["campaign"]> }) {
  return (
    <section className="mt-6 rounded-lg border-2 border-dashed border-(--accent) bg-(--accent)/5 p-4 text-center">
      <p className="text-lg font-extrabold text-(--accent)">{campaign.title}</p>
      {campaign.body && <p className="mt-1 text-sm text-gray-600">{campaign.body}</p>}
      {campaign.cta?.url ? (
        <a
          href={campaign.cta.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ctaClass} hover:opacity-90`}
        >
          {campaign.cta.label}
        </a>
      ) : (
        campaign.cta && (
          <button type="button" disabled className={`${ctaClass} cursor-not-allowed opacity-60`}>
            {campaign.cta.label}
          </button>
        )
      )}
    </section>
  );
}

const resolveProvider = (key: string): ProviderKey =>
  key in PROVIDERS ? (key as ProviderKey) : DEFAULT_PROVIDER;

/**
 * Paints the whole document in the receipt's palette, so the browser chrome
 * (iOS status-bar area, overscroll) matches instead of showing the default.
 */
function useDocumentTheme(provider: ProviderKey | undefined) {
  useEffect(() => {
    if (!provider) return;
    const t = PROVIDERS[provider];
    const html = document.documentElement;
    const body = document.body;
    html.style.backgroundColor = t.from;
    body.style.background = providerBackground(provider);
    body.style.backgroundAttachment = "fixed";

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = t.from;
  }, [provider]);
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-16 text-center text-slate-600">{children}</p>;
}

/** The top of a card terminal, upside down: the receipt feeds out of its slot. */
type PrinterStatus = "waiting" | "printing" | "done";

function Printer({ status }: { status: PrinterStatus }) {
  return (
    <div
      aria-hidden
      className="relative z-10 -mx-3 h-14 rounded-t-lg rounded-b-[1.75rem] bg-[linear-gradient(0deg,#3a3d44_0%,#1c1d21_55%,#111214_100%)] shadow-[0_16px_28px_-14px_rgba(0,0,0,0.7)] ring-1 ring-black/50 print:hidden"
    >
      <span
        className={`absolute top-3 right-6 h-1.5 w-1.5 rounded-full ${
          {
            waiting: "animate-pulse bg-amber-400",
            printing: "animate-[blink_0.35s_steps(2,jump-none)_infinite] bg-emerald-400",
            done: "bg-emerald-400",
          }[status]
        } shadow-[0_0_6px_currentColor]`}
      />
      {/* Paper slot */}
      <span className="absolute inset-x-2 bottom-0 h-2 rounded-t-sm bg-black shadow-[inset_0_2px_3px_rgba(0,0,0,0.9)]" />
    </div>
  );
}

const FEED_PX_PER_MS = 0.55;
const START_DELAY_MS = 350;
const CAMPAIGN_PAUSE_MS = 300;
const CAMPAIGN_MARGIN_PX = 16; // pause with a little paper showing above the campaign

/**
 * Keyframes that slide the paper out of the printer slot like a real
 * printer: the whole strip moves down, so its bottom edge leads. `pauseAt`
 * is how much paper is out when the campaign has fully emerged; the feed
 * holds there briefly so the campaign stays on screen a little longer.
 */
function feedKeyframes(height: number, pauseAt?: number) {
  const stops = pauseAt && pauseAt > 0 && pauseAt < height ? [pauseAt, height] : [height];
  const points = [
    { t: 0, pos: 0 },
    { t: START_DELAY_MS, pos: 0 },
  ];
  let t = START_DELAY_MS;
  let pos = 0;
  for (const stop of stops) {
    t += (stop - pos) / FEED_PX_PER_MS;
    pos = stop;
    points.push({ t, pos });
    if (stop < height) {
      t += CAMPAIGN_PAUSE_MS;
      points.push({ t, pos });
    }
  }
  return {
    duration: t,
    keyframes: points.map((p) => ({
      offset: p.t / t,
      transform: `translateY(${p.pos - height}px)`,
    })),
  };
}

/** Plays the feed animation once on mount (skipped for reduced motion). */
function usePrintAnimation(paperRef: React.RefObject<HTMLDivElement | null>, onDone: () => void) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDoneRef.current();
      return;
    }
    const height = paper.offsetHeight;
    const campaign = paper.querySelector<HTMLElement>("[data-print-pause]");
    const { keyframes, duration } = feedKeyframes(
      height,
      campaign ? height - campaign.offsetTop + CAMPAIGN_MARGIN_PX : undefined,
    );
    const animation = paper.animate(keyframes, { duration, easing: "linear", fill: "backwards" });
    animation.finished.then(
      () => onDoneRef.current(),
      () => {},
    ); // rejects if cancelled
    return () => animation.cancel();
  }, [paperRef]);
}

function PrintedReceipt({ tx, onPrinted }: { tx: Transaction; onPrinted: () => void }) {
  const paperRef = useRef<HTMLDivElement>(null);
  usePrintAnimation(paperRef, onPrinted);

  const money = (minor: number) => formatMoney(minor, tx.currency);
  const title = `${TRANSACTION_TYPES[tx.type] ?? "Purchase"} Successful`;
  const provider = PROVIDERS[resolveProvider(tx.provider)];

  return (
    // Clips the paper at the printer slot; side padding keeps the shadow visible.
    <div className="-mx-4 overflow-hidden px-4 pb-12 print:m-0 print:overflow-visible print:p-0">
      <div ref={paperRef} className="relative drop-shadow-2xl print:drop-shadow-none">
        <article className="torn-edges bg-white px-6 pt-10 pb-12 text-[15px] leading-relaxed text-gray-900 sm:px-10 lg:text-base">
          <header className="text-center">
            <img
              src={provider.logo.src}
              width={provider.logo.width}
              height={provider.logo.height}
              alt={provider.label}
              className="mx-auto h-16 w-auto max-w-[200px] object-contain"
            />
            <h1 className="mt-3 text-lg font-bold uppercase">{tx.merchant.name}</h1>
            {tx.merchant.address && <p className="mt-1 uppercase">{tx.merchant.address}</p>}
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
            <div>
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
            </div>
          )}

          <dl className="mt-3">
            <Row label="Total Amount" value={money(tx.total)} bold />
          </dl>

          <hr className="mt-4 border-t-2 border-gray-900" />

          {tx.campaign && (
            <div data-print-pause>
              <Campaign campaign={tx.campaign} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

export default function ReceiptView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [printed, setPrinted] = useState(false);

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

  useDocumentTheme(
    state.status === "ready" ? resolveProvider(state.receipt.transaction.provider) : undefined,
  );

  if (state.status === "not-found") return <Message>Receipt not found.</Message>;
  if (state.status === "outdated") {
    return <Message>This receipt was created in an older format and can&apos;t be shown.</Message>;
  }
  if (state.status === "error") return <Message>Couldn&apos;t load this receipt.</Message>;

  const tx = state.status === "ready" ? state.receipt.transaction : undefined;
  const provider = tx && PROVIDERS[resolveProvider(tx.provider)];

  return (
    <div
      className="min-h-dvh px-4 py-10 sm:py-16 print:p-0"
      style={provider && ({ "--accent": provider.accent } as React.CSSProperties)}
    >
      <div className="mx-auto w-full max-w-md lg:max-w-lg">
        <div
          className={`mb-6 hidden items-center justify-between sm:flex print:hidden ${tx ? "" : "invisible"}`}
        >
          <p className="text-sm font-medium tracking-wide text-white/80 uppercase">e-Receipt</p>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/25"
          >
            Print / Save PDF
          </button>
        </div>

        <Printer status={!tx ? "waiting" : printed ? "done" : "printing"} />
        <p className="sr-only" aria-live="polite">
          {tx ? "Receipt loaded" : "Loading receipt"}
        </p>
        {tx && <PrintedReceipt tx={tx} onPrinted={() => setPrinted(true)} />}
      </div>
    </div>
  );
}
