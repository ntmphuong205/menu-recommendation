-- Run after schema.sql. Creates the first restaurant row.
-- The app seeds this restaurant's menu automatically from src/data/menu.ts
-- the first time the owner dashboard loads and finds no menu_items yet.

insert into restaurants (slug, name, cuisine, address, hours)
values (
  'fresh-bites',
  'Fresh Bites',
  'Korean & Vietnamese',
  '12 Flavor Street, District 1, Ho Chi Minh City',
  '[{"day":"Mon - Fri","time":"10:30 AM - 10:00 PM"},{"day":"Sat - Sun","time":"9:00 AM - 11:00 PM"}]'
)
on conflict (slug) do nothing;

-- After running this, create your first staff login:
-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password).
-- 2. Copy the new user's UUID, then run (replacing the placeholders):
--
-- insert into staff (id, restaurant_id, role)
-- values (
--   '<paste the auth user UUID here>',
--   (select id from restaurants where slug = 'fresh-bites'),
--   'owner'
-- );
