# CLAUDE.md

Receipts prototype: a (mock) payment terminal creates a digital receipt and
shows the customer a QR code linking to it.

## Layout

pnpm workspace monorepo. Each app is an independent Next.js 16 app
(TypeScript, App Router, Tailwind v4) and deploys as its own Vercel project.

```
apps/
  receipts/                 # Receipt service + public receipt page (port 3000)
    app/api/receipts/route.ts       POST: create receipt (x-api-key required)
    app/api/receipts/[id]/route.ts  GET: fetch receipt JSON by public ID
    app/r/[id]/page.tsx             Receipt page shell (server component)
    app/r/[id]/receipt-view.tsx     Client component: fetches the GET API and renders
    lib/schema.ts                   zod schema for the transaction payload + Receipt type
    lib/providers.ts                Payment providers (key -> label, logo, colour scheme)
    lib/id.ts                       22-char base62 receipt ID generator (CSPRNG, no modulo bias)
    lib/auth.ts                     Constant-time x-api-key check
    lib/supabase.ts                 Service-role Supabase client (server-only)
    public/providers/{key}.png      Provider logos (shown on the receipt; also used by mock-pay's picker)
  mock-pay/                 # "Receipt Demo": fake POS terminal (port 3001)
    app/page.tsx                    Server shell: passes RECEIPTS_API_URL (for provider logos) to Demo
    components/demo.tsx             Client: options panel + simulated terminal; drives the payment phases
    app/api/pay/route.ts            Server route: takes PayOptions + cart, builds a sample transaction, POSTs to receipts API
    components/terminal.tsx         Handheld terminal frame and screens (sale -> processing -> approved -> QR / error)
    components/payment-card.tsx     Tappable Visa card ("tap card" = pay)
    components/options-panel.tsx    Provider picker, campaign switch + type dropdown, itemised purchase switch
    lib/cart.ts                     Menu, random order, cartForOrder, priceCart (server-authoritative), parseCart
    lib/options.ts                  Campaign types (+ builders), provider keys, PayOptions + parser (client-safe)
    lib/sample-transaction.ts       Sample card transaction (fixed merchant/terminal/card values + priced cart)
supabase/migrations/        # SQL for the `receipts` table
```

## Request flow

1. mock-pay creates one random order per sale and shows it on the terminal
   screen; the itemised switch only changes whether the lines are sent (the
   total is identical). User picks options and taps the card -> browser calls
   `POST /api/pay` with `{ provider, campaign, itemized, cart }` (mock-pay server).
2. mock-pay server validates the options against its allow-lists, validates the
   cart (menu indexes/quantities or amount range; falls back to a random cart)
   and prices it itself, builds a sample transaction and calls
   `POST {RECEIPTS_API_URL}/api/receipts` with `x-api-key: RECEIPTS_API_KEY`.
3. receipts checks the key, validates the body with zod, generates a random
   receipt ID, inserts `{ id, transaction_id, data }` into Supabase, and returns
   `201 { id, url, createdAt }` where `url = {RECEIPTS_PUBLIC_BASE_URL}/r/{id}`.
4. Terminal shows Processing -> Approved, then `url` as a QR code on its screen.
5. Customer opens `/r/{id}`; the client component calls `GET /api/receipts/{id}`
   and renders the receipt.

## Key decisions / invariants

- **Receipt ID is not the transaction ID.** It is 22 random base62 chars
  (~131 bits), so receipt URLs are unguessable and don't expose transaction IDs.
  `transaction_id` is unique in the DB; a duplicate POST returns 409.
- **Service role key is server-only.** `lib/supabase.ts` imports `server-only`,
  so importing it from a client component fails the build. Never expose it via
  `NEXT_PUBLIC_*`. The table has RLS enabled with no policies, so the anon key
  can't read it.
- The receipts API key is also server-only; the mock-pay browser never sees it
  (it calls mock-pay's own `/api/pay` route).
- Money is integer minor units (sen/cents); `currency` is ISO 4217.
- The receipt mirrors a card-terminal slip: merchant header, `{type} Successful`
  title, MID/TID, entry/card type, app name, masked card number, expiry, trace,
  approval code, ref no, batch, AID, total. Line items (`items`, `subtotal`,
  `tax`) are optional; mock-pay sends them only when "itemised" is on.
- Card data is validated so nothing sensitive is stored: `maskedPan` must be
  masked (first 6 + `*` + last 4) and `expiry` must be `**/**`.
- `timestamp` carries the terminal's UTC offset; the receipt shows that
  wall-clock time as `DD/MM/YYYY HH:mm:ss`, independent of the viewer's timezone.
- GET returns 410 for rows stored under an older schema that no longer validates.
- **Providers, not raw colours.** `provider` is a key in
  `apps/receipts/lib/providers.ts` (`fasspay` default, `aeon`). The receipts app
  owns each provider's logo and colour scheme: the logo heads the receipt, the
  palette sets the page background and the `--accent` CSS variable used by the
  campaign block. Callers send only the key. To add one, add an entry plus
  `public/providers/{key}.png`, and mirror the key in
  `apps/mock-pay/lib/options.ts`. Old receipts with a `theme` field render with
  the default provider.
- The receipt page paints `<html>`/`<body>` and `meta[name=theme-color]` in the
  provider palette once loaded, so mobile browser chrome / overscroll match the theme.
- **Campaign** (optional): `{ title, body?, cta?: { label, url? } }`, shown as a
  dashed voucher below the total. `cta.url` must be http(s); without it the
  button renders disabled (mock-pay's "Get the app" / "Apply now" are
  placeholders). mock-pay campaign types: RM5 off next visit, download our app,
  upcoming store sale (date = payment date + 14 days), credit card sign-up
  (fictional "Contoh Bank"); built server-side at payment time.
- The terminal's QR is not a link; "Or, click here" below it opens the receipt.
- Desktop (`sm`+): an "e-Receipt" bar with Print / Save PDF; print CSS drops
  the background and buttons.
- Default styling: Fasspay palette tokens (`brand-navy`, `brand-blue`, `brand-sky`) in
  `apps/receipts/app/globals.css`; `.torn-edges` gives the receipt zigzag edges.
- `GET /api/receipts/[id]` is public: anyone with the ID can read the receipt.
  Malformed IDs return 404 without a DB query.
- POST status codes: 401 bad/missing key, 400 invalid JSON, 422 schema failure,
  409 duplicate transactionId, 500 storage error, 201 created.
- Next.js 16: route/page `params` are a `Promise` and must be awaited.

## Commands

```bash
pnpm install
pnpm dev              # both apps (receipts :3000, mock-pay :3001)
pnpm dev:receipts
pnpm dev:mock-pay
pnpm build            # builds both (includes type-check)
pnpm typecheck
```

## Environment

Copy `.env.example` to `.env.local` in each app.

| App      | Var                         | Notes                                   |
|----------|-----------------------------|-----------------------------------------|
| receipts | `SUPABASE_URL`              | Project URL                             |
| receipts | `SUPABASE_SERVICE_ROLE_KEY` | Server-only                             |
| receipts | `RECEIPTS_API_KEY`          | Shared secret required on POST          |
| receipts | `RECEIPTS_PUBLIC_BASE_URL`  | Optional; defaults to request origin    |
| mock-pay | `RECEIPTS_API_URL`          | Base URL of the receipts deployment     |
| mock-pay | `RECEIPTS_API_KEY`          | Must equal receipts' `RECEIPTS_API_KEY` |

## Infrastructure

- **Database: Supabase.** Apply `supabase/migrations/*.sql` via the SQL editor
  or `supabase db push`.
- **Hosting: Vercel.** Projects `receipt-prototype-receipts` and
  `receipt-prototype-mock-pay` (Root Directory `apps/receipts` / `apps/mock-pay`).
  Production URLs: https://receipt-prototype-receipts.vercel.app and
  https://receipt-prototype-mock-pay.vercel.app. Deployment Protection is
  "Standard" so production URLs are public (required: mock-pay calls receipts
  server-to-server and customers open receipt links). Not Git-linked yet;
  deploy from the repo root with
  `VERCEL_ORG_ID=… VERCEL_PROJECT_ID=… npx vercel deploy --prod`.
- **Git: GitHub** `ss-bentai/receipt-prototype`.
