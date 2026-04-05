export const safeDate = (v: unknown): string => {
  if (!v || v === 'N/A') return 'N/A'
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? String(v) :
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const safeAmount = (v: unknown): string => {
  if (v === null || v === undefined) return 'N/A'
  const n = parseFloat(String(v).replace(/[$,]/g, ''))
  return isNaN(n) ? String(v) : `$${n.toFixed(2)}`
}
