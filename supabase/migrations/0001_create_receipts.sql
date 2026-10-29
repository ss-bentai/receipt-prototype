-- Receipts are stored as a JSON document keyed by a public, unguessable ID.
-- The public ID is deliberately separate from the transaction ID so that
-- receipt URLs never leak or allow enumeration of transaction IDs.
create table if not exists public.receipts (
  id             text primary key check (id ~ '^[0-9A-Za-z]{22}$'),
  transaction_id text not null unique,
  data           jsonb not null,
  created_at     timestamptz not null default now()
);

-- RLS on with no policies: anon/authenticated roles get nothing.
-- Only the service role key (used server-side in apps/receipts) can read/write.
alter table public.receipts enable row level security;
