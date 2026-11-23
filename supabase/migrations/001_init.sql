create extension if not exists pgcrypto;

create table wallets (
  id uuid primary key default gen_random_uuid(),
  wallet_hash text not null unique,      -- HMAC of the BTC-XXXXXXXXXXXXXXXX id
  id_hint text not null,                 -- last 4 digits, for display
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create table wallet_sessions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  session_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index on wallet_sessions (wallet_id);

-- One row per Send BTC -> M-Pesa payment. Doubles as transaction history.
create table payment_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id),
  idempotency_key text not null,
  phone_masked text not null,
  invoice text not null,
  provider_invoice_id text not null unique,
  amount_tzs integer not null check (amount_tzs between 2500 and 100000),
  amount_sats bigint not null check (amount_sats > 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid_processing','delivered','expired','failed')),
  mpesa_receipt text,
  mpesa_recipient text,
  delivered_at timestamptz,
  paid_at timestamptz,
  last_polled_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (wallet_id, idempotency_key)
);
create index on payment_requests (wallet_id, created_at desc);
create index on payment_requests (status) where status in ('pending_payment','paid_processing');

-- Server uses the service role, which bypasses RLS. With RLS on and no policies,
-- the public anon key can read nothing.
alter table wallets enable row level security;
alter table wallet_sessions enable row level security;
alter table payment_requests enable row level security;
