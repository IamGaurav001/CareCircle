# CareCircle

Verified funds for medical and community needs, built for the PayPal + AI hackathon.
A hospital estimate becomes a reviewed fund that relatives pay into through PayPal.
AI explains the bill, code enforces the rules, and a person approves every step that moves money.

**Plan and architecture:** https://claude.ai/artifact/1RqN1x6Tym6tmzgpdPSESm
(tab 1 is the idea, tab 2 is the architecture; each new task gets its own tab).

Everything runs in the PayPal sandbox with synthetic bills. No real money, no real medical documents.

## Stack

Next.js 16 (App Router, TypeScript) · Supabase (Postgres, Auth, Storage) · Drizzle ORM ·
Claude API (`@anthropic-ai/sdk`) · PayPal REST APIs (Orders v2, Payouts, Webhooks) · Tailwind CSS · Vercel

## Setup

1. Install Node 20 or newer, then install packages:
   ```bash
   npm install
   ```
2. Copy the env template and fill it in (see the comments in the file for where each value comes from):
   ```bash
   cp .env.example .env.local
   ```
3. Create the database tables:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
4. Start the app at http://localhost:3000:
   ```bash
   npm run dev
   ```
5. For PayPal webhooks locally, expose the app (for example with `ngrok http 3000`) and point the
   sandbox webhook at `https://<your-url>/api/webhooks/paypal`.

## Folder map

```
src/
  app/
    page.tsx                  landing page
    api/
      funds/                  create, upload, submit, review, orders, release, receipts, ledger, report
      orders/[orderId]/capture
      webhooks/paypal         PayPal events -> ledger
  lib/
    env.ts                    validated server settings
    db/schema.ts              the 9 tables (money in integer cents)
    db/index.ts               Drizzle client
    ledger/                   balance = sum of entries; idempotent append
    paypal/client.ts          OAuth token + REST calls with PayPal-Request-Id
    ai/client.ts              Anthropic client and model id
    supabase/                 server and browser clients
    http.ts                   shared response helpers
drizzle/                      generated SQL migrations (after db:generate)
```

All API routes except the PayPal webhook currently return `501 Not Implemented`; each file says what it will do.

## PayPal payout test

Before building features we prove the money path works in the sandbox (tab 3 of the plan doc).
It needs only `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `.env.local`:

```bash
npm run paypal:test -- token
npm run paypal:test -- order 10.00
npm run paypal:test -- capture
npm run paypal:test -- payout <india-sandbox-email> 5.00
npm run paypal:test -- status
```

## Rules we keep

- PayPal, AI and database calls happen only on the server (`import "server-only"`).
- Every balance shown to a user comes from the ledger, never from the AI.
- Every PayPal write sends a stable `PayPal-Request-Id`, so retries cannot move money twice.
- A suspicious AI flag sends a case to the reviewer; it never rejects a family automatically.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | Generate SQL migrations from `schema.ts` |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:studio` | Browse the database |
| `npm run paypal:test -- <step>` | PayPal sandbox payout test |
