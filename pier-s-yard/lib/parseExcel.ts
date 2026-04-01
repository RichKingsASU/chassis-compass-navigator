import * as XLSX from 'xlsx'
import type { InventoryRow } from './types'

// Column mapping from TMS export names to our DB fields
const COLUMN_MAP: Record<string, keyof InventoryRow> = {
  EquipGroupID: 'equip_group_id',
  EqType: 'eq_type',
  EquipNo: 'equip_no',
  Size: 'size',
  ISOCode: 'iso_code',
  CustCode: 'cust_code',
  LicNo: 'lic_no',
  LicState: 'lic_state',
  LastGateInDate: 'last_gate_in_date',
  LastGateInTime: 'last_gate_in_time',
  LoadType: 'load_type',
  LastCarrier: 'last_carrier',
  LastCarrierName: 'last_carrier_name',
  BookingNo: 'booking_no',
  DaysOnsite: 'days_onsite',
  Comment: 'comment',
  ResourceName: 'resource_name',
}

// Columns to ignore from the TMS export
const IGNORED_COLUMNS = new Set(['textbox12', 'Spot1', 'Spot2'])

function normalizeDate(value: unknown): string | null {
  if (value == null) return null
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      const y = date.y
      const m = String(date.m).padStart(2, '0')
      const d = String(date.d).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }
  const str = String(value).trim()
  if (!str) return null
  // Try parsing ISO-like dates
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return str
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function toIntOrNull(value: unknown): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return isNaN(n) ? null : Math.floor(n)
}

export function parseExcel(
  buffer: ArrayBuffer,
  fileName: string
): InventoryRow[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  const rows: InventoryRow[] = []

  for (const raw of rawRows) {
    // Skip metadata rows (textbox12 = "Total Count:")
    if (raw['textbox12'] === 'Total Count:') continue

    const mapped: Record<string, unknown> = {}

    for (const [excelCol, value] of Object.entries(raw)) {
      if (IGNORED_COLUMNS.has(excelCol)) continue
      const dbField = COLUMN_MAP[excelCol]
      if (!dbField) continue

      switch (dbField) {
        case 'last_gate_in_date':
          mapped[dbField] = normalizeDate(value)
          break
        case 'size':
        case 'last_gate_in_time':
        case 'days_onsite':
          mapped[dbField] = toIntOrNull(value)
          break
        case 'booking_no':
          // Always cast to string (comes as number like 718910910)
          mapped[dbField] = value != null ? String(value) : null
          break
        default:
          mapped[dbField] = toStringOrNull(value)
          break
      }
    }

    // Only include rows that have an equip_no (even if blank, we still capture for audit)
    rows.push({
      equip_group_id: (mapped.equip_group_id as string) ?? null,
      eq_type: (mapped.eq_type as string) ?? null,
      equip_no: (mapped.equip_no as string) ?? '',
      size: (mapped.size as number) ?? null,
      iso_code: (mapped.iso_code as string) ?? null,
      cust_code: (mapped.cust_code as string) ?? null,
      lic_no: (mapped.lic_no as string) ?? null,
      lic_state: (mapped.lic_state as string) ?? null,
      last_gate_in_date: (mapped.last_gate_in_date as string) ?? null,
      last_gate_in_time: (mapped.last_gate_in_time as number) ?? null,
      load_type: (mapped.load_type as string) ?? null,
      last_carrier: (mapped.last_carrier as string) ?? null,
      last_carrier_name: (mapped.last_carrier_name as string) ?? null,
      booking_no: (mapped.booking_no as string) ?? null,
      days_onsite: (mapped.days_onsite as number) ?? null,
      comment: (mapped.comment as string) ?? null,
      resource_name: (mapped.resource_name as string) ?? null,
      source_file: fileName,
    })
  }

  return rows
}
