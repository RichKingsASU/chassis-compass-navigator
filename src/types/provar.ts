export type ProvarPortal = 'emodal' | 'yti' | 'wbct' | 'lbct' | 'fms' | 'apmt'

export const PROVAR_PORTALS: ProvarPortal[] = [
  'emodal',
  'yti',
  'wbct',
  'lbct',
  'fms',
  'apmt',
]

export const PORTAL_LABELS: Record<ProvarPortal, string> = {
  emodal: 'eModal',
  yti: 'YTI',
  wbct: 'WBCT',
  lbct: 'LBCT',
  fms: 'FMS',
  apmt: 'APMT',
}

export interface ProvarContainerRow {
  id: string
  portal: ProvarPortal
  container_number: string | null
  trade_type: string | null
  status: string | null
  line: string | null
  vessel_name: string | null
  last_free_day: string | null
  return_date: string | null
  raw_data: Record<string, unknown>
  snapshot_date: string
  ingested_at: string
}

export interface ProvarSyncLogRow {
  id: string
  portal: string
  endpoint: string
  status: 'success' | 'error'
  rows_affected: number
  error_message: string | null
  ran_at: string
}

export interface ProvarPortalSummary {
  portal: ProvarPortal
  containers_count: number
  last_pulled: string | null
  last_status: 'success' | 'error' | 'never'
}

export interface PullResult {
  portal: string
  endpoint: string
  rows: number
  status: 'success' | 'error'
  error?: string
}

export interface PullSummary {
  results: PullResult[]
  total_rows: number
  errors: string[]
}

export interface ProvarPullRun {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  portal: string
  date_range: string | null
  triggered_by: string | null
  started_at: string | null
  completed_at: string | null
  total_containers: number
  processed_containers: number
  downloaded_pdfs: number
  downloaded_screenshots: number
  error_count: number
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProvarDocument {
  id: string
  pull_run_id: string
  portal: string
  container_id: string
  document_type: 'pdf' | 'screenshot' | 'other'
  file_path: string
  file_name: string
  mime_type: string | null
  source_url: string | null
  status: string
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}
