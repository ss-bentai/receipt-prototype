# receipt-prototype

Digital receipt prototype: `apps/mock-pay` simulates a payment and shows a QR
code linking to a receipt served by `apps/receipts` (Next.js + Supabase on Vercel).

See [CLAUDE.md](./CLAUDE.md) for architecture, setup and deployment.

```bash
pnpm install
cp apps/receipts/.env.example apps/receipts/.env.local
cp apps/mock-pay/.env.example apps/mock-pay/.env.local
# apply supabase/migrations/0001_create_receipts.sql to your Supabase project
pnpm dev
```
