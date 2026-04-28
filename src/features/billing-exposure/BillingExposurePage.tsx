import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QueryEmptyState } from '@/components/ui/QueryEmptyState'
import { safeAmount } from '@/lib/formatters'

interface BillingExposureRow {
  period_month: string | null
  acct_mgr: string | null
  region: string | null
  status: string | null
  load_count: number | null
  billed_load_count: number | null
  unbilled_load_count: number | null
  total_rated: number | null
  total_invoiced: number | null
  revenue_gap: number | null
  gap_pct: number | null
  total_carrier_rated: number | null
  total_carrier_invoiced: number | null
  total_margin_rate: number | null
  total_margin_invoice: number | null
  total_linehaul_fuel_rate: number | null
  total_linehaul_fuel_inv: number | null
}

function formatPeriod(period: string | null): string {
  if (!period) return '—'
  const d = new Date(period)
  if (isNaN(d.getTime())) return period
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function BillingExposurePage() {
  const [periodFilter, setPeriodFilter] = useState<string>('ALL')
  const [regionFilter, setRegionFilter] = useState<string>('ALL')

  const { data = [], isLoading: loading, error: fetchError } = useQuery<BillingExposureRow[]>({
    queryKey: ['v_revenue_gap'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_revenue_gap').select('*')
      if (error) throw error
      return (data || []) as BillingExposureRow[]
    },
  })

  const error = fetchError ? (fetchError as Error).message : null

  const periods = useMemo(() => {
    const set = new Set<string>()
    for (const r of data) {
      if (r.period_month) set.add(r.period_month)
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1))
  }, [data])

  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const r of data) {
      if (r.region) set.add(r.region)
    }
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    const rows = data.filter((r) => {
      if (periodFilter !== 'ALL' && r.period_month !== periodFilter) return false
      if (regionFilter !== 'ALL' && r.region !== regionFilter) return false
      return true
    })
    return rows.sort(
      (a, b) => (Number(b.revenue_gap) || 0) - (Number(a.revenue_gap) || 0),
    )
  }, [data, periodFilter, regionFilter])

  const totalGap = filtered.reduce((s, r) => s + (Number(r.revenue_gap) || 0), 0)
  const totalRated = filtered.reduce((s, r) => s + (Number(r.total_rated) || 0), 0)
  const totalUnbilledLoads = filtered.reduce(
    (s, r) => s + (Number(r.unbilled_load_count) || 0),
    0,
  )
  const weightedGapPct = totalRated > 0 ? (totalGap / totalRated) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Revenue Gap Analysis</h1>
          <p className="text-muted-foreground">
            Rated vs invoiced by period, region, and account manager
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue Gap</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className={`text-3xl font-bold ${totalGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {safeAmount(totalGap)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Gap %</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className={`text-3xl font-bold ${weightedGapPct > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {weightedGapPct.toFixed(2)}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unbilled Loads</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{totalUnbilledLoads.toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Rated</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{safeAmount(totalRated)}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Periods</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>{formatPeriod(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Region:</span>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <QueryEmptyState reason="no_data" entityName="revenue gap records" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Acct Mgr</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Loads</TableHead>
                    <TableHead className="text-right">Total Rated</TableHead>
                    <TableHead className="text-right">Total Invoiced</TableHead>
                    <TableHead className="text-right">Revenue Gap</TableHead>
                    <TableHead className="text-right">Gap %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, i) => {
                    const gap = Number(row.revenue_gap) || 0
                    const gapPct = Number(row.gap_pct) || 0
                    const gapClass = gap > 0 ? 'text-red-600 font-medium' : 'text-green-600'
                    const gapPctClass = gapPct > 0 ? 'text-red-600 font-medium' : ''
                    return (
                      <TableRow key={`${row.period_month}-${row.acct_mgr}-${row.region}-${row.status}-${i}`}>
                        <TableCell className="text-sm">{formatPeriod(row.period_month)}</TableCell>
                        <TableCell className="text-sm">{row.acct_mgr || '—'}</TableCell>
                        <TableCell className="text-sm">{row.region || '—'}</TableCell>
                        <TableCell className="text-sm">{row.status || '—'}</TableCell>
                        <TableCell className="text-right">{Number(row.load_count) || 0}</TableCell>
                        <TableCell className="text-right">{safeAmount(row.total_rated)}</TableCell>
                        <TableCell className="text-right">{safeAmount(row.total_invoiced)}</TableCell>
                        <TableCell className={`text-right ${gapClass}`}>{safeAmount(gap)}</TableCell>
                        <TableCell className={`text-right ${gapPctClass}`}>{gapPct.toFixed(2)}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
