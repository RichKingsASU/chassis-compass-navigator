// Generated types for public schema (project: fucvkmsaappphsvuabos)
// Mappings: uuid/text->string, date/timestamptz->string, numeric->string, jsonb->unknown, bigint/int->number

export interface Ingest_files {
  bucket_id: string;
  object_name: string;
  etag?: string | null;
  processed_at?: string | null;
}

export interface Staging_file_rows {
  id: number;
  bucket_id: string;
  object_name: string;
  row_number: number;
  data: unknown;
  imported_at?: string | null;
}

export interface Logistics_shipments {
  id: number;
  ld_num?: string | null;
  so_num?: string | null;
  created_date?: string | null;
  carrier_rate_charge?: string | null;
  item_description?: string | null;
}

/* ... other tables omitted for brevity; generate full file in your project ... */

export interface Vendors {
  id: string;
  name: string;
  scac?: string | null;
  created_at?: string | null;
}

export interface Invoices {
  id: string;
  vendor_id?: string | null;
  invoice_number: string;
  invoice_date?: string | null;
  due_date?: string | null;
  currency?: string | null;
  amount_due?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  source_path?: string | null;
  source_mime?: string | null;
  line_count?: number | null;
  status?: string | null;
  error_text?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface Invoice_lines {
  id: number;
  invoice_id?: string | null;
  line_number?: string | null;
  pool?: string | null;
  chassis_id?: string | null;
  container_id?: string | null;
  bill_start?: string | null;
  bill_end?: string | null;
  use_days?: number | null;
  rate?: string | null;
  total?: string | null;
  og_location?: string | null;
  ig_location?: string | null;
  billed_customer?: string | null;
  trucker_scac?: string | null;
  raw?: unknown | null;
}

export interface Invoice_line_matches {
  id: number;
  line_id?: number | null;
  match_status?: string | null;
  so_num?: string | null;
  ld_num?: string | null;
  customer_name?: string | null;
  acct_mg_name?: string | null;
  matched_on?: string | null;
  created_at?: string | null;
}

export interface Dcli_invoice_raw {
  id: number;
  invoice_id?: string | null;
  line_index?: number | null;
  invoice_number?: string | null;
  customer_name?: string | null;
  corporate_name?: string | null;
  chassis?: string | null;
  on_hire_container?: string | null;
  off_hire_container?: string | null;
  on_hire_date?: string | null;
  off_hire_date?: string | null;
  bill_start_date?: string | null;
  bill_end_date?: string | null;
  charge_description?: string | null;
  on_hire_status?: string | null;
  off_hire_status?: string | null;
  on_hire_area?: string | null;
  on_hire_location?: string | null;
  off_hire_location?: string | null;
  tier_1_days?: number | null;
  tier_1_free_days?: number | null;
  tier_1_rate?: string | null;
  tier_1_subtotal?: string | null;
  tier_2_days?: number | null;
  tier_2_free_days?: number | null;
  tier_2_rate?: string | null;
  tier_2_subtotal?: string | null;
  tier_3_days?: number | null;
  tier_3_free_days?: number | null;
  tier_3_rate?: string | null;
  tier_3_subtotal?: string | null;
  out_gate_fees?: string | null;
  in_gate_fees?: string | null;
  total_fees?: string | null;
  subtotal?: string | null;
  tax_rate_percent?: string | null;
  tax_amount?: string | null;
  grand_total?: string | null;
  on_hire_booking_no?: string | null;
  off_hire_booking_no?: string | null;
  on_hire_bol?: string | null;
  off_hire_bol?:.string | null;
  ocean_carrier_scac?: string | null;
  on_hire_mc_scac?: string | null;
  off_hire_mc_scac?: string | null;
  haulage_type?: string | null;
  on_hire_partner_code?: string | null;
  off_hire_partner_code?: string | null;
  summary_invoice_number?: string | null;
  corporate_account?: string | null;
  customer_number?: string | null;
  billing_date?: string | null;
  due_date?: string | null;
  billing_terms?: string | null;
  pool_contract?: string | null;
  raw?: unknown | null;
  created_at?: string | null;
}

/* --- Important: ccm_invoice and ccm_invoice_data --- */

export interface Ccm_invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  provider?: string | null; // default 'CCM'
  total_amount_usd?: string | null;
  status?: string | null;
  reason_for_dispute?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  tags?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Ccm_invoice_data {
  id?: number | null;
  invoice_id?: string | null;
  sheet_name?: string | null;
  row_data?: unknown | null;
  validated?: boolean | null;
  created_at?: string | null;
}

/* End of generated types. 
   Note: I used nullable fields as optional with `| null`. 
   If you'd like numeric -> number, or timestamptz -> Date, or strict non-null properties, tell me and I will regenerate. */