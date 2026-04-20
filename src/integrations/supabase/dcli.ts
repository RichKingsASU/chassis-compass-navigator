import { supabase } from "@/lib/supabase";

// ----------------------------------------------------------------------------
// Types — these mirror the view shapes exactly.
// Regenerate src/integrations/supabase/types.ts via `supabase gen types` later.
// ----------------------------------------------------------------------------
export type DcliInvoiceSOA = {
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  invoice_amount: number | null;
  invoice_balance: number | null;
  total_payments: number | null;
  dispute_pending_amt: number | null;
  dispute_approved_amt: number | null;
  balance: number | null;
  credit_applied: number | null;
  vendor_rate_in_tms: string | null;
  notes: string | null;
};

export type DcliLineDisplay = {
  id: number;
  status_display: string;
  payment_status: string;
  dispute_status: string;
  status_date: string | null;
  invoice: string;
  line_number: number | null;
  date_entered: string | null;
  invoice_date: string | null;
  due_date: string | null;
  pool: string | null;
  chassis: string | null;
  container: string | null;
  date_out: string | null;
  date_in: string | null;
  bill_days: number | null;
  use_days: number | null;
  og_location: string | null;
  ig_location: string | null;
  ig_container: string | null;
  bill_from_date: string | null;
  bill_to_date: string | null;
  rate: number | null;
  gate_fees: number | null;
  tax: number | null;
  total: number | null;
  daily_rate: number | null;
  days_billed: number | null;
  billed_customer_amt: number | null;
  dispute_approved_amt: number | null;
  total_paid_to_ep_amt: number | null;
  credit_provided_by_ep_amt: number | null;
  billed_to_carrier_amt: number | null;
  vendor_credit_invoice_num: string | null;
  acct_mgr_paid_carrier_amt: number | null;
  margin: number | null;
  day_variance: number | null;
  charge_absorption_category: string | null;
  charge_absorption_sub_category: string | null;
  date_expense_added_to_mg: string | null;
  dispute_date: string | null;
  dispute_amount: number | null;
  dispute_num: string | null;
  dispute_reason: string | null;
  ld_num: string | null;
  so_num: string | null;
  og_ssl_scac: string | null;
  og_carrier_scac: string | null;
  ig_carrier_scac: string | null;
  customer: string | null;
  account_manager: string | null;
  notes: string | null;
  bc_exported_at: string | null;
};

export type DcliReconciliation = {
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  soa_invoice_amount: number | null;
  soa_balance: number | null;
  soa_dispute_pending: number | null;
  soa_dispute_approved: number | null;
  line_count: number;
  lines_total: number | null;
  amount_variance: number;
  dispute_pending_variance: number;
  dispute_approved_variance: number;
  reconciliation_status: "MATCH" | "VARIANCE" | "NO_LINES";
};

export type DcliGlExportRow = {
  invoice_line_id: number;
  "Invoice #": string;
  "Date In": string | null;
  Chassis: string | null;
  SO: string | null;
  Total: number | null;
  "IEP Name": string;
  Company: number;
  Type: string;
  "No.": number;
  "Description/Comment": string;
  Quantity: number;
  "Direct Unit Cost Excl. Tax": number | null;
  State: string;
  "Ops Center": number;
  Division: string;
  Department: string;
};

export type DcliConfigRow = { id?: number; code?: string; name?: string; label?: string; active: boolean };

// ----------------------------------------------------------------------------
// Queries — all read-only for the MVP.  Any write paths will come in phase 2.
// ----------------------------------------------------------------------------

export async function fetchSOAList() {
  const { data, error } = await supabase
    .from("dcli_invoice")
    .select("*")
    .order("invoice_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as DcliInvoiceSOA[];
}

export async function fetchLineItems(opts?: { invoice?: string; limit?: number }) {
  let q = supabase
    .from("v_dcli_line_display")
    .select("*")
    .order("invoice_date", { ascending: false, nullsFirst: false })
    .order("invoice", { ascending: false })
    .order("line_number", { ascending: true });
  if (opts?.invoice) q = q.eq("invoice", opts.invoice);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DcliLineDisplay[];
}

export async function fetchReconciliation() {
  const { data, error } = await supabase
    .from("v_dcli_soa_reconciliation")
    .select("*")
    .order("invoice_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as DcliReconciliation[];
}

export async function fetchGlExportPending() {
  const { data, error } = await supabase.from("v_dcli_gl_export_pending").select("*");
  if (error) throw error;
  return (data ?? []) as DcliGlExportRow[];
}

export async function fetchConfigTable(table: string) {
  const { data, error } = await supabase.from(table).select("*").order(
    // status tables use sort_order; others use name
    ["dcli_payment_status", "dcli_dispute_status"].includes(table) ? "sort_order" : "name",
    { ascending: true }
  );
  if (error) throw error;
  return (data ?? []) as DcliConfigRow[];
}
