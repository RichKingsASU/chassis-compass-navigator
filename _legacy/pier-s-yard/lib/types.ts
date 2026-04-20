export interface InventoryRow {
  equip_group_id: string | null
  eq_type: string | null
  equip_no: string
  size: number | null
  iso_code: string | null
  cust_code: string | null
  lic_no: string | null
  lic_state: string | null
  last_gate_in_date: string | null
  last_gate_in_time: number | null
  load_type: string | null
  last_carrier: string | null
  last_carrier_name: string | null
  booking_no: string | null
  days_onsite: number | null
  comment: string | null
  resource_name: string | null
  source_file?: string
}

export interface AuditIssue {
  row: number
  field: string
  value: string
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion?: string
}

export interface UploadResult {
  storagePath: string
  rowsUpserted: number
  issues: AuditIssue[]
  uploadLogId: number
}
