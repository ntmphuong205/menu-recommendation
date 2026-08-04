# MenuPilot AI (Fresh Bites)

A restaurant QR-ordering, table-reservation, and AI menu assistant product,
merged from two prototypes into one system: React SPA frontend (originally
ICAPS) + FastAPI/Supabase/Gemini backend (originally Wexit's Q-Menu). Two
apps, one codebase:

- **`/`** — the customer app, styled as an iPhone so it demos from any browser.
  Table comes from a `?table=T1` URL param (what a table's QR code encodes);
  `?mode=web` vs `?mode=store` (see `TableQrView`) distinguishes a general
  browsing/AI-only QR from a physical table's full-ordering QR.
- **`/admin`** — the owner dashboard: live orders by table, seating-layout
  editor, reservation/waiting approval, menu management, review replies,
  sales analytics, and QR code generation.

## Features

- **Chat** — AI menu/seating guidance grounded in the live menu, table
  layout, and store data (Gemini, `POST /api/chat`); falls back to a free
  rule-based engine (`src/lib/assistant.ts`) if no AI key is configured or a
  request fails — the app never breaks for lack of a key.
- **Menu** — browse, search, filter by tag; each dish shows an auto-computed
  nutrition breakdown (owner enters ingredients + grams, not the numbers
  directly) and its rating from customer reviews.
- **Seating & reservations** — customers see live table availability and can
  request a reservation or join the waiting list; the owner dashboard
  approves/cancels requests and edits the floor plan with a drag-and-drop
  editor.
- **Cart** — review, adjust quantities, confirm an order, track queue
  position + estimated wait per item (cancel before the kitchen starts).
- **Info** — hours, best sellers, FAQ, table availability, and a "Call Staff"
  button that alerts the owner dashboard in real time.
- **Owner dashboard** — orders grouped by table with a New → Preparing →
  Served/Cancelled flow per dish, reservation/waiting/call-staff approval,
  menu CRUD with the nutrition calculator, review replies, revenue/top-dish
  analytics, dual-mode QR codes per table.

## Architecture

```
src/          React 19 + Vite + TypeScript + Tailwind — the only frontend
api/index.py  FastAPI — the only backend, talks to Supabase with the service key
db/           schema.sql + seed.sql for the Supabase Postgres database
```

The frontend never talks to Supabase directly for business data — every
read/write goes through `src/lib/apiClient.ts` → `/api/*`. Supabase Auth is
used client-side only for owner login (`src/store/useOwnerAuth.ts`); the
resulting JWT is sent as a Bearer token and verified server-side
(`require_staff` in `api/index.py`) before any admin write is allowed.

## Getting started

This app needs its backend configured to run at all — see
**[SETUP.md](SETUP.md)** for the full Supabase + Gemini setup (a few minutes,
free tier is enough). Once set up:

```bash
npm install
vercel dev          # serves the Vite frontend + Python API together
```

Open the printed local URL — `/` for the customer app, `/admin` for the
owner dashboard.

## Business proposal

[docs/restaurant-proposal.html](docs/restaurant-proposal.html) is a
bilingual (VI/EN) one-page pilot proposal for outreach to prospective
restaurants — pricing, what's included, and the 60-day free pilot offer.

## Build

```bash
npm run build       # frontend (dist/)
```

The Python backend (`api/index.py`) needs no build step — Vercel deploys it
directly as a serverless function (see `vercel.json`).
