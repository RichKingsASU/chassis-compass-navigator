-- ============================================================================
-- Migration: Standardize activity tables for SCSPA, TRAC, and FLEXIVAN
-- Description: Creates structured activity tables to match DCLI/CCM patterns,
--   enabling the high-fidelity Dashboard and Activity views.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. SCSPA Activity
-- ---------------------------------------------------------------------------
create table if not exists public.scspa_activity (
  id               bigserial primary key,
  invoice          text,
  invoice_category text,
  invoice_date     timestamptz,
  due_date         timestamptz,
  invoice_amount   numeric(14,2) default 0,
  amount_paid      numeric(14,2) default 0,
  amount_due       numeric(14,2) default 0,
  invoice_status   text default 'Pending',
  created_at       timestamptz not null default now()
);

create index if not exists ix_scspa_activity_invoice_date on public.scspa_activity (invoice_date desc);
create index if not exists ix_scspa_activity_invoice on public.scspa_activity (invoice);

-- ---------------------------------------------------------------------------
-- 2. TRAC Activity
-- ---------------------------------------------------------------------------
create table if not exists public.trac_activity (
  id               bigserial primary key,
  invoice          text,
  invoice_category text,
  invoice_date     timestamptz,
  due_date         timestamptz,
  invoice_amount   numeric(14,2) default 0,
  amount_paid      numeric(14,2) default 0,
  amount_due       numeric(14,2) default 0,
  invoice_status   text default 'Pending',
  created_at       timestamptz not null default now()
);

create index if not exists ix_trac_activity_invoice_date on public.trac_activity (invoice_date desc);
create index if not exists ix_trac_activity_invoice on public.trac_activity (invoice);

-- ---------------------------------------------------------------------------
-- 3. FLEXIVAN Activity
-- ---------------------------------------------------------------------------
create table if not exists public.flexivan_activity (
  id               bigserial primary key,
  invoice          text,
  invoice_category text,
  invoice_date     timestamptz,
  due_date         timestamptz,
  invoice_amount   numeric(14,2) default 0,
  amount_paid      numeric(14,2) default 0,
  amount_due       numeric(14,2) default 0,
  invoice_status   text default 'Pending',
  created_at       timestamptz not null default now()
);

create index if not exists ix_flexivan_activity_invoice_date on public.flexivan_activity (invoice_date desc);
create index if not exists ix_flexivan_activity_invoice on public.flexivan_activity (invoice);

-- ---------------------------------------------------------------------------
-- 4. RLS & Permissions
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array['scspa_activity', 'trac_activity', 'flexivan_activity'] loop
    execute format('alter table public.%I enable row level security', tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_read',  tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_write', tbl);

    execute format(
      'create policy %I on public.%I for select using (true)',
      tbl || '_read', tbl
    );
    execute format(
      'create policy %I on public.%I for all using (true) with check (true)',
      tbl || '_write', tbl
    );
    
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', tbl);
    execute format('grant usage, select on sequence public.%I_id_seq to anon, authenticated', tbl);
  end loop;
end $$;

commit;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
