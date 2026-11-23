# BTC Pay backend: Send BTC to M-Pesa

Built on https://github.com/bmosha00/chapsmart-lnurl (LNURL-pay + LUD-21 verify). ChapSmart needs no API key.

## Setup
1. `cp .env.example .env.local`, fill Supabase keys, set `WALLET_PEPPER` (`openssl rand -hex 32`).
2. Run `supabase/migrations/001_init.sql` in the Supabase SQL editor.
3. `npm install && npm run test && npm run dev`

## Flow
1. `POST /api/wallet/create` {displayName} -> returns `walletId` once, sets session cookie
2. `POST /api/payments/quote` {phone, amountTzs} -> estimate (rate, 2.2% fee, sats, 60s validity)
3. `POST /api/payments/generate` (header `Idempotency-Key`) -> Lightning invoice, fixed sats
4. Client polls `GET /api/payments/status/:id` every ~5s. Server calls ChapSmart `verify`, max once per 4s per payment.
   `pending_payment` -> `paid_processing` (sats received) -> `delivered` (M-Pesa receipt) | `expired`
5. `GET /api/transactions` -> history (recipient masked)

## Rules from the provider
- Vodacom M-Pesa only (0740-0769, 0790-0799), 2,500-100,000 TZS, fee 2.2% on top, invoice expires in 15 min.
- 30 requests/min per IP: server enforces a global 25/min budget and caches status polls.

## Before real money
- Replace in-memory rate limits with Redis/Upstash if you run more than one instance.
- Wallet ID is the only credential: consider an optional PIN. Test with small amounts first.
- Add Privacy Policy and Terms, and confirm with ChapSmart that your server IP and volume are acceptable.

## Frontend
`public/index.html` is the whole site (landing, FAQ, sign-in toggle, dashboard, Send BTC flow with QR and live status). `next.config.mjs` serves it at `/`. It talks to the API routes above with the session cookie, no keys in the browser.
