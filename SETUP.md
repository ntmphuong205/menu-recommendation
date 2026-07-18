# Going from demo to a real backend

By default, this app runs in **local demo mode**: the menu and orders live only
in your browser's `localStorage`, and Menu AI uses a free rule-based
recommendation engine. That's enough to demo the product from a laptop with no
setup — nothing below is required for that.

This guide covers turning on the real, multi-device backend described in the
business plan: cloud menu/order storage, staff login, and an optional real AI
fallback.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free account and a new project.
2. In the project dashboard, go to **SQL Editor → New query**, paste the contents
   of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Do the same with [`supabase/seed.sql`](supabase/seed.sql) — this creates the
   first restaurant row (`fresh-bites`).
4. Go to **Project Settings → API** and copy the **Project URL** and **anon
   public key**.
5. In this project's root folder, copy `.env.example` to `.env.local` and paste
   those two values in:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
6. Restart `npm run dev`. The app now uses Supabase — the first time the
   customer app or owner dashboard loads, it automatically seeds the cloud menu
   from `src/data/menu.ts`, and every order/menu edit syncs live across every
   device (not just tabs in the same browser, like local demo mode).

## 2. Create your first staff login

The owner dashboard (`/admin`) is only login-gated once Supabase is configured
(in local demo mode it stays open, since there's nothing to protect yet).

1. Supabase dashboard → **Authentication → Users → Add user**, set an email + password.
2. Copy that user's UUID.
3. Run in the SQL editor (see the commented block at the bottom of `seed.sql`):
   ```sql
   insert into staff (id, restaurant_id, role)
   values ('<paste the user UUID>', (select id from restaurants where slug = 'fresh-bites'), 'owner');
   ```
4. Sign in at `/admin` with that email/password.

Add more staff the same way — every row in `staff` for a restaurant can manage
that restaurant's menu and orders.

## 3. (Optional) Turn on real AI for hard requests

The rule-based engine (`src/lib/assistant.ts`) handles the large majority of
requests for free by matching keywords to menu tags — in English, Vietnamese,
and Korean. It only reaches for AI on the rare request it can't confidently
match (its "I don't understand" fallback), which is exactly the "start with
low-cost rules, only pay for AI where it adds value" approach from the
business plan.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and log in
   (`supabase login`), then link it to your project (`supabase link`).
2. Get an API key from [platform.openai.com](https://platform.openai.com).
3. Deploy the function and set the key as a secret (never exposed to the browser):
   ```
   supabase functions deploy recommend
   supabase secrets set OPENAI_API_KEY=sk-...
   ```
4. That's it — no frontend change needed. `src/lib/aiClient.ts` calls this
   function automatically once it's deployed, and silently keeps using the free
   rule-based fallback if the function or key isn't there.

## What stays true either way

- Without any of the above, the app is fully functional for a live demo —
  everything in this guide is additive.
- Ingredients/allergy notes and the FAQ are English-only for now; translating
  those is a content task (add more locale strings to `src/i18n/translations.ts`
  and `src/data/menu.ts`'s `descriptions` field), not an architecture change.
- This is still single-restaurant under the hood (the `fresh-bites` slug). Real
  multi-restaurant self-serve signup (a new restaurant creating its own account)
  isn't built — for a 1–3 site pilot, seeding each site's row by hand via SQL
  (like `seed.sql`) is the right amount of engineering for now.
