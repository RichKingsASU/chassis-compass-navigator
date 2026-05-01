const TZ = 'America/Los_Angeles'

export function formatPT(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '—'
  const datePart = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  })
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  })
  return `${datePart} ${timePart} PT`
}

export function formatDatePT(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  })
}

export function daysSince(value: string | Date | null | undefined): number | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(Number(value))) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function dormancyColor(days: number | null): string {
  if (days == null) return 'text-slate-500'
  if (days <= 7) return 'text-emerald-600'
  if (days <= 30) return 'text-amber-600'
  return 'text-rose-600'
}

export function dormancyBg(days: number | null): string {
  if (days == null) return 'bg-slate-100 text-slate-700'
  if (days <= 7) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (days <= 30) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}
