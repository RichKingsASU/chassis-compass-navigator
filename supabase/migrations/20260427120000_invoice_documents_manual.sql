-- ============================================================================
-- Migration: invoice_documents (vendor-neutral) + DCLI line-item match storage
--
-- ⚠️  MANUAL EXECUTION REQUIRED ⚠️
-- This file must be run by hand in the Supabase SQL editor at
--   http://127.0.0.1:54321
-- (or in the cloud Supabase project SQL editor for production).
--
-- It is NOT picked up by `supabase db reset` automatically because the
-- environment Claude Code runs in cannot apply DDL against the live DB.
--
-- It powers:
--   - "Upload Document" buttons on the DCLI invoice detail page and the new
--     /vendors/dcli/invoices/:invoiceId/lines/:lineId page
--   - "Validate Invoice" button (writes validation_status on dcli_invoice_internal)
--   - "Sync TMS Data" button (writes tms_match jsonb on dcli_internal_line_item)
--
-- Uploads reuse the existing `dcli-invoices` storage bucket. Files are stored
-- under `${invoiceId}/${filename}` (and `${invoiceId}/lines/${lineItemId}/...`
-- for line-scoped uploads) so each invoice gets its own folder.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- invoice_documents — vendor-neutral document table
-- ---------------------------------------------------------------------------
create table if not exists public.invoice_documents (
  id            bigserial primary key,
  invoice_id    text        not null,
  vendor        text        not null default 'dcli',
  line_item_id  text,
  file_name     text        not null,
  storage_path  text        not null,
  file_type     text,
  uploaded_at   timestamptz default now(),
  uploaded_by   text
);

create index if not exists idx_invoice_documents_invoice_id
  on public.invoice_documents(invoice_id);

create index if not exists idx_invoice_documents_line_item_id
  on public.invoice_documents(line_item_id)
  where line_item_id is not null;

-- ---------------------------------------------------------------------------
-- dcli_invoice_internal — validation_status used by "Validate Invoice"
-- ---------------------------------------------------------------------------
alter table if exists public.dcli_invoice_internal
  add column if not exists validation_status text;

-- ---------------------------------------------------------------------------
-- dcli_internal_line_item — tms_match jsonb used by "Sync TMS Data"
-- ---------------------------------------------------------------------------
alter table if exists public.dcli_internal_line_item
  add column if not exists tms_match jsonb;

commit;

-- Force PostgREST to reload its schema cache so the UI sees the new columns.
notify pgrst, 'reload schema';
