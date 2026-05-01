import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { TrendingDown, DollarSign, Clock, AlertTriangle, Search } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOpportunityLost } from '@/hooks/useOpportunityLost'

const LESSOR_COLORS: Record<string, string> = {
  PTSC: '#2563eb',
  Milestone: '#9333ea',
  TRAC: '#16a34a',
  'KF Leasing': '#ea580c',
}

const fmtMoney = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const fmtMoney2 = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtShortDate = (v: string | null | undefined) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysCellClass(days: number | null) {
  if (days == null) return 'text-muted-foreground'
  if (days >= 15) return 'text-red-600 font-semibold'
  if (days >= 8) return 'text-amber-600 font-medium'
  return 'text-muted-foreground'
}

function lessorColor(lessor: string | null) {
  if (!lessor) return '#64748b'
  return LESSOR_COLORS[lessor] ?? '#64748b'
}

export default function OpportunityLostPage() {
  const { dailyData, chassisData, loading, error } = useOpportunityLost()
  const [search, setSearch] = useState('')

  const totals = useMemo(() => {
    const totalChassis = chassisData.length
    const totalCost = chassisData.reduce((s, r) => s + (r.idle_lease_cost ?? 0), 0)
    const sumDays = chassisData.reduce((s, r) => s + (r.days_idle ?? 0), 0)
    const avgDays = totalChassis > 0 ? sumDays / totalChassis : 0
    let worst: { chassis_number: string; days_idle: number } | null = null
    for (const r of chassisData) {
      const d = r.days_idle ?? 0
      if (!worst || d > worst.days_idle) {
        worst = { chassis_number: r.chassis_number, days_idle: d }
      }
    }
    return { totalChassis, totalCost, avgDays, worst }
  }, [chassisData])

  const lessorBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { lessor: string; chassis: number; total_cost: number; sum_days: number; sum_rate: number; rate_count: number }
    >()
    for (const r of chassisData) {
      const key = r.lessor ?? 'Unknown'
      const entry =
        map.get(key) ??
        { lessor: key, chassis: 0, total_cost: 0, sum_days: 0, sum_rate: 0, rate_count: 0 }
      entry.chassis += 1
      entry.total_cost += r.idle_lease_cost ?? 0
      entry.sum_days += r.days_idle ?? 0
      if (r.lease_rate_per_day != null) {
        entry.sum_rate += r.lease_rate_per_day
        entry.rate_count += 1
      }
      map.set(key, entry)
    }
    return Array.from(map.values())
      .map((e) => {
        const avgRate = e.rate_count > 0 ? e.sum_rate / e.rate_count : 0
        return {
          lessor: e.lessor,
          chassis: e.chassis,
          total_cost: e.total_cost,
          avg_days: e.chassis > 0 ? e.sum_days / e.chassis : 0,
          avg_rate: avgRate,
          daily_exposure: e.chassis * avgRate,
        }
      })
      .sort((a, b) => b.total_cost - a.total_cost)
  }, [chassisData])

  const filteredChassis = useMemo(() => {
    if (!search.trim()) return chassisData
    const s = search.toLowerCase()
    return chassisData.filter((r) => {
      return (
        (r.chassis_number ?? '').toLowerCase().includes(s) ||
        (r.acct_mgr_name ?? '').toLowerCase().includes(s) ||
        (r.lessor ?? '').toLowerCase().includes(s)
      )
    })
  }, [chassisData, search])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center text-red-600">
            Failed to load opportunity lost data: {error}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Opportunity Lost</h1>
        <p className="text-muted-foreground">
          Idle lease cost accumulating on dormant chassis
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Idle Chassis</div>
                <div className="text-2xl font-bold text-blue-600">
                  {totals.totalChassis.toLocaleString('en-US')}
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Idle Cost</div>
                <div className="text-2xl font-bold text-red-600">
                  {fmtMoney(totals.totalCost)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Avg Days Idle</div>
                <div className="text-2xl font-bold text-amber-600">
                  {totals.avgDays.toFixed(1)} days
                </div>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Worst Offender</div>
                <div className="text-2xl font-bold text-red-600">
                  {totals.worst ? `${totals.worst.days_idle} days` : '—'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {totals.worst?.chassis_number ?? ''}
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Idle Lease Cost</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chassis stopped earning by date
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="idleCostGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="idle_since_date"
                  tickFormatter={fmtShortDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) => fmtMoney(v as number)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const d = payload[0].payload as {
                      idle_since_date: string
                      chassis_count: number
                      total_idle_cost: number
                      avg_days_idle: number
                    }
                    return (
                      <div className="bg-background border rounded-md shadow-md p-3 text-sm">
                        <div className="font-semibold mb-1">{fmtShortDate(d.idle_since_date)}</div>
                        <div>Chassis: {d.chassis_count}</div>
                        <div>Total cost: {fmtMoney(d.total_idle_cost)}</div>
                        <div>Avg days idle: {Number(d.avg_days_idle ?? 0).toFixed(1)}</div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_idle_cost"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fill="url(#idleCostGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lessor Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">Idle cost exposure by lessor</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lessorBreakdown}
                    dataKey="total_cost"
                    nameKey="lessor"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: { lessor: string }) => entry.lessor}
                  >
                    {lessorBreakdown.map((entry) => (
                      <Cell key={entry.lessor} fill={lessorColor(entry.lessor)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lessor</TableHead>
                    <TableHead className="text-right">Chassis</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Avg Days</TableHead>
                    <TableHead className="text-right">Daily Rate Exposure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessorBreakdown.map((row) => (
                    <TableRow key={row.lessor}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: lessorColor(row.lessor) }}
                          />
                          <span className="font-medium">{row.lessor}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row.chassis}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {fmtMoney(row.total_cost)}
                      </TableCell>
                      <TableCell className="text-right">{row.avg_days.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        {fmtMoney(row.daily_exposure)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Idle Chassis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sorted by lease cost accumulating
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chassis, acct mgr, lessor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">
            Showing {filteredChassis.length.toLocaleString('en-US')} of{' '}
            {chassisData.length.toLocaleString('en-US')}
          </div>
          <div className="overflow-auto border rounded-md" style={{ maxHeight: 400 }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Lessor</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Days Idle</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
                  <TableHead className="text-right">Idle Cost</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Acct Mgr</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>LD #</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChassis.map((r) => (
                  <TableRow key={r.chassis_number}>
                    <TableCell className="font-mono text-xs">{r.chassis_number}</TableCell>
                    <TableCell>{r.chassis_type ?? '—'}</TableCell>
                    <TableCell>{r.lessor ?? '—'}</TableCell>
                    <TableCell>{r.region ?? '—'}</TableCell>
                    <TableCell className={`text-right ${daysCellClass(r.days_idle)}`}>
                      {r.days_idle ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.lease_rate_per_day != null ? fmtMoney2(r.lease_rate_per_day) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {r.idle_lease_cost != null ? fmtMoney2(r.idle_lease_cost) : '—'}
                    </TableCell>
                    <TableCell>{fmtShortDate(r.last_activity_date)}</TableCell>
                    <TableCell>{r.acct_mgr_name ?? '—'}</TableCell>
                    <TableCell>{r.container_number ?? '—'}</TableCell>
                    <TableCell>{r.ld_num ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {filteredChassis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      No chassis match the current filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
