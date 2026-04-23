export const INVOICE_STATUSES = [
  'OK TO PAY','SCHEDULED','PAID','DISPUTE','NEED TO DISPUTE',
  'DISPUTE PENDING','DISPUTE APPROVED','DISPUTE REJECTED',
  'NEED TO EMAIL AM','EMAILED AM','NEED TO EMAIL CARRIER',
  'EMAILED CARRIER','NEED TO EMAIL TERMINAL','EMAILED TERMINAL',
] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export interface DcliInvoice {
  id: string; invoice_id: string; invoice_number: string | null
  invoice_date: string | null; due_date: string | null
  billing_date: string | null; account_code: string | null
  total_amount: number | null; status: string | null
  portal_status: InvoiceStatus | null; internal_notes: string | null
  vendor: string | null; file_name: string | null
  file_type: string | null; file_path: string | null
  reviewed_by: string | null; reviewed_at: string | null
  created_at: string; updated_at: string
}

export type ValidationStatus = 'pass' | 'fail' | 'warn' | 'skipped'

export interface ValidationFinding {
  code: string
  severity: 'info' | 'warn' | 'fail'
  message: string
  billed_days?: number
  tms_days?: number
  variance?: number
  lds?: string[]
  sos?: string[]
  ld_count?: number
  so_count?: number
}

export interface DcliLineItem {
  id: string; invoice_id: string; line_invoice_number: string | null
  chassis: string | null; container: string | null
  date_out: string | null; date_in: string | null
  days_used: number | null; daily_rate: number | null
  line_total: number | null; match_type: string | null
  match_confidence: number | null
  tms_match: Record<string, unknown> | null
  row_data: Record<string, unknown> | null
  portal_status: InvoiceStatus | null; internal_notes: string | null
  dispute_reason: string | null; dispute_notes: string | null
  day_variance: number | null
  validation_status: ValidationStatus | null
  validation_findings: ValidationFinding[] | null
  validated_at: string | null
  matched_at: string | null
  created_at: string; updated_at: string
}

export interface InvoiceEvent {
  id: string; invoice_id: string; line_item_id: string | null
  event_type: 'status_change' | 'line_status_change' | 'note_added'
    | 'document_uploaded' | 'document_deleted' | 'invoice_created'
  from_status: string | null; to_status: string | null
  note: string | null; metadata: Record<string, unknown>
  created_by_email: string | null; created_at: string
}

export interface InvoiceDocument {
  id: string; invoice_id: string; line_item_id: string | null
  storage_path: string; original_name: string; file_type: string
  file_size_bytes: number | null; document_role: string
  uploaded_by_email: string | null; note: string | null
  created_at: string; deleted_at: string | null
}

export function statusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-muted text-muted-foreground border border-border'
  const s = status.toUpperCase()
  if (s === 'OK TO PAY')             return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
  if (s === 'SCHEDULED')             return 'bg-blue-100 text-blue-800 border border-blue-300'
  if (s === 'PAID')                  return 'bg-green-100 text-green-800 border border-green-300'
  if (s === 'DISPUTE')               return 'bg-red-100 text-red-800 border border-red-300'
  if (s === 'NEED TO DISPUTE')       return 'bg-orange-100 text-orange-800 border border-orange-300'
  if (s === 'DISPUTE PENDING')       return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
  if (s === 'DISPUTE APPROVED')      return 'bg-purple-100 text-purple-800 border border-purple-300'
  if (s === 'DISPUTE REJECTED')      return 'bg-red-200 text-red-900 border border-red-400'
  if (s.startsWith('NEED TO EMAIL')) return 'bg-orange-100 text-orange-800 border border-orange-300'
  if (s.startsWith('EMAILED'))       return 'bg-sky-100 text-sky-800 border border-sky-300'
  return 'bg-muted text-muted-foreground border border-border'
}

export function eventLabel(e: InvoiceEvent): string {
  switch (e.event_type) {
    case 'status_change':      return `Invoice status \u2192 "${e.to_status}"${e.from_status ? ` (was "${e.from_status}")` : ''}`
    case 'line_status_change': return `Line item status \u2192 "${e.to_status}"${e.from_status ? ` (was "${e.from_status}")` : ''}`
    case 'note_added':         return 'Note added'
    case 'document_uploaded':  return `Document uploaded: ${(e.metadata as {filename?:string}).filename ?? ''}`
    case 'document_deleted':   return `Document removed: ${(e.metadata as {filename?:string}).filename ?? ''}`
    case 'invoice_created':    return 'Invoice created'
    default:                   return e.event_type
  }
}

export function eventIcon(type: InvoiceEvent['event_type']): string {
  switch (type) {
    case 'status_change':
    case 'line_status_change': return '\uD83D\uDD04'
    case 'note_added':         return '\uD83D\uDCDD'
    case 'document_uploaded':  return '\uD83D\uDCCE'
    case 'document_deleted':   return '\uD83D\uDDD1\uFE0F'
    case 'invoice_created':    return '\u2705'
    default:                   return '\u2022'
  }
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1048576).toFixed(1)} MB`
}
