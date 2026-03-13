-- ============================================================================
-- Migration: Create demo chassis utilization tables
-- Description: 5 tables for chassis utilization demo with RLS public read
-- ============================================================================

-- ─────────────────────────────────────────
-- TABLE: chassis
-- ─────────────────────────────────────────
create table if not exists chassis (
  id                   serial primary key,
  chassis_number       text unique not null,
  chassis_type         text,
  chassis_desc         text,
  year                 integer,
  color                text,
  total_loads          integer,
  total_revenue        numeric(12,2),
  total_carrier_cost   numeric(12,2),
  total_margin         numeric(12,2),
  total_miles          numeric(10,1),
  avg_miles_per_load   numeric(8,1),
  avg_revenue_per_load numeric(10,2),
  avg_utilization      numeric(5,1),
  best_month           text,
  best_month_util      numeric(5,1),
  worst_month          text,
  worst_month_util     numeric(5,1),
  first_activity       date,
  last_activity        date,
  months_active        integer,
  total_mr_cost        numeric(10,2),
  total_mr_days        integer,
  created_at           timestamptz default now()
);

-- ─────────────────────────────────────────
-- TABLE: loads
-- ─────────────────────────────────────────
create table if not exists loads (
  id              serial primary key,
  chassis_number  text references chassis(chassis_number) on delete cascade,
  ld_num          text unique not null,
  container       text,
  container_type  text,
  customer        text,
  carrier         text,
  pickup_loc      text,
  pickup_city     text,
  pickup_state    text,
  delivery_loc    text,
  delivery_city   text,
  delivery_state  text,
  pickup_date     date,
  delivery_date   date,
  revenue         numeric(10,2),
  carrier_cost    numeric(10,2),
  miles           numeric(8,1),
  status          text,
  service         text,
  days_on_load    integer,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- TABLE: monthly_stats
-- ─────────────────────────────────────────
create table if not exists monthly_stats (
  id              serial primary key,
  chassis_number  text references chassis(chassis_number) on delete cascade,
  month           text not null,
  loads           integer,
  active_days     integer,
  revenue         numeric(10,2),
  carrier_cost    numeric(10,2),
  miles           numeric(8,1),
  utilization_pct numeric(5,1),
  margin          numeric(10,2),
  margin_pct      numeric(5,1),
  created_at      timestamptz default now(),
  unique(chassis_number, month)
);

-- ─────────────────────────────────────────
-- TABLE: mr_events (maintenance & repair)
-- ─────────────────────────────────────────
create table if not exists mr_events (
  id              serial primary key,
  chassis_number  text references chassis(chassis_number) on delete cascade,
  event_date      date,
  end_date        date,
  event_type      text,
  description     text,
  cost            numeric(10,2),
  vendor          text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- TABLE: idle_gaps
-- ─────────────────────────────────────────
create table if not exists idle_gaps (
  id              serial primary key,
  chassis_number  text references chassis(chassis_number) on delete cascade,
  gap_start       date,
  gap_end         date,
  days            integer,
  gap_type        text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- RLS: enable public read for demo
-- ─────────────────────────────────────────
alter table chassis       enable row level security;
alter table loads         enable row level security;
alter table monthly_stats enable row level security;
alter table mr_events     enable row level security;
alter table idle_gaps     enable row level security;

create policy "public read chassis"       on chassis       for select using (true);
create policy "public read loads"         on loads         for select using (true);
create policy "public read monthly_stats" on monthly_stats for select using (true);
create policy "public read mr_events"     on mr_events     for select using (true);
create policy "public read idle_gaps"     on idle_gaps     for select using (true);
