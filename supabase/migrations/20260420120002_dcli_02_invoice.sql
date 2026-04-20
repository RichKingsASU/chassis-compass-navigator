-- DCLI Invoice Workflow — Data tables
-- Source mapping:
--   SOA sheet  → dcli_invoice + dcli_invoice_payment
--   DCLI sheet → dcli_invoice_line
--   BC export  → dcli_bc_export_batch + dcli_bc_export_batch_line (scaffold only)

begin;

-- ============================================================================
-- Invoice header (from SOA sheet)
-- ============================================================================
create table if not exists dcli_invoice (
  invoice_number       text primary key,
  invoice_date         date,
  due_date             date,
  invoice_amount       numeric(14,2),
  invoice_balance      numeric(14,2),
  total_payments       numeric(14,2),
  dispute_pending_amt  numeric(14,2),
  dispute_approved_amt numeric(14,2),
  balance              numeric(14,2),
  credit_applied       numeric(14,2),
  vendor_rate_in_tms   text,
  notes                text,
  source_file          text,
  imported_at          timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists ix_dcli_invoice_date on dcli_invoice (invoice_date);
create index if not exists ix_dcli_invoice_due_date on dcli_invoice (due_date);

-- ============================================================================
-- Invoice payments (normalized from Payment 1..5 columns on SOA)
-- ============================================================================
create table if not exists dcli_invoice_payment (
  id                   bigserial primary key,
  invoice_number       text not null references dcli_invoice(invoice_number) on delete cascade,
  payment_label        text not null,  -- "Payment 1", "Payment 2 - A", etc. Preserves source column.
  payment_sequence     int  not null,  -- 1..7 derived from label order
  amount               numeric(14,2) not null,
  source_file          text,
  imported_at          timestamptz not null default now(),
  unique (invoice_number, payment_label)
);

create index if not exists ix_dcli_invoice_payment_invoice on dcli_invoice_payment (invoice_number);

-- ============================================================================
-- Invoice line items (from DCLI sheet, 49 columns → cleaned snake_case)
-- Status decomposed into payment_status + dispute_status.
-- ============================================================================
create table if not exists dcli_invoice_line (
  id                              bigserial primary key,
  invoice_number                  text not null references dcli_invoice(invoice_number) on delete cascade,
  line_num                        int,

  -- status (decomposed from sheet's single "Status" column)
  payment_status                  text not null references dcli_payment_status(code),
  dispute_status                  text not null references dcli_dispute_status(code) default 'NONE',
  status_date                     date,

  -- dates
  date_entered                    date,
  invoice_date                    date,
  due_date                        date,

  -- chassis usage
  pool                            text,
  chassis                         text,
  container                       text,
  date_out                        timestamptz,
  date_in                         timestamptz,
  bill_days                       int,
  use_days                        int,
  og_location                     text,
  ig_location                     text,
  ig_container                    text,
  bill_from_date                  timestamptz,
  bill_to_date                    timestamptz,

  -- billing
  rate                            numeric(10,2),
  gate_fees                       numeric(10,2),
  tax                             numeric(10,2),
  total                           numeric(12,2),
  daily_rate                      numeric(10,2),
  days_billed                     numeric(6,2),
  billed_customer_amt             numeric(12,2),

  -- dispute + carrier tracking
  dispute_approved_amt            numeric(12,2),
  total_paid_to_ep_amt            numeric(12,2),
  credit_provided_by_ep_amt       numeric(12,2),
  billed_to_carrier_amt           numeric(12,2),
  vendor_credit_invoice_num       text,      -- NOT a $ amount, per sheet header
  acct_mgr_paid_carrier_amt       numeric(12,2),
  margin                          numeric(12,2),
  day_variance                    int,

  -- charge absorption (FK to config)
  charge_absorption_category_id   bigint references dcli_charge_absorption_category(id),
  charge_absorption_sub_category_id bigint references dcli_charge_absorption_sub_category(id),

  -- MG / dispute admin
  date_expense_added_to_mg        date,
  dispute_date                    date,
  dispute_amount                  numeric(12,2),
  dispute_num                     text,
  dispute_reason                  text,

  -- TMS linkage
  ld_num                          text,
  so_num                          text,
  og_ssl_scac                     text,
  og_carrier_scac                 text,
  ig_carrier_scac                 text,

  -- customer/AM (FK to config; nullable because 125/124 rows are null in source)
  customer_id                     bigint references dcli_customer(id),
  account_manager_id              bigint references dcli_account_manager(id),

  notes                           text,

  -- BC export tracking (link populated by export workflow; null = not yet exported)
  bc_exported_at                  timestamptz,
  bc_export_batch_id              bigint,

  -- ingestion metadata
  source_file                     text,
  source_row_num                  int,
  imported_at                     timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),

  unique (invoice_number, line_num)
);

create index if not exists ix_dcli_line_invoice       on dcli_invoice_line (invoice_number);
create index if not exists ix_dcli_line_chassis       on dcli_invoice_line (chassis);
create index if not exists ix_dcli_line_payment_stat  on dcli_invoice_line (payment_status);
create index if not exists ix_dcli_line_dispute_stat  on dcli_invoice_line (dispute_status);
create index if not exists ix_dcli_line_customer      on dcli_invoice_line (customer_id);
create index if not exists ix_dcli_line_ldnum         on dcli_invoice_line (ld_num);
create index if not exists ix_dcli_line_sonum         on dcli_invoice_line (so_num);
create index if not exists ix_dcli_line_bc_exported   on dcli_invoice_line (bc_exported_at) where bc_exported_at is null;

-- ============================================================================
-- BC export batches (scaffold — NOT used by MVP UI but created for future)
-- When user clicks "Export to BC" we insert a batch row and link the lines.
-- ============================================================================
create table if not exists dcli_bc_export_batch (
  id                  bigserial primary key,
  batch_name          text not null,
  generated_at        timestamptz not null default now(),
  generated_by        text,
  line_count          int not null default 0,
  total_amount        numeric(14,2) not null default 0,
  notes               text
);

create table if not exists dcli_bc_export_batch_line (
  id                  bigserial primary key,
  batch_id            bigint not null references dcli_bc_export_batch(id) on delete cascade,
  invoice_line_id     bigint not null references dcli_invoice_line(id),
  -- snapshot of values at export time (immutable audit record)
  invoice_number      text,
  date_in             timestamptz,
  chassis             text,
  so_num              text,
  total               numeric(12,2),
  description_comment text,
  unique (batch_id, invoice_line_id)
);

alter table dcli_invoice_line
  add constraint fk_dcli_line_bc_batch
  foreign key (bc_export_batch_id) references dcli_bc_export_batch(id);

commit;
