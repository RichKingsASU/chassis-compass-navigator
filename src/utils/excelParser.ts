import * as XLSX from 'xlsx'

export interface ParsedSheet {
  name: string
  headers: string[]
  rows: Record<string, unknown>[]
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
          const headers = json.length > 0 ? Object.keys(json[0]) : []
          return { name, headers, rows: json }
        })
        resolve(sheets)
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Make sure the file is a valid .xlsx or .xls file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
