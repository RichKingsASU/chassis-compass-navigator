export function formatUSD(value: unknown): string {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function formatShortDate(value: unknown): string {
  if (!value) return ''
  const d = new Date(value as string)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isPdf(fileType: string | null | undefined, name?: string | null): boolean {
  const t = (fileType ?? '').toLowerCase()
  if (t.includes('pdf')) return true
  return !!name?.toLowerCase().endsWith('.pdf')
}

export function isXlsx(fileType: string | null | undefined, name?: string | null): boolean {
  const t = (fileType ?? '').toLowerCase()
  if (t.includes('sheet') || t.includes('excel') || t.includes('xlsx') || t.includes('xls')) return true
  const n = (name ?? '').toLowerCase()
  return n.endsWith('.xlsx') || n.endsWith('.xls')
}
