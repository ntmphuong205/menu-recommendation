# Deploying to Vercel

Steps to take this app from a configured Supabase project (see
[SETUP.md](SETUP.md)) to a live Vercel deployment. Never commit real secrets
to the repo.

## 1. Push to GitHub

Confirm `.env`, `.env.local`, `.env.production`, `.vercel`, `__pycache__/`,
and `*.pyc` are not committed (see `.gitignore`), then push this repo to
GitHub.

## 2. Create the Vercel project

1. Vercel Dashboard → **Add New → Project** → import the GitHub repo.
2. **Framework Preset**: `Other`.
3. **Root Directory**: this repo's root (where `api/`, `src/`, `package.json`,
   and `vercel.json` live).
4. Leave Build Command / Output Directory / Install Command on their
   defaults — Vercel auto-detects the Vite frontend build and the
   `api/index.py` Python function from `vercel.json`.

## 3. Environment variables

Project → **Settings → Environment Variables**, add for Production (and any
Preview environments you use):

```dotenv
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_ANON_KEY=<Supabase anon/public key>
GEMINI_API_KEY=<Google AI Studio API key>
GEMINI_MODEL=gemini-3.6-flash
SUPABASE_URL=<Supabase project URL>
SUPABASE_SERVICE_KEY=<Supabase Secret key or legacy service_role>
DEFAULT_STORE_ID=11111111-1111-4111-8111-111111111111
ALLOWED_ORIGINS=
```

Frontend and API share one Vercel domain, so `ALLOWED_ORIGINS` can stay
empty — only set it if you ever host the frontend on a separate origin.

## 4. Deploy and verify

Deploy, then open the deployment URL and check:

```text
/
/admin
/?mode=web
/?table=T1&mode=store
/api/health
/api/store
/api/menus
/api/tables
/api/docs
```

`/api/health`'s `database` must be `connected`, and `gemini_configured` must
be `true` if you set `GEMINI_API_KEY`. If either is off, check the
environment variables and the Function Logs.

## 5. Confirm the staff login

The `/admin` write routes require a Supabase Auth session **and** a matching
`staff` row (see SETUP.md step 3). Confirm you can sign in and that editing
the menu/tables actually saves — a 401/403 here means the JWT isn't being
sent or the `staff` row is missing/wrong `store_id`.

## 6. End-to-end checks

1. Owner: edit the store name/hours/description in Store Settings, add a
   menu item with a nutrition line.
2. Customer: confirm the new item shows up, with nutrition and tags correct.
3. Customer: place an order; owner: see it appear (polling refreshes every
   5s), advance it New → Preparing → Served.
4. Customer: request a reservation from the Info tab; owner: accept it, then
   confirm the table's status changed and, on cancel, that it frees back up
   correctly (only if no other active reservation exists for that table).
5. Owner: drag a table in Seating, save, confirm the customer app's table
   list reflects the new position after the next poll.
6. Customer: ask the chat something menu- or seating-related; confirm the
   reply is grounded in real data. Temporarily break `GEMINI_API_KEY` on a
   Preview deployment and confirm the rule-based fallback still answers.
7. Customer: leave a review; owner: reply to it in Reviews; confirm the
   reply shows up on the customer side.
8. Generate both QR types in Tables, scan each, confirm `mode=web` blocks
   ordering/reservation while `mode=store` allows it.

## 7. Logs and redeploys

- Vercel Project → **Deployments** → select a deployment → **Functions**/**Logs**
  for `api/index.py` errors.
- Supabase errors: check `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
  `DEFAULT_STORE_ID`, and that `db/schema.sql` + `db/seed.sql` actually ran.
- Gemini errors: check the API key, model access, and usage limits.
- Push to `main` (or your connected branch) to trigger a redeploy. Changing
  environment variables requires a manual Redeploy to take effect on
  existing deployments.

## Known limitations before a public commercial launch

- `mode=web`/`mode=store` is a UX gate, not a security boundary — anyone can
  add `?mode=store` to any URL. It only prevents accidental ordering from a
  general-purpose link, not deliberate misuse.
- No payments, PWA, push notifications, or multi-location support.
- 5-second polling, not full real-time (no WebSocket).
- Single store per deployment (`DEFAULT_STORE_ID`); the schema carries
  `store_id` everywhere for a future multi-tenant admin, but there's no
  self-serve signup flow yet.
