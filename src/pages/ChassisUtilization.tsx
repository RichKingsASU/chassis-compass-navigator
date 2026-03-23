import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts'

interface Chassis {
  chassis_number: string
  chassis_type: string
  chassis_desc: string
  year: number
  color: string
  total_loads: number
  total_revenue: number
  total_carrier_cost: number
  total_margin: number
  total_miles: number
  avg_miles_per_load: number
  avg_revenue_per_load: number
  avg_utilization: number
  best_month: string
  best_month_util: number
  worst_month: string
  worst_month_util: number
  months_active: number
  total_mr_cost: number
  total_mr_days: number
}

interface MonthlyStat {
  chassis_number: string
  month: string
  loads: number
  active_days: number
  revenue: number
  carrier_cost: number
  miles: number
  utilization_pct: number
  margin: number
  margin_pct: number
}

interface MREvent {
  id: number
  chassis_number: string
  event_date: string
  end_date: string
  event_type: string
  description: string
  cost: number
  vendor: string
}

interface IdleGap {
  id: number
  chassis_number: string
  gap_start: string
  gap_end: string
  days: number
  gap_type: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function ChassisUtilization() {
  const [chassisList, setChassisList] = useState<Chassis[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [mrEvents, setMrEvents] = useState<MREvent[]>([])
  const [idleGaps, setIdleGaps] = useState<IdleGap[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [chassisRes, statsRes, mrRes, idleRes] = await Promise.all([
          supabase.from('chassis').select('*').order('chassis_number'),
          supabase.from('monthly_stats').select('*').order('month'),
          supabase.from('mr_events').select('*').order('event_date', { ascending: false }),
          supabase.from('idle_gaps').select('*').order('gap_start', { ascending: false }),
        ])
        if (chassisRes.error) throw chassisRes.error
        if (statsRes.error) throw statsRes.error
        setChassisList(chassisRes.data || [])
        setMonthlyStats(statsRes.data || [])
        setMrEvents(mrRes.data || [])
        setIdleGaps(idleRes.data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load utilization data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
      </div>
    )
  }

  const totalRevenue = chassisList.reduce((s, c) => s + (c.total_revenue || 0), 0)
  const totalLoads = chassisList.reduce((s, c) => s + (c.total_loads || 0), 0)
  const avgUtil = chassisList.length > 0
    ? chassisList.reduce((s, c) => s + (c.avg_utilization || 0), 0) / chassisList.length
    : 0
  const totalMRCost = chassisList.reduce((s, c) => s + (c.total_mr_cost || 0), 0)

  // Build monthly trend data grouped by month across all chassis
  const monthMap = new Map<string, { month: string; utilization: number; revenue: number; loads: number; count: number }>()
  for (const s of monthlyStats) {
    const existing = monthMap.get(s.month)
    if (existing) {
      existing.utilization += s.utilization_pct || 0
      existing.revenue += s.revenue || 0
      existing.loads += s.loads || 0
      existing.count++
    } else {
      monthMap.set(s.month, { month: s.month, utilization: s.utilization_pct || 0, revenue: s.revenue || 0, loads: s.loads || 0, count: 1 })
    }
  }
  const trendData = Array.from(monthMap.values())
    .map(m => ({ month: m.month, utilization: Math.round(m.utilization / m.count * 10) / 10, revenue: m.revenue, loads: m.loads }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Per-chassis monthly data for line chart
  const chassisMonthlyMap = new Map<string, Map<string, MonthlyStat>>()
  for (const s of monthlyStats) {
    if (!chassisMonthlyMap.has(s.chassis_number)) chassisMonthlyMap.set(s.chassis_number, new Map())
    chassisMonthlyMap.get(s.chassis_number)!.set(s.month, s)
  }

  // All months sorted
  const allMonths = [...new Set(monthlyStats.map(s => s.month))].sort()

  // Per-chassis utilization trend for multi-line chart
  const perChassisUtilData = allMonths.map(month => {
    const row: Record<string, string | number> = { month }
    for (const c of chassisList) {
      const stat = chassisMonthlyMap.get(c.chassis_number)?.get(month)
      row[c.chassis_number] = stat?.utilization_pct ?? 0
    }
    return row
  })

  // Fleet comparison pie chart
  const revenueShare = chassisList.map(c => ({ name: c.chassis_number, value: c.total_revenue || 0 }))

  // Idle gap summary per chassis
  const idleSummary = chassisList.map(c => {
    const gaps = idleGaps.filter(g => g.chassis_number === c.chassis_number)
    const totalDays = gaps.reduce((s, g) => s + (g.days || 0), 0)
    return { chassis: c.chassis_number, gaps: gaps.length, totalIdleDays: totalDays }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Utilization</h1>
        <p className="text-muted-foreground">Fleet performance analytics across {chassisList.length} chassis units</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Fleet Size</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{chassisList.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalLoads.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Utilization</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{avgUtil.toFixed(1)}%</p></CardContent>
        </Card>
      </div>

      {/* Chassis roster */}
      <Card>
        <CardHeader><CardTitle>Fleet Roster</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Loads</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Avg Util</TableHead>
                <TableHead>Best Month</TableHead>
                <TableHead>Worst Month</TableHead>
                <TableHead>M&R Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chassisList.map(c => (
                <TableRow key={c.chassis_number}>
                  <TableCell className="font-mono font-medium">{c.chassis_number}</TableCell>
                  <TableCell><Badge variant="outline">{c.chassis_type}</Badge></TableCell>
                  <TableCell>{c.year}</TableCell>
                  <TableCell>{c.total_loads}</TableCell>
                  <TableCell>{formatCurrency(c.total_revenue)}</TableCell>
                  <TableCell className={c.total_margin >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(c.total_margin)}</TableCell>
                  <TableCell>
                    <Badge variant={c.avg_utilization >= 60 ? 'default' : c.avg_utilization >= 40 ? 'secondary' : 'destructive'}>
                      {c.avg_utilization}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{c.best_month} ({c.best_month_util}%)</TableCell>
                  <TableCell className="text-sm">{c.worst_month} ({c.worst_month_util}%)</TableCell>
                  <TableCell>{formatCurrency(c.total_mr_cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabbed analytics */}
      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Utilization Trends</TabsTrigger>
          <TabsTrigger value="revenue">Revenue & Margin</TabsTrigger>
          <TabsTrigger value="comparison">Fleet Comparison</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="idle">Idle Analysis</TabsTrigger>
        </TabsList>

        {/* TAB 1: Utilization Trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Fleet Average Utilization by Month</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Area type="monotone" dataKey="utilization" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Avg Utilization" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Per-Chassis Utilization Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={perChassisUtilData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip />
                  <Legend />
                  {chassisList.map((c, i) => (
                    <Line key={c.chassis_number} type="monotone" dataKey={c.chassis_number} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Revenue & Margin */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Monthly Fleet Revenue</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Revenue & Margin per Chassis</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chassisList.map(c => ({ name: c.chassis_number, revenue: c.total_revenue, margin: c.total_margin }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="margin" fill="#10b981" name="Margin" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Fleet Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Revenue Share</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={revenueShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(p: { name: string; percent: number }) => `${p.name} ${(p.percent * 100).toFixed(0)}%`}>
                      {revenueShare.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Loads per Chassis</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chassisList.map(c => ({ name: c.chassis_number, loads: c.total_loads, miles: c.total_miles }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="loads" fill="#8b5cf6" name="Total Loads" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Utilization Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chassisList.map(c => ({ name: c.chassis_number, utilization: c.avg_utilization }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="utilization" name="Avg Utilization">
                    {chassisList.map((c, i) => (
                      <Cell key={i} fill={c.avg_utilization >= 60 ? '#10b981' : c.avg_utilization >= 40 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Maintenance */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total M&R Cost</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(totalMRCost)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Events</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{mrEvents.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total M&R Days</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{chassisList.reduce((s, c) => s + (c.total_mr_days || 0), 0)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Cost/Event</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{mrEvents.length > 0 ? formatCurrency(totalMRCost / mrEvents.length) : '$0'}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>M&R Cost by Chassis</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chassisList.map(c => ({ name: c.chassis_number, cost: c.total_mr_cost, days: c.total_mr_days }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: number, name: string) => name === 'cost' ? formatCurrency(v) : `${v} days`} />
                  <Legend />
                  <Bar dataKey="cost" fill="#ef4444" name="M&R Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Maintenance Events</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrEvents.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono">{e.chassis_number}</TableCell>
                      <TableCell>{e.event_date}</TableCell>
                      <TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>{e.vendor}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(e.cost)}</TableCell>
                    </TableRow>
                  ))}
                  {mrEvents.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No maintenance events recorded</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Idle Analysis */}
        <TabsContent value="idle" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Idle Days by Chassis</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={idleSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="chassis" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalIdleDays" fill="#f59e0b" name="Total Idle Days" />
                  <Bar dataKey="gaps" fill="#8b5cf6" name="# of Gaps" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Idle Periods</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {idleGaps.slice(0, 50).map(g => (
                    <TableRow key={g.id}>
                      <TableCell className="font-mono">{g.chassis_number}</TableCell>
                      <TableCell>{g.gap_start}</TableCell>
                      <TableCell>{g.gap_end}</TableCell>
                      <TableCell>
                        <Badge variant={g.days > 14 ? 'destructive' : g.days > 7 ? 'secondary' : 'outline'}>
                          {g.days}d
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">{g.gap_type}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {idleGaps.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No idle gaps recorded</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
