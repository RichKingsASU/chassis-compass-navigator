export interface DcliInvoiceInternal {
  id: string
  invoice_number: string | null
  invoice_date: string | null
  billing_date: string | null
  due_date: string | null
  invoice_amount: number | null
  invoice_balance: number | null
  total_payments: number | null
  dispute_pending: number | null
  dispute_approved: number | null
  portal_status: string | null
  dispute_status: string | null
  invoice_type: string | null
}

export interface DcliInternalLineItem {
  id: string
  invoice: string | null
  du_number: string | null
  chassis: string | null
  date_out: string | null
  date_in: string | null
  bill_days: number | null
  rate: number | null
  total: number | null
  pool_contract: string | null
  pick_up_location: string | null
  return_location: string | null
  ocean_carrier_scac: string | null
  haulage_type: string | null
  charge_description: string | null
  container_in: string | null
  tax_amount: number | null
  total_fees: number | null
  so_num?: string | null
  bc_exported?: boolean | null
  bc_exported_at?: string | null
  bc_export_batch_id?: number | null
  [key: string]: unknown
}

export interface DcliInvoiceDocument {
  id: string
  invoice_id: string | null
  invoice_number: string | null
  storage_path: string
  original_name: string | null
  file_type: string | null
  file_size_bytes: number | null
  document_role: string | null
  uploaded_by_email: string | null
  created_at: string
  deleted_at: string | null
}

export interface DcliDocumentWithUrl extends DcliInvoiceDocument {
  signed_url: string | null
}

export interface DcliActivityRow {
  id: string
  chassis: string | null
  reservation: string | null
  date_out: string | null
  date_in: string | null
  days_out: number | null
  pick_up_location: string | null
  location_in: string | null
  pool_contract: string | null
  container: string | null
  ss_scac: string | null
  haulage_type: string | null
  reservation_status: string | null
  request_status: string | null
  motor_carrier_name: string | null
  market: string | null
  region: string | null
  asset_type: string | null
  remarks: string | null
  [key: string]: unknown
}
