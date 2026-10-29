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
    lib/id.ts                       22-char base62 receipt ID generator (CSPRNG, no modulo bias)
    lib/auth.ts                     Constant-time x-api-key check
    lib/supabase.ts                 Service-role Supabase client (server-only)
    public/merchant-logo.svg        Static placeholder merchant logo shown on every receipt
  mock-pay/                 # Fake POS terminal (port 3001)
    app/page.tsx                    Client page: Pay button, shows receipt URL as QR code
    app/api/pay/route.ts            Server route: builds a sample transaction, POSTs to receipts API
    lib/sample-transaction.ts       Sample card transaction (fixed merchant/terminal/card values, random total)
supabase/migrations/        # SQL for the `receipts` table
```

## Request flow

1. User clicks **Pay** in mock-pay -> browser calls `POST /api/pay` (mock-pay server).
2. mock-pay server builds a sample transaction and calls
   `POST {RECEIPTS_API_URL}/api/receipts` with `x-api-key: RECEIPTS_API_KEY`.
3. receipts checks the key, validates the body with zod, generates a random
   receipt ID, inserts `{ id, transaction_id, data }` into Supabase, and returns
   `201 { id, url, createdAt }` where `url = {RECEIPTS_PUBLIC_BASE_URL}/r/{id}`.
4. mock-pay renders `url` as a QR code.
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
  `tax`) are optional and mock-pay doesn't send them.
- Card data is validated so nothing sensitive is stored: `maskedPan` must be
  masked (first 6 + `*` + last 4) and `expiry` must be `**/**`.
- `timestamp` carries the terminal's UTC offset; the receipt shows that
  wall-clock time as `DD/MM/YYYY HH:mm:ss`, independent of the viewer's timezone.
- GET returns 410 for rows stored under an older schema that no longer validates.
- Styling: Fasspay palette tokens (`brand-navy`, `brand-blue`, `brand-sky`) in
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
