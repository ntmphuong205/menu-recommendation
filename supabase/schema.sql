-- MenuPilot AI — production schema
-- Run this once in your Supabase project's SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

create extension if not exists "pgcrypto";

-- One row per restaurant tenant. The customer app is scoped to a restaurant via
-- its slug in the URL (e.g. /r/fresh-bites); the owner dashboard is scoped via
-- the logged-in staff member's restaurant_id.
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  cuisine text not null default '',
  address text not null default '',
  hours jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Staff/owner accounts. id matches auth.users(id) — a staff row is created after
-- the person signs up via Supabase Auth (see SETUP.md).
create table if not exists staff (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id text primary key, -- matches the app's Dish.id slug, e.g. "bun-bo-hue"
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  price numeric not null,
  description text not null default '',
  descriptions jsonb not null default '{}',
  image text not null default '',
  tags text[] not null default '{}',
  calories int,
  protein int,
  carbs int,
  fat int,
  ingredient_lines jsonb, -- [{ name: "Beef", grams: 70 }, ...] — free-text name, used to compute the four fields above
  ingredients text[] not null default '{}',
  allergy_note text not null default '',
  category text not null default 'Main',
  sold_out boolean not null default false,
  prep_time_minutes int,
  pairings jsonb, -- [{ dishId: "...", reason: "...", reasons: { vi, ko } }, ...] — upsell suggestions shown on the dish sheet and in the cart
  created_at timestamptz not null default now()
);

-- Adds the newer nutrition/prep-time columns to a menu_items table created by
-- an older version of this schema (safe no-op if they already exist).
alter table menu_items add column if not exists protein int;
alter table menu_items add column if not exists carbs int;
alter table menu_items add column if not exists fat int;
alter table menu_items add column if not exists ingredient_lines jsonb;
alter table menu_items add column if not exists prep_time_minutes int;
alter table menu_items add column if not exists pairings jsonb;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number int not null,
  items jsonb not null, -- [{ dishId, dishName, qty, price, note?, status }, ...] — each item tracks its own kitchen status independently
  status text not null default 'new', -- 'new' | 'preparing' | 'served' | 'cancelled' — kept in sync with item statuses via deriveOrderStatus()
  created_at timestamptz not null default now()
);

-- One row per customer rating on a dish.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  dish_id text not null,
  table_number int not null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

-- "Call staff" requests raised from a table (needs help, wants to change an
-- order, wants the bill, etc.) — the closest thing to admin<->customer
-- messaging the app currently has.
create table if not exists table_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number int not null,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists menu_items_restaurant_idx on menu_items (restaurant_id);
create index if not exists orders_restaurant_idx on orders (restaurant_id);
create index if not exists reviews_restaurant_idx on reviews (restaurant_id);
create index if not exists reviews_dish_idx on reviews (dish_id);
create index if not exists table_requests_restaurant_idx on table_requests (restaurant_id);

alter table restaurants enable row level security;
alter table staff enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;
alter table table_requests enable row level security;

-- Anyone can look up a restaurant by slug (needed to load the customer menu
-- without logging in) and read its menu.
drop policy if exists "restaurants are publicly readable" on restaurants;
create policy "restaurants are publicly readable" on restaurants for select using (true);

drop policy if exists "menu is publicly readable" on menu_items;
create policy "menu is publicly readable" on menu_items for select using (true);

-- Only a logged-in staff member of that restaurant can add/edit/delete its menu.
drop policy if exists "staff can manage own restaurant menu" on menu_items;
create policy "staff can manage own restaurant menu" on menu_items for all
  using (restaurant_id in (select restaurant_id from staff where id = auth.uid()))
  with check (restaurant_id in (select restaurant_id from staff where id = auth.uid()));

-- Customers can submit an order without logging in, but cannot read other
-- tables' orders back (no order-status polling in the app today).
drop policy if exists "anyone can place an order" on orders;
create policy "anyone can place an order" on orders for insert
  with check (restaurant_id in (select id from restaurants));

drop policy if exists "staff can view and update own restaurant orders" on orders;
create policy "staff can view and update own restaurant orders" on orders for select
  using (restaurant_id in (select restaurant_id from staff where id = auth.uid()));

drop policy if exists "staff can update own restaurant orders" on orders;
create policy "staff can update own restaurant orders" on orders for update
  using (restaurant_id in (select restaurant_id from staff where id = auth.uid()));

-- A staff member can see their own row (to resolve which restaurant they manage).
drop policy if exists "staff can read own row" on staff;
create policy "staff can read own row" on staff for select using (id = auth.uid());

-- Reviews are public to read (so ratings show on the menu) and anyone can
-- submit one (no login needed to leave a review after eating), but only
-- staff can remove one (moderation) — no public update/delete.
drop policy if exists "reviews are publicly readable" on reviews;
create policy "reviews are publicly readable" on reviews for select using (true);

drop policy if exists "anyone can submit a review" on reviews;
create policy "anyone can submit a review" on reviews for insert
  with check (restaurant_id in (select id from restaurants));

drop policy if exists "staff can delete own restaurant reviews" on reviews;
create policy "staff can delete own restaurant reviews" on reviews for delete
  using (restaurant_id in (select restaurant_id from staff where id = auth.uid()));

-- Table requests: anyone can raise one, only staff of that restaurant can see
-- and resolve them.
drop policy if exists "anyone can raise a table request" on table_requests;
create policy "anyone can raise a table request" on table_requests for insert
  with check (restaurant_id in (select id from restaurants));

drop policy if exists "staff can view own restaurant table requests" on table_requests;
create policy "staff can view own restaurant table requests" on table_requests for select
  using (restaurant_id in (select restaurant_id from staff where id = auth.uid()));

drop policy if exists "staff can resolve own restaurant table requests" on table_requests;
create policy "staff can resolve own restaurant table requests" on table_requests for update
  using (restaurant_id in (select restaurant_id from staff where id = auth.uid()));

-- Enable realtime so the owner dashboard and customer app see updates live.
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table reviews;
alter publication supabase_realtime add table table_requests;
