# MenuPilot AI (Fresh Bites)

A restaurant QR-ordering + AI menu assistant prototype for the I-CAPS team pitch, built for a Korean-Vietnamese fusion menu. React + Vite + TypeScript + Tailwind. Two apps in one codebase:

- **`/`** — the customer app, styled as an iPhone so it demos from any browser. Table number comes from a `?table=N` URL param (what a table's QR code encodes).
- **`/admin`** — the owner dashboard: live orders by table, menu management, sales analytics, and QR code generation for every table.

## Features

- **Chat** — conversational AI menu recommendations based on mood/cravings, plus natural-language ordering (quantity + customization notes), in Vietnamese, English, and Korean
- **Menu** — browse, search, and filter dishes by tag
- **Cart** — review, adjust quantities, and confirm an order
- **Info** — restaurant hours, best sellers, FAQ
- **Owner dashboard** — orders grouped by table with a New → Preparing → Served flow, menu CRUD, revenue/top-dish analytics, per-table QR codes

The recommendation engine (`src/lib/assistant.ts`) is rule-based (keyword matching in all three languages) by default — free and offline-reliable for demos. It automatically upgrades to a real AI call for the requests it can't confidently match once you deploy the optional Supabase Edge Function (see below).

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL — `/` for the customer app, `/admin` for the owner dashboard. By default the app runs in **local demo mode**: menu and orders live in the browser only (synced live across tabs), no account needed.

## Going further: real backend, staff login, real AI

See [SETUP.md](SETUP.md) for connecting a free Supabase project — this adds cloud storage (multi-device sync, not just multi-tab), staff login for `/admin`, and an optional real AI fallback. None of it is required for a demo; the app works fully without it.

## Business proposal

[docs/restaurant-proposal.html](docs/restaurant-proposal.html) is a bilingual (VI/EN) one-page pilot proposal for outreach to prospective restaurants — pricing, what's included, and the 60-day free pilot offer.

## Build

```bash
npm run build
```
