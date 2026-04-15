import * as XLSX from 'xlsx'

export interface ParsedSheet {
  name: string
  headers: string[]
  rows: Record<string, unknown>[]
}

// DCLI exports store date columns as "General" number format.
// Excel serial 46098 = 2026-03-17. Any number 40000–60000 is a date.
function excelSerialToISO(serial: number): string {
  return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString()
}

function coerceValue(value: unknown): unknown {
  if (typeof value === 'number' && value > 40000 && value < 60000) {
    return excelSerialToISO(value)
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString()
  }
  return value
}

export function parseExcelFile(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name]
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
          const coerced = json.map(row =>
            Object.fromEntries(Object.entries(row).map(([k, v]) => [k, coerceValue(v)]))
          )
          const headers = coerced.length > 0 ? Object.keys(coerced[0]) : []
          return { name, headers, rows: coerced }
        })
        resolve(sheets)
      } catch (err) {
        reject(new Error('Failed to parse file. Make sure it is a valid .xlsx or .xls file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
