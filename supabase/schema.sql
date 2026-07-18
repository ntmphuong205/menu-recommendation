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
  detail text,
  ingredients text[] not null default '{}',
  allergy_note text not null default '',
  category text not null default 'Main',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number int not null,
  items jsonb not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists menu_items_restaurant_idx on menu_items (restaurant_id);
create index if not exists orders_restaurant_idx on orders (restaurant_id);

alter table restaurants enable row level security;
alter table staff enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;

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

-- Enable realtime so the owner dashboard and customer app see updates live.
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table menu_items;
