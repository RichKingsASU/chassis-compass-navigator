-- ============================================================================
-- Migration: Fix CCM module schema so /vendors/ccm renders without 404s
--
-- Problem:
--   - /vendors/ccm Dashboard fires GET /rest/v1/ccm_invoice_data?... and
--     expects a flat invoice-shaped row. The actual ccm_invoice_data table
--     (created in 20240101000017_vendor_invoice_parity.sql) is the Excel
--     row-blob shape (row_data jsonb, invoice_id, sheet_name) used by the
--     SimpleInvoiceWizard at src/pages/ccm/NewInvoice.tsx and by the
--     run_full_chassis_validation RPC. The existing table is therefore
--     intentionally left untouched by this migration.
--   - /vendors/ccm Activity tab has no backing table (ccm_activity does not
--     exist locally, even though VendorValidation.tsx already references it).
--   - vendor_invoices is written to by src/components/vendor/NewInvoiceDialog
--     and read by VendorInvoicesTab + DCLI.tsx, but no migration ever
--     creates it locally.
--
-- Fix (strictly additive + idempotent):
--   1. vendor_invoices — CREATE TABLE IF NOT EXISTS matching the shape the
--      shared NewInvoiceDialog / VendorInvoicesTab already write & read.
--   2. ccm_activity — CREATE TABLE IF NOT EXISTS for invoice-level CCM
--      activity log. Same shape Richard's local DDL uses.
--   3. GRANT SELECT/INSERT/UPDATE/DELETE to anon/authenticated so PostgREST
--      exposes them (RLS policies follow the project-wide permissive
--      pattern used by migration 7 for the other invoice tables).
--   4. NOTIFY pgrst so the schema cache reloads without a container restart.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- vendor_invoices — shared invoice store across CCM/WCCP/SCSPA/TRAC/FLEXIVAN.
-- Shape matches src/components/vendor/NewInvoiceDialog.tsx insert payload and
-- src/components/vendor/VendorInvoicesTab.tsx VendorInvoice interface.
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_invoices (
  id               bigserial primary key,
  vendor_slug      text not null,
  invoice_number   text not null,
  invoice_date     date,
  due_date         date,
  invoice_amount   numeric(14,2) default 0,
  invoice_category text,
  invoice_status   text default 'Pending',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Deduplicate per-vendor on invoice_number so repeat submits fail loudly.
create unique index if not exists ux_vendor_invoices_slug_number
  on public.vendor_invoices (vendor_slug, invoice_number);

create index if not exists ix_vendor_invoices_slug_date
  on public.vendor_invoices (vendor_slug, invoice_date desc);

-- ---------------------------------------------------------------------------
-- ccm_activity — invoice-level activity log from CCM portal exports.
-- Consumers:
--   - src/pages/vendors/CCM.tsx Activity tab (added by this task)
--   - src/pages/VendorValidation.tsx (already references this table)
-- ---------------------------------------------------------------------------
create table if not exists public.ccm_activity (
  id               bigserial primary key,
  invoice          text,
  invoice_category text,
  invoice_date     timestamptz,
  due_date         timestamptz,
  invoice_amount   numeric,
  amount_paid      numeric,
  amount_due       numeric,
  invoice_status   text,
  created_at       timestamptz not null default now()
);

create index if not exists ix_ccm_activity_invoice_date
  on public.ccm_activity (invoice_date desc);
create index if not exists ix_ccm_activity_invoice
  on public.ccm_activity (invoice);

-- ---------------------------------------------------------------------------
-- RLS: permissive read/write (same pattern as migration 17 for the sibling
-- vendor invoice tables). Authenticated + anon roles both need SELECT.
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array['vendor_invoices', 'ccm_activity'] loop
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
  end loop;
end $$;

grant select, insert, update, delete on public.vendor_invoices to anon, authenticated;
grant select, insert, update, delete on public.ccm_activity    to anon, authenticated;
grant usage, select on sequence public.vendor_invoices_id_seq  to anon, authenticated;
grant usage, select on sequence public.ccm_activity_id_seq     to anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Force PostgREST to reload its schema cache so the new tables appear at
-- /rest/v1/vendor_invoices and /rest/v1/ccm_activity immediately.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
