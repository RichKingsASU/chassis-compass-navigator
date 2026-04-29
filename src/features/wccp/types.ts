export interface WccpActivityRow {
  id: string
  invoice: string | null
  invoice_category: string | null
  invoice_date: string | null
  due_date: string | null
  invoice_amount: number | null
  amount_paid: number | null
  amount_due: number | null
  invoice_status: string | null
  created_at: string
}

export interface WccpInvoiceInternal {
  id: string
  invoice_id: string
  sheet_name: string
  row_data: Record<string, unknown>
  validated: boolean
  created_at: string
}
