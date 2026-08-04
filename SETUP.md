# Setup: Supabase + Gemini backend

This app has one real backend (FastAPI, `api/index.py`) backed by Supabase
Postgres, plus optional Google Gemini for the AI chat and auto-translation.
There is no offline/local-only mode — the menu, orders, tables, and
reservations all live in the database, and the app needs this setup to run
at all (the frontend calls `/api/*`, which returns `503` until Supabase is
configured).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a project.
2. **SQL Editor → New query**, paste [`db/schema.sql`](db/schema.sql) in full, run it.
3. New query again, paste [`db/seed.sql`](db/seed.sql) in full, run it — this
   creates a sample store, two menu items, and 14 tables under store id
   `11111111-1111-4111-8111-111111111111`.
4. **Project Settings → API Keys**: copy the **Project URL** and a **Secret
   key** (or, on older projects, the legacy `service_role` key).

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```dotenv
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # Project Settings → API Keys → anon/public
GEMINI_API_KEY=                         # from Google AI Studio (optional but recommended)
GEMINI_MODEL=gemini-3.6-flash
SUPABASE_URL=https://xxxxx.supabase.co  # same project, server side
SUPABASE_SERVICE_KEY=eyJ...             # Secret key / service_role — never expose to the browser
DEFAULT_STORE_ID=11111111-1111-4111-8111-111111111111
ALLOWED_ORIGINS=
```

`VITE_*` vars are read by the Vite frontend (only used for Supabase Auth —
see step 3). The rest are read server-side by `api/index.py` and must never
be prefixed `VITE_` or they'd ship to the browser.

## 3. Create your first staff login

Every admin write route (menu, tables, order/reservation status, review
replies) requires a Supabase Auth session **and** a matching row in the
`staff` table — this is what replaced Wexit's original unauthenticated admin
API.

1. Supabase dashboard → **Authentication → Users → Add user** (email + password).
2. Copy that user's UUID.
3. SQL Editor:
   ```sql
   insert into public.staff (id, store_id, role)
   values ('<paste the user UUID>', '11111111-1111-4111-8111-111111111111', 'owner');
   ```
4. Sign in at `/admin` with that email/password.

Add more staff the same way — any row in `staff` for a store can manage that
store.

## 4. Run it locally

```bash
npm install
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\Activate.ps1 on Windows
python -m pip install -r requirements.txt
```

The closest match to production is Vercel's own dev server, which serves the
Vite build and the Python function together:

```bash
npm install -g vercel   # once
vercel dev
```

Frontend-only iteration (`npm run dev`) also works, but `/api/*` calls will
404 unless the FastAPI server is running separately:

```bash
python -m uvicorn api.index:app --reload
```

## 5. (Optional) Gemini AI chat + auto-translation

Without `GEMINI_API_KEY`, `/api/chat` returns a static "AI unavailable"
message and the app falls back to the rule-based engine in
`src/lib/assistant.ts` for every message — menu browsing, ordering, and
reservations all keep working regardless. Menu translation
(`auto_translate_fields` in `api/index.py`) also silently falls back to
copying the English text into the ko/vi fields.

1. Get a key from [Google AI Studio](https://aistudio.google.com).
2. Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default
   `gemini-3.6-flash`).
3. That's it — no frontend change needed. The admin form only collects
   English name/description/allergy note; Korean and Vietnamese are filled
   in automatically on save.

## What stays true either way

- This is still single-store under the hood (`DEFAULT_STORE_ID`). Real
  multi-tenant self-serve signup isn't built — for a 1–3 site pilot, seeding
  each site by hand via SQL is the right amount of engineering for now, and
  the schema already carries `store_id` on every table for when that's needed.
- `mode=web` vs `mode=store` in the URL (see `TableQrView`) is a UX gate, not
  a security boundary — see api/index.py's docstrings before treating it as
  an access-control mechanism.
