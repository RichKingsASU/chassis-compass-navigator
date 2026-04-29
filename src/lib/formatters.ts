export function safeDate(v: unknown): string {
  if (!v || v === 'N/A') return 'N/A'
  const d = new Date(v as string)
  return isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function safeAmount(v: unknown): string {
  if (!v && v !== 0) return 'N/A'
  const n = parseFloat(String(v).replace(/[$,]/g, ''))
  return isNaN(n) ? String(v) : `$${n.toFixed(2)}`
}

export function formatPeriod(period: string): string {
  if (!period) return 'N/A'
  // Expecting YYYY-MM
  const [year, month] = period.split('-')
  if (!year || !month) return period
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
