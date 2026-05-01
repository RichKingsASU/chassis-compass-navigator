import { formatPT, formatCurrency, daysSince } from './format'
import type { ChassisAgentSummary } from './types'

export function buildChassisAgentSystemPrompt(
  chassisNumber: string,
  s: ChassisAgentSummary
): string {
  const lines: string[] = []
  lines.push(
    `You are an AI operations assistant for Forrest Transportation LLC (FRQT), a port drayage carrier at the LA/Long Beach port complex. You are analyzing chassis ${chassisNumber} in the Chassis Compass Navigator system.`
  )
  lines.push('')
  lines.push('Here is everything we know about this chassis right now:')
  lines.push('')

  // IDENTITY
  lines.push('IDENTITY')
  lines.push(`- Lessor: ${s.identity.lessor || 'unknown'}`)
  lines.push(`- Type: ${s.identity.chassis_type || 'unknown'}`)
  lines.push(`- Size / Description: ${s.identity.chassis_size || 'unknown'}`)
  if (s.identity.chassis_status) lines.push(`- Status: ${s.identity.chassis_status}`)
  if (s.identity.gps_provider) lines.push(`- GPS Provider: ${s.identity.gps_provider}`)
  lines.push('')

  // GPS
  if (s.latestPing) {
    const dormant = daysSince(s.latestPing.timestamp)
    lines.push(
      `CURRENT GPS LOCATION (as of ${formatPT(s.latestPing.timestamp)})`
    )
    lines.push(`- Source: ${s.latestPing.source}`)
    lines.push(`- Landmark: ${s.latestPing.landmark || 'unknown'}`)
    lines.push(`- Address: ${s.latestPing.address || 'unknown'}`)
    if (s.latestPing.lat != null && s.latestPing.lng != null) {
      lines.push(
        `- Coordinates: ${s.latestPing.lat.toFixed(5)}, ${s.latestPing.lng.toFixed(5)}`
      )
    }
    lines.push(
      `- Days since last movement: ${dormant != null ? dormant : 'unknown'}`
    )
  } else {
    lines.push('CURRENT GPS LOCATION')
    lines.push('- No GPS data available across any source')
  }
  lines.push('')

  // ACTIVE LOAD
  lines.push('ACTIVE TMS LOAD')
  if (s.activeLoad) {
    lines.push(`- Load #: ${s.activeLoad.ld_num || 'n/a'}`)
    lines.push(`- Status: ${s.activeLoad.status || 'n/a'}`)
    lines.push(`- Customer: ${s.activeLoad.customer_name || 'n/a'}`)
    const origin = [
      s.activeLoad.pickup_loc_name,
      [s.activeLoad.pickup_city, s.activeLoad.pickup_state].filter(Boolean).join(', '),
    ]
      .filter(Boolean)
      .join(' · ')
    const dest = [
      s.activeLoad.delivery_loc_name,
      [s.activeLoad.delivery_city, s.activeLoad.delivery_state].filter(Boolean).join(', '),
    ]
      .filter(Boolean)
      .join(' · ')
    if (origin) lines.push(`- Origin: ${origin}`)
    if (dest) lines.push(`- Destination: ${dest}`)
    if (s.activeLoad.delivery_actual_date)
      lines.push(`- Delivery date: ${formatPT(s.activeLoad.delivery_actual_date)}`)
  } else {
    lines.push('- No active load on record.')
  }
  lines.push('')

  // TMS SUMMARY
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const ytd = s.loads.filter((l) => {
    const d = l.created_date ? new Date(l.created_date) : null
    return d && !isNaN(d.getTime()) && d >= startOfYear
  })
  const sumRev = (rows: typeof s.loads) =>
    rows.reduce((acc, l) => acc + (Number(l.cust_rate_charge) || 0), 0)
  const totalRev = sumRev(s.loads)
  const ytdRev = sumRev(ytd)
  const positives = s.loads.filter((l) => (l.cust_rate_charge ?? 0) > 0)
  const avgRev = positives.length ? sumRev(positives) / positives.length : 0
  const zeroRev = s.loads.filter(
    (l) => l.zero_rev === 'Y' || l.zero_rev === 'YES' || (l.cust_rate_charge ?? 0) === 0
  ).length

  lines.push('TMS SUMMARY (all-time)')
  lines.push(`- Total loads: ${s.loads.length}`)
  lines.push(`- Loads YTD: ${ytd.length}`)
  lines.push(`- Total revenue billed: ${formatCurrency(totalRev)}`)
  lines.push(`- YTD revenue: ${formatCurrency(ytdRev)}`)
  lines.push(`- Avg revenue per load: ${formatCurrency(avgRev)}`)
  lines.push(`- Zero-revenue loads: ${zeroRev}`)
  lines.push('')

  // GPS DORMANCY
  lines.push('GPS DORMANCY')
  for (const [k, v] of Object.entries(s.perSourceLast)) {
    if (v) {
      const days = daysSince(v)
      lines.push(`- ${k} last seen: ${formatPT(v)} (${days != null ? days + 'd ago' : '—'})`)
    } else {
      lines.push(`- ${k} last seen: no data`)
    }
  }
  lines.push('')

  // AXLE SWAP
  if (s.axleSwap) {
    lines.push(
      `AXLE SWAP FLAG: Yes — ${s.axleSwap.yard_name || 'unknown yard'}${
        s.axleSwap.dwell_days != null ? ` (${s.axleSwap.dwell_days}d dwell)` : ''
      }`
    )
  } else {
    lines.push('AXLE SWAP FLAG: No')
  }

  // DCLI
  if (s.dcliRows.length > 0) {
    const last = s.dcliRows[0]
    lines.push(
      `DCLI ACTIVITY: most recent date out ${last.date_out || '—'}, pick-up ${
        last.pick_up_location || '—'
      } (${s.dcliRows.length} rows on record)`
    )
  } else {
    lines.push('DCLI ACTIVITY: none on record')
  }

  // PIER S
  lines.push(
    `PIER S EVENTS: ${s.pierSCount} events${
      s.pierSLatest ? `, most recent ${formatPT(s.pierSLatest)}` : ''
    }`
  )
  lines.push('')
  lines.push(
    "Answer questions about this chassis in plain, direct language. When you don't have data for something, say so clearly. You can reference the data above and reason about it. Flag anything operationally concerning."
  )

  return lines.join('\n')
}
