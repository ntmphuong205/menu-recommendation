-- Q-Menu / MenuPilot unified schema (ICAPS + Wexit merge).
-- Run once against a fresh Supabase project's SQL Editor, before seed.sql.
--
-- The original Wexit schema.sql was deleted from that repo's history
-- (commit 805597f) even though api/index.py and the docs still depend on
-- its tables and two RPC functions. This file reconstructs it from the
-- behavior actually implemented in api/index.py, and extends it with the
-- fields ICAPS's menu/order/review/call-staff features need.

create extension if not exists "pgcrypto";

create table if not exists public.stores (
    id uuid primary key default gen_random_uuid(),
    -- URL-safe identifier for multi-tenant routing (?store=<slug> on
    -- customer QR links, and the admin store switcher). Chosen once when
    -- the store is provisioned; not editable through the admin UI since
    -- changing it would break already-printed QR codes.
    slug text not null unique,
    name text not null,
    name_en text default '',
    name_vi text default '',
    hours text default '',
    hours_en text default '',
    hours_vi text default '',
    description text default '',
    description_en text default '',
    description_vi text default '',
    recommendation_keywords jsonb not null default '[]'::jsonb,
    menu_categories jsonb not null default '[]'::jsonb,
    -- Bank transfer details for remote pre-orders (VietQR) — an
    -- alternative to VNPay that needs no merchant/business registration.
    -- Null until the owner fills them in via Store Settings.
    bank_bin text,
    bank_account_number text,
    bank_account_holder text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- One row per staff member per store; the FastAPI auth dependency checks
-- this table after verifying the caller's Supabase Auth JWT.
create table if not exists public.staff (
    id uuid primary key references auth.users(id) on delete cascade,
    store_id uuid not null references public.stores(id) on delete cascade,
    role text not null default 'owner',
    created_at timestamptz not null default now(),
    unique (id, store_id)
);

create table if not exists public.menus (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    name jsonb not null default '{}'::jsonb,
    price numeric(12, 2) not null default 0 check (price >= 0),
    currency text not null default 'KRW',
    description jsonb not null default '{}'::jsonb,
    category text default '',
    tags jsonb not null default '[]'::jsonb,
    image_data text,
    image_url text,
    is_sold_out boolean not null default false,
    -- Auto-computed by the admin nutrition calculator from ingredient_lines
    -- (owner enters ingredients + grams, not the macro numbers directly).
    calories integer check (calories is null or calories >= 0),
    protein integer check (protein is null or protein >= 0),
    carbs integer check (carbs is null or carbs >= 0),
    fat integer check (fat is null or fat >= 0),
    ingredient_lines jsonb not null default '[]'::jsonb,
    allergy_note jsonb not null default '{}'::jsonb,
    prep_time_minutes integer default 10 check (prep_time_minutes is null or prep_time_minutes > 0),
    pairings jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists menus_store_id_idx on public.menus(store_id);

create table if not exists public.tables (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    table_code text not null,
    x numeric(5, 2) not null default 0 check (x >= 0 and x <= 100),
    y numeric(5, 2) not null default 0 check (y >= 0 and y <= 100),
    status text not null default 'available' check (status in ('available', 'soon', 'reserved', 'occupied')),
    view_name text default '',
    tag text default '',
    capacity integer not null default 4 check (capacity > 0),
    table_image text,
    view_image text,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (store_id, table_code)
);
create index if not exists tables_store_id_idx on public.tables(store_id);

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    -- Null for remote pre-orders (fulfillment_type = 'pickup') — those
    -- aren't tied to a physical table, only a pickup_code.
    table_id text,
    menu_id uuid not null references public.menus(id),
    menu_name text not null default '',
    quantity integer not null check (quantity > 0),
    total_price numeric(12, 2) not null default 0,
    currency text not null default 'KRW',
    -- Customization note from the customer's cart (ICAPS feature).
    note text default '',
    -- One row per dish, but every dish confirmed together in the same
    -- cart checkout shares this id — the frontend groups rows by it to
    -- reconstruct ICAPS's "one Order has many items" concept on top of
    -- Wexit's one-row-per-dish schema. Defaults to its own row's id when
    -- the client doesn't send one (a lone, ungrouped order).
    order_group_id uuid not null default gen_random_uuid(),
    -- dine_in = served at table (default, existing flow). pickup = remote
    -- pre-order, paid upfront, collected at the counter.
    fulfillment_type text not null default 'dine_in' check (fulfillment_type in ('dine_in', 'pickup')),
    -- Short code shown to the customer to hand to staff at pickup —
    -- shared across every row in the same order_group_id. Null for dine_in.
    pickup_code text,
    -- vnpay = confirmed automatically by the IPN webhook. bank_transfer =
    -- VietQR, confirmed manually by staff (see PUT /orders/{id}/status).
    -- Null for dine_in orders.
    payment_method text check (payment_method in ('vnpay', 'bank_transfer')),
    -- VNPay transaction reference (blank for bank_transfer, staff-confirmed
    -- instead) + timestamp, set once payment is confirmed.
    payment_ref text,
    paid_at timestamptz,
    -- Per-item kitchen status. awaiting_payment is a pre-kitchen holding
    -- state for pickup orders — the IPN webhook flips the whole group to
    -- 'new' on payment success, after which it behaves exactly like a
    -- dine_in order (served = picked up, for pickup orders).
    status text not null default 'new' check (status in ('awaiting_payment', 'new', 'preparing', 'served', 'cancelled')),
    customer_session_id uuid not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists orders_store_id_idx on public.orders(store_id);
create index if not exists orders_customer_session_idx on public.orders(customer_session_id);
create index if not exists orders_group_id_idx on public.orders(order_group_id);

create table if not exists public.reservations (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    table_id text not null,
    status text not null default 'waiting' check (status in ('reserved', 'waiting', 'accepted', 'cancelled')),
    customer_session_id uuid not null,
    party_size integer not null default 0 check (party_size >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists reservations_store_id_idx on public.reservations(store_id);
create index if not exists reservations_customer_session_idx on public.reservations(customer_session_id);

create table if not exists public.reviews (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    -- Nullable: null means a store-level review (Wexit), set means a
    -- dish-level review with a rating summary (ICAPS).
    menu_id uuid references public.menus(id) on delete set null,
    table_id text,
    rating numeric(2, 1) not null check (rating >= 0.5 and rating <= 5),
    review_text text not null,
    image_data text,
    reply text default '',
    customer_session_id uuid not null,
    created_at timestamptz not null default now()
);
create index if not exists reviews_store_id_idx on public.reviews(store_id);
create index if not exists reviews_menu_id_idx on public.reviews(menu_id);

-- "Call staff" requests (ICAPS feature, ported from table_requests).
create table if not exists public.table_requests (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    table_id text not null,
    reason text default '',
    resolved boolean not null default false,
    customer_session_id uuid,
    created_at timestamptz not null default now()
);
create index if not exists table_requests_store_id_idx on public.table_requests(store_id);

-- Whole-layout replace used by the admin seat-layout drag editor: deletes
-- rows missing from the new payload, upserts the rest on (store_id, table_code).
create or replace function public.replace_store_tables(p_store_id uuid, p_tables jsonb)
returns setof public.tables
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.tables t
    where t.store_id = p_store_id
      and t.table_code not in (
        select (elem->>'table_code') from jsonb_array_elements(p_tables) elem
      );

    return query
    insert into public.tables (
        store_id, table_code, x, y, status, view_name, tag, capacity,
        table_image, view_image, sort_order, updated_at
    )
    select
        p_store_id,
        elem->>'table_code',
        (elem->>'x')::numeric,
        (elem->>'y')::numeric,
        elem->>'status',
        elem->>'view_name',
        elem->>'tag',
        coalesce((elem->>'capacity')::integer, 4),
        elem->>'table_image',
        elem->>'view_image',
        coalesce((elem->>'sort_order')::integer, 0),
        now()
    from jsonb_array_elements(p_tables) elem
    on conflict (store_id, table_code) do update set
        x = excluded.x,
        y = excluded.y,
        status = excluded.status,
        view_name = excluded.view_name,
        tag = excluded.tag,
        capacity = excluded.capacity,
        table_image = excluded.table_image,
        view_image = excluded.view_image,
        sort_order = excluded.sort_order,
        updated_at = now()
    returning *;
end;
$$;

-- Accepting a reservation marks its table 'reserved'; cancelling frees the
-- table back to 'available' only if no other active reservation remains
-- for that table_code.
create or replace function public.update_reservation_and_table(
    p_store_id uuid, p_reservation_id uuid, p_status text
)
returns setof public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
    v_table_id text;
begin
    if p_status not in ('accepted', 'cancelled') then
        raise exception 'invalid reservation status: %', p_status;
    end if;

    select table_id into v_table_id
    from public.reservations
    where id = p_reservation_id and store_id = p_store_id
    for update;

    if v_table_id is null then
        return;
    end if;

    update public.reservations
    set status = p_status, updated_at = now()
    where id = p_reservation_id and store_id = p_store_id;

    if p_status = 'accepted' then
        update public.tables
        set status = 'reserved', updated_at = now()
        where store_id = p_store_id and table_code = v_table_id;
    else
        if not exists (
            select 1 from public.reservations
            where store_id = p_store_id
              and table_id = v_table_id
              and status in ('reserved', 'waiting', 'accepted')
        ) then
            update public.tables
            set status = 'available', updated_at = now()
            where store_id = p_store_id and table_code = v_table_id;
        end if;
    end if;

    return query
    select * from public.reservations
    where id = p_reservation_id and store_id = p_store_id;
end;
$$;

-- All writes go through the FastAPI service-role key; the browser never
-- talks to Supabase directly for business data anymore, so lock every
-- table down. No policies are defined below: RLS enabled with zero
-- policies denies all access to anon/authenticated roles. Only the
-- service_role key (used server-side by FastAPI) bypasses RLS entirely.
-- Supabase Auth (staff login) is independent of this and keeps working.
alter table public.stores enable row level security;
alter table public.staff enable row level security;
alter table public.menus enable row level security;
alter table public.tables enable row level security;
alter table public.orders enable row level security;
alter table public.reservations enable row level security;
alter table public.reviews enable row level security;
alter table public.table_requests enable row level security;

-- ---------------------------------------------------------------------
-- Migration for an already-provisioned database (this `create table`
-- above only takes effect on a fresh install). Run this block once in
-- the Supabase SQL editor to add remote pickup + VNPay pre-payment
-- support to an existing orders table.
-- ---------------------------------------------------------------------
alter table public.orders
    alter column table_id drop not null,
    add column if not exists fulfillment_type text not null default 'dine_in'
        check (fulfillment_type in ('dine_in', 'pickup')),
    add column if not exists pickup_code text,
    add column if not exists payment_method text,
    add column if not exists payment_ref text,
    add column if not exists paid_at timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
    check (status in ('awaiting_payment', 'new', 'preparing', 'served', 'cancelled'));

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
    check (payment_method in ('vnpay', 'bank_transfer'));

alter table public.stores
    add column if not exists bank_bin text,
    add column if not exists bank_account_number text,
    add column if not exists bank_account_holder text;
