import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, daysSince } from './format'
import type { GpsPing, LoadRow } from './types'

interface Props {
  loads: LoadRow[]
  loading: boolean
  latestPing: GpsPing | null
}

export default function UtilizationMetricsCard({ loads, loading, latestPing }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Utilization Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const totalLoads = loads.length
  const ytdLoads = loads.filter((l) => {
    const d = l.created_date ? new Date(l.created_date) : null
    return d && !isNaN(d.getTime()) && d >= startOfYear
  })
  const last30 = loads.filter((l) => {
    const d = l.created_date ? new Date(l.created_date) : null
    return d && !isNaN(d.getTime()) && d >= thirtyDaysAgo
  })

  const sumRev = (rows: LoadRow[]) =>
    rows.reduce((s, l) => s + (Number(l.cust_rate_charge) || 0), 0)
  const totalRev = sumRev(loads)
  const ytdRev = sumRev(ytdLoads)
  const positives = loads.filter((l) => (l.cust_rate_charge ?? 0) > 0)
  const avgRev = positives.length ? sumRev(positives) / positives.length : 0
  const zeroRev = loads.filter(
    (l) => l.zero_rev === 'Y' || l.zero_rev === 'YES' || (l.cust_rate_charge ?? 0) === 0
  ).length
  const dormantDays = daysSince(latestPing?.timestamp)
  const utilization30 = (last30.length / 30) * 100

  const avgRevColor =
    avgRev > 400 ? 'text-emerald-600' : avgRev >= 200 ? 'text-amber-600' : 'text-rose-600'

  const metrics = [
    { label: 'Total Loads', value: totalLoads.toLocaleString() },
    { label: 'Loads YTD', value: ytdLoads.length.toLocaleString() },
    { label: 'Loads Last 30d', value: last30.length.toLocaleString() },
    { label: 'Total Billed', value: formatCurrency(totalRev) },
    { label: 'YTD Billed', value: formatCurrency(ytdRev) },
    {
      label: 'Avg Revenue / Load',
      value: formatCurrency(avgRev),
      color: avgRevColor,
    },
    { label: 'Zero-Revenue Loads', value: zeroRev.toLocaleString() },
    {
      label: 'Days Dormant',
      value: dormantDays != null ? `${dormantDays}d` : '—',
    },
    {
      label: 'Load days / 30d',
      value: `${utilization30.toFixed(0)}%`,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Utilization Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border bg-card p-3"
            >
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${m.color || ''}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
