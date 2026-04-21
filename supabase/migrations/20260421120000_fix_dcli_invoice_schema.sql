-- ============================================================================
-- Migration: Fix DCLI invoice schema so NewInvoice.tsx submit works locally
--
-- Context: src/pages/dcli/NewInvoice.tsx (and related DCLI detail pages) write
-- to dcli_invoice / dcli_invoice_line_item / dcli_invoice_documents /
-- dcli_invoice_events with columns that do not exist on the local Supabase
-- schema (the earlier 20260420120002_dcli_02_invoice.sql migration reflects
-- the cloud SOA-import shape, not the portal-upload shape). The submit step
-- fails with:
--   Could not find the 'account_code' column of 'dcli_invoice' in the schema
--   cache
--
-- This migration is strictly additive and idempotent:
--   - CREATE TABLE IF NOT EXISTS for any sibling tables the UI needs
--   - ALTER TABLE ... ADD COLUMN IF NOT EXISTS for every column the code writes
--   - No columns are dropped or renamed
--   - No RLS changes (auth is already configured for CCN local)
--   - NOTIFY pgrst at the end to reload PostgREST schema cache
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- dcli_invoice — fallback create + add missing columns
-- ---------------------------------------------------------------------------

-- Fresh-DB safety net. On an existing DB this is a no-op because
-- 20260420120002_dcli_02_invoice.sql already created dcli_invoice with
-- invoice_number as the primary key.
create table if not exists public.dcli_invoice (
  id uuid primary key default gen_random_uuid()
);

-- UI queries .eq('id', invoiceId) and .select('id').single() — guarantee an id.
alter table public.dcli_invoice add column if not exists id uuid not null default gen_random_uuid();
create unique index if not exists ux_dcli_invoice_id on public.dcli_invoice (id);

-- Columns written by NewInvoice.tsx
alter table public.dcli_invoice add column if not exists invoice_id       text;
alter table public.dcli_invoice add column if not exists invoice_number   text;
alter table public.dcli_invoice add column if not exists invoice_date     date;
alter table public.dcli_invoice add column if not exists due_date         date;
alter table public.dcli_invoice add column if not exists billing_date     date;
alter table public.dcli_invoice add column if not exists account_code     text;
alter table public.dcli_invoice add column if not exists total_amount     numeric(14,2);
alter table public.dcli_invoice add column if not exists portal_status    text;
alter table public.dcli_invoice add column if not exists internal_notes   text;
alter table public.dcli_invoice add column if not exists vendor           text;
alter table public.dcli_invoice add column if not exists file_name        text;
alter table public.dcli_invoice add column if not exists file_type        text;
alter table public.dcli_invoice add column if not exists file_path        text;
alter table public.dcli_invoice add column if not exists status           text;

-- Columns used by DCLI detail pages (types/invoice.ts::DcliInvoice)
alter table public.dcli_invoice add column if not exists reviewed_by      text;
alter table public.dcli_invoice add column if not exists reviewed_at      timestamptz;
alter table public.dcli_invoice add column if not exists created_at       timestamptz not null default now();
alter table public.dcli_invoice add column if not exists updated_at       timestamptz not null default now();

-- Duplicate-check query in NewInvoice.tsx: .eq('invoice_number', ...)
create unique index if not exists ux_dcli_invoice_invoice_number
  on public.dcli_invoice (invoice_number)
  where invoice_number is not null;

-- ---------------------------------------------------------------------------
-- dcli_invoice_line_item
-- ---------------------------------------------------------------------------
create table if not exists public.dcli_invoice_line_item (
  id uuid primary key default gen_random_uuid(),
  invoice_id text,
  created_at timestamptz not null default now()
);

alter table public.dcli_invoice_line_item add column if not exists line_invoice_number text;
alter table public.dcli_invoice_line_item add column if not exists chassis             text;
alter table public.dcli_invoice_line_item add column if not exists container           text;
alter table public.dcli_invoice_line_item add column if not exists date_out            text;
alter table public.dcli_invoice_line_item add column if not exists date_in             text;
alter table public.dcli_invoice_line_item add column if not exists days_used           numeric;
alter table public.dcli_invoice_line_item add column if not exists daily_rate          numeric;
alter table public.dcli_invoice_line_item add column if not exists line_total          numeric;
alter table public.dcli_invoice_line_item add column if not exists row_data            jsonb;

-- Columns used by InvoiceDetail / InvoiceLineDetails / InvoiceLineDispute
alter table public.dcli_invoice_line_item add column if not exists portal_status     text;
alter table public.dcli_invoice_line_item add column if not exists internal_notes    text;
alter table public.dcli_invoice_line_item add column if not exists dispute_reason    text;
alter table public.dcli_invoice_line_item add column if not exists dispute_notes     text;
alter table public.dcli_invoice_line_item add column if not exists match_type        text;
alter table public.dcli_invoice_line_item add column if not exists match_confidence  numeric;
alter table public.dcli_invoice_line_item add column if not exists tms_match         jsonb;
alter table public.dcli_invoice_line_item add column if not exists updated_at        timestamptz not null default now();

create index if not exists ix_dcli_invoice_line_item_invoice_id
  on public.dcli_invoice_line_item (invoice_id);

-- ---------------------------------------------------------------------------
-- dcli_invoice_documents
-- ---------------------------------------------------------------------------
create table if not exists public.dcli_invoice_documents (
  id uuid primary key default gen_random_uuid(),
  invoice_id text,
  created_at timestamptz not null default now()
);

alter table public.dcli_invoice_documents add column if not exists line_item_id      text;
alter table public.dcli_invoice_documents add column if not exists storage_path      text;
alter table public.dcli_invoice_documents add column if not exists original_name     text;
alter table public.dcli_invoice_documents add column if not exists file_type         text;
alter table public.dcli_invoice_documents add column if not exists file_size_bytes   bigint;
alter table public.dcli_invoice_documents add column if not exists document_role     text;
alter table public.dcli_invoice_documents add column if not exists uploaded_by_email text;
alter table public.dcli_invoice_documents add column if not exists note              text;
alter table public.dcli_invoice_documents add column if not exists deleted_at        timestamptz;

create index if not exists ix_dcli_invoice_documents_invoice_id
  on public.dcli_invoice_documents (invoice_id);

-- ---------------------------------------------------------------------------
-- dcli_invoice_events
-- ---------------------------------------------------------------------------
create table if not exists public.dcli_invoice_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id text,
  created_at timestamptz not null default now()
);

alter table public.dcli_invoice_events add column if not exists line_item_id     text;
alter table public.dcli_invoice_events add column if not exists event_type       text;
alter table public.dcli_invoice_events add column if not exists from_status      text;
alter table public.dcli_invoice_events add column if not exists to_status        text;
alter table public.dcli_invoice_events add column if not exists note             text;
alter table public.dcli_invoice_events add column if not exists created_by_email text;
alter table public.dcli_invoice_events add column if not exists metadata         jsonb;

create index if not exists ix_dcli_invoice_events_invoice_id
  on public.dcli_invoice_events (invoice_id);
create index if not exists ix_dcli_invoice_events_line_item_id
  on public.dcli_invoice_events (line_item_id);

commit;

-- ---------------------------------------------------------------------------
-- Force PostgREST to reload its schema cache. This is the step that actually
-- clears "Could not find the 'account_code' column of 'dcli_invoice' in the
-- schema cache" at runtime.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
