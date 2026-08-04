-- Template for onboarding a new restaurant onto this same deployment
-- (multi-tenant: one Vercel deployment + one Supabase project serve every
-- store, distinguished by stores.slug — see api/index.py's
-- resolve_store_middleware and src/lib/storeSlug.ts).
--
-- Steps:
--   1. In Supabase Authentication > Users, create a login (email/password)
--      for the new restaurant's owner, or have them sign up themselves if
--      you've wired that up. Copy their User UID.
--   2. Fill in the placeholders below (store name/hours/description in
--      English — ko/vi auto-translate on first save from Store Settings —
--      and a unique url-safe slug, e.g. "my-new-restaurant").
--   3. Run this whole file once in the SQL Editor.
--   4. Give the owner their login + this URL:
--        https://<your-domain>/admin  (they'll land on this store after
--        signing in, since it's the only one their staff row grants).
--      Customer QR codes are generated from their own Seating/Tables admin
--      screens once they've signed in — no manual step needed there.

-- 1. The store itself.
insert into public.stores (id, slug, name, name_en, name_vi, hours, hours_en, hours_vi, description, description_en, description_vi)
values (
    gen_random_uuid(),
    'REPLACE-WITH-SLUG',           -- e.g. 'my-new-restaurant' — used in QR URLs, cannot change later without reprinting QR codes
    'REPLACE WITH STORE NAME',
    'REPLACE WITH STORE NAME',
    'REPLACE WITH STORE NAME',
    'REPLACE WITH HOURS',
    'REPLACE WITH HOURS',
    'REPLACE WITH HOURS',
    'REPLACE WITH DESCRIPTION',
    'REPLACE WITH DESCRIPTION',
    'REPLACE WITH DESCRIPTION'
)
returning id;  -- copy this id for step 2 below

-- 2. Link the owner's Supabase Auth account to the store you just created.
-- insert into public.staff (id, store_id, role)
-- values (
--     'REPLACE-WITH-USER-UID',       -- from Authentication > Users
--     'REPLACE-WITH-STORE-ID',       -- the id returned by the insert above
--     'owner'
-- );

-- That's it — no tables/menu are seeded here on purpose. The owner adds
-- their own tables (Seating) and menu (Menu) after signing in.
