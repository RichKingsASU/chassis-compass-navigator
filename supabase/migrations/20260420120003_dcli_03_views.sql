-- DCLI Invoice Workflow — Views
-- MVP audit + display views. Read-only; no triggers, no materialized views.

begin;

-- ============================================================================
-- v_dcli_line_display — line items with combined status label + joined names
-- This is what the CCN "DCLI" tab renders. Mirrors sheet column order.
-- ============================================================================
create or replace view v_dcli_line_display as
select
  l.id,
  case
    when l.dispute_status = 'NONE' then ps.label
    else ps.label || ' / ' || ds.label
  end                             as status_display,
  l.payment_status,
  l.dispute_status,
  l.status_date,
  l.invoice_number                as invoice,
  l.line_num                      as line_number,
  l.date_entered,
  l.invoice_date,
  l.due_date,
  l.pool,
  l.chassis,
  l.container,
  l.date_out,
  l.date_in,
  l.bill_days,
  l.use_days,
  l.og_location,
  l.ig_location,
  l.ig_container,
  l.bill_from_date,
  l.bill_to_date,
  l.rate,
  l.gate_fees,
  l.tax,
  l.total,
  l.daily_rate,
  l.days_billed,
  l.billed_customer_amt,
  l.dispute_approved_amt,
  l.total_paid_to_ep_amt,
  l.credit_provided_by_ep_amt,
  l.billed_to_carrier_amt,
  l.vendor_credit_invoice_num,
  l.acct_mgr_paid_carrier_amt,
  l.margin,
  l.day_variance,
  cac.name                        as charge_absorption_category,
  casc.name                       as charge_absorption_sub_category,
  l.date_expense_added_to_mg,
  l.dispute_date,
  l.dispute_amount,
  l.dispute_num,
  l.dispute_reason,
  l.ld_num,
  l.so_num,
  l.og_ssl_scac,
  l.og_carrier_scac,
  l.ig_carrier_scac,
  cust.name::text                 as customer,
  am.name::text                   as account_manager,
  l.notes,
  l.bc_exported_at,
  l.bc_export_batch_id,
  l.source_file,
  l.imported_at
from dcli_invoice_line l
left join dcli_payment_status              ps   on ps.code = l.payment_status
left join dcli_dispute_status              ds   on ds.code = l.dispute_status
left join dcli_charge_absorption_category  cac  on cac.id  = l.charge_absorption_category_id
left join dcli_charge_absorption_sub_category casc on casc.id = l.charge_absorption_sub_category_id
left join dcli_customer                    cust on cust.id = l.customer_id
left join dcli_account_manager             am   on am.id   = l.account_manager_id;

-- ============================================================================
-- v_dcli_soa_reconciliation — invoice header vs. sum of line items
-- Surfaces data entry errors and missing lines. First audit layer.
-- ============================================================================
create or replace view v_dcli_soa_reconciliation as
with line_rollup as (
  select
    invoice_number,
    count(*)                                           as line_count,
    sum(total)                                         as sum_line_total,
    sum(total) filter (where payment_status = 'PAID')  as sum_line_paid,
    sum(dispute_approved_amt)                          as sum_line_dispute_approved,
    sum(dispute_amount) filter (where dispute_status = 'DISPUTE_PENDING')
                                                       as sum_line_dispute_pending
  from dcli_invoice_line
  group by invoice_number
)
select
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.invoice_amount                                     as soa_invoice_amount,
  i.balance                                            as soa_balance,
  i.dispute_pending_amt                                as soa_dispute_pending,
  i.dispute_approved_amt                               as soa_dispute_approved,
  coalesce(r.line_count, 0)                            as line_count,
  r.sum_line_total                                     as lines_total,
  round(coalesce(i.invoice_amount, 0) - coalesce(r.sum_line_total, 0), 2) as amount_variance,
  round(coalesce(i.dispute_pending_amt, 0) - coalesce(r.sum_line_dispute_pending, 0), 2) as dispute_pending_variance,
  round(coalesce(i.dispute_approved_amt, 0) - coalesce(r.sum_line_dispute_approved, 0), 2) as dispute_approved_variance,
  case
    when r.line_count is null or r.line_count = 0     then 'NO_LINES'
    when abs(coalesce(i.invoice_amount,0) - coalesce(r.sum_line_total,0)) < 0.01 then 'MATCH'
    else 'VARIANCE'
  end                                                  as reconciliation_status
from dcli_invoice i
left join line_rollup r on r.invoice_number = i.invoice_number;

-- ============================================================================
-- v_dcli_gl_export_pending — preview of paid lines not yet exported to BC
-- Mirrors the "Data for GL Template" sheet format exactly.
-- The UI "Data for GL Template" tab reads this view.
-- ============================================================================
create or replace view v_dcli_gl_export_pending as
select
  l.id                                          as invoice_line_id,
  l.invoice_number                              as "Invoice #",
  l.date_in                                     as "Date In",
  l.chassis                                     as "Chassis",
  l.so_num                                      as "SO",
  l.total                                       as "Total",
  'DCLI'::text                                  as "IEP Name",
  100                                           as "Company",
  'G/L Account'::text                           as "Type",
  511030                                        as "No.",
  'DCLI | ' ||
    to_char(l.date_in, 'MM/DD/YYYY') || ' | ' ||
    coalesce(l.chassis, '') || ' | ' ||
    coalesce(l.so_num, '')                      as "Description/Comment",
  1                                             as "Quantity",
  l.total                                       as "Direct Unit Cost Excl. Tax",
  'CA'::text                                    as "State",
  1000                                          as "Ops Center",
  '010'::text                                   as "Division",
  '20'::text                                    as "Department"
from dcli_invoice_line l
where l.payment_status = 'PAID'
  and l.bc_exported_at is null
  and l.total is not null
order by l.date_in nulls last, l.invoice_number, l.line_num;

commit;
