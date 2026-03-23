import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'

// ── Interfaces ──────────────────────────────────────────────

interface Chassis {
  id: number
  chassis_number: string
  chassis_type: string | null
  chassis_desc: string | null
  year: number | null
  color: string | null
  total_loads: number | null
  total_revenue: number | null
  total_carrier_cost: number | null
  total_margin: number | null
  total_miles: number | null
  avg_miles_per_load: number | null
  avg_revenue_per_load: number | null
  avg_utilization: number | null
  best_month: string | null
  best_month_util: number | null
  worst_month: string | null
  worst_month_util: number | null
  first_activity: string | null
  last_activity: string | null
  months_active: number | null
  total_mr_cost: number | null
  total_mr_days: number | null
}

interface Load {
  id: number
  ld_num: string
  container: string | null
  container_type: string | null
  customer: string | null
  carrier: string | null
  pickup_loc: string | null
  pickup_city: string | null
  pickup_state: string | null
  delivery_loc: string | null
  delivery_city: string | null
  delivery_state: string | null
  pickup_date: string | null
  delivery_date: string | null
  revenue: number | null
  carrier_cost: number | null
  miles: number | null
  status: string | null
  service: string | null
  days_on_load: number | null
}

interface MonthlyStat {
  id: number
  month: string
  loads: number | null
  active_days: number | null
  revenue: number | null
  carrier_cost: number | null
  miles: number | null
  utilization_pct: number | null
  margin: number | null
  margin_pct: number | null
}

interface MrEvent {
  id: number
  event_date: string | null
  end_date: string | null
  event_type: string | null
  description: string | null
  cost: number | null
  vendor: string | null
}

interface GpsRecord {
  id: string
  device_id: string | null
  latitude: number | null
  longitude: number | null
  recorded_at: string | null
  speed: number | null
  heading: number | null
  raw_data: unknown
}

// ── Helpers ─────────────────────────────────────────────────

function fmtLoc(loc: string | null, city: string | null, state: string | null) {
  if (loc) return loc
  if (city && state) return `${city}, ${state}`
  return city || state || 'N/A'
}

function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

// ── Component ───────────────────────────────────────────────

export default function ChassisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [chassis, setChassis] = useState<Chassis | null>(null)
  const [loads, setLoads] = useState<Load[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [mrEvents, setMrEvents] = useState<MrEvent[]>([])
  const [gpsHistory, setGpsHistory] = useState<GpsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('chassis')
          .select('*')
          .eq('id', Number(id))
          .single()
        if (fetchErr) throw fetchErr
        setChassis(data)

        const cn = data.chassis_number
        const [loadsRes, statsRes, mrRes, gpsRes] = await Promise.all([
          supabase.from('loads').select('*').eq('chassis_number', cn).order('pickup_date', { ascending: false }),
          supabase.from('monthly_stats').select('*').eq('chassis_number', cn).order('month', { ascending: true }),
          supabase.from('mr_events').select('*').eq('chassis_number', cn).order('event_date', { ascending: false }),
          supabase.from('gps_data').select('*').eq('device_id', cn).order('recorded_at', { ascending: true }),
        ])
        setLoads(loadsRes.data || [])
        setMonthlyStats(statsRes.data || [])
        setMrEvents(mrRes.data || [])
        setGpsHistory(gpsRes.data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!chassis) return <div className="p-6"><p className="text-destructive">Chassis not found.</p></div>

  const totalMrCost = mrEvents.reduce((s, e) => s + (e.cost ?? 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/chassis')} className="text-muted-foreground hover:text-foreground text-sm">
          &larr; Back to Chassis
        </button>
        <h1 className="text-3xl font-bold font-mono">{chassis.chassis_number}</h1>
        {chassis.chassis_desc && <span className="text-muted-foreground text-sm">{chassis.chassis_desc}</span>}
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Chassis Type</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.chassis_type || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Year</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.year ?? 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Utilization</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.avg_utilization != null ? `${chassis.avg_utilization}%` : 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.total_loads ?? 'N/A'}</p></CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="loads">Loads ({loads.length})</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="gps">GPS History</TabsTrigger>
        </TabsList>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Chassis Info</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="Chassis #" value={chassis.chassis_number} mono />
                  <Field label="Type" value={chassis.chassis_type} />
                  <Field label="Description" value={chassis.chassis_desc} />
                  <Field label="Year" value={chassis.year} />
                  <Field label="Color" value={chassis.color} />
                  <Field label="First Activity" value={formatDate(chassis.first_activity)} />
                  <Field label="Last Activity" value={formatDate(chassis.last_activity)} />
                  <Field label="Months Active" value={chassis.months_active} />
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="Total Loads" value={chassis.total_loads} />
                  <Field label="Total Revenue" value={formatCurrency(chassis.total_revenue)} />
                  <Field label="Total Carrier Cost" value={formatCurrency(chassis.total_carrier_cost)} />
                  <Field label="Total Margin" value={formatCurrency(chassis.total_margin)} />
                  <Field label="Total Miles" value={chassis.total_miles?.toLocaleString()} />
                  <Field label="Avg Miles/Load" value={chassis.avg_miles_per_load?.toLocaleString()} />
                  <Field label="Avg Rev/Load" value={formatCurrency(chassis.avg_revenue_per_load)} />
                  <Field label="Avg Utilization" value={chassis.avg_utilization != null ? `${chassis.avg_utilization}%` : undefined} />
                  <Field label="Best Month" value={chassis.best_month ? `${chassis.best_month} (${chassis.best_month_util}%)` : undefined} />
                  <Field label="Worst Month" value={chassis.worst_month ? `${chassis.worst_month} (${chassis.worst_month_util}%)` : undefined} />
                  <Field label="Total M&R Cost" value={formatCurrency(chassis.total_mr_cost)} />
                  <Field label="Total M&R Days" value={chassis.total_mr_days} />
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Loads Tab ── */}
        <TabsContent value="loads" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Load History</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LD#</TableHead>
                      <TableHead>Container</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Delivery Location</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                      <TableHead className="text-right">Miles</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Carrier Cost</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Service</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loads.length === 0 ? (
                      <TableRow><TableCell colSpan={15} className="text-center text-muted-foreground">No loads found.</TableCell></TableRow>
                    ) : loads.map(l => {
                      const margin = (l.revenue ?? 0) - (l.carrier_cost ?? 0)
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-sm">{l.ld_num}</TableCell>
                          <TableCell>{l.container || 'N/A'}</TableCell>
                          <TableCell>{l.customer || 'N/A'}</TableCell>
                          <TableCell>{l.carrier || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{fmtLoc(l.pickup_loc, l.pickup_city, l.pickup_state)}</TableCell>
                          <TableCell className="text-sm">{fmtLoc(l.delivery_loc, l.delivery_city, l.delivery_state)}</TableCell>
                          <TableCell>{formatDate(l.pickup_date)}</TableCell>
                          <TableCell>{formatDate(l.delivery_date)}</TableCell>
                          <TableCell className="text-right">{l.days_on_load ?? 'N/A'}</TableCell>
                          <TableCell className="text-right">{l.miles?.toLocaleString() ?? 'N/A'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.carrier_cost)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(margin)}</TableCell>
                          <TableCell><Badge variant="outline">{l.status || 'N/A'}</Badge></TableCell>
                          <TableCell>{l.service || 'N/A'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Utilization Tab ── */}
        <TabsContent value="utilization" className="space-y-4">
          {/* Utilization % line chart */}
          <Card>
            <CardHeader><CardTitle>Monthly Utilization %</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Utilization']} />
                  <ReferenceLine y={75} stroke="green" strokeDasharray="6 3" label="75%" />
                  <Line type="monotone" dataKey="utilization_pct" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Utilization %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue vs Carrier Cost bar chart */}
          <Card>
            <CardHeader><CardTitle>Monthly Revenue vs Carrier Cost</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v))]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                  <Bar dataKey="carrier_cost" fill="#ef4444" name="Carrier Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly stats table */}
          <Card>
            <CardHeader><CardTitle>Monthly Stats</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Loads</TableHead>
                      <TableHead className="text-right">Active Days</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Carrier Cost</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead className="text-right">Miles</TableHead>
                      <TableHead className="text-right">Utilization %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyStats.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No monthly data.</TableCell></TableRow>
                    ) : monthlyStats.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.month}</TableCell>
                        <TableCell className="text-right">{s.loads ?? 0}</TableCell>
                        <TableCell className="text-right">{s.active_days ?? 0}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.carrier_cost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(s.margin)}</TableCell>
                        <TableCell className="text-right">{s.margin_pct != null ? `${s.margin_pct}%` : 'N/A'}</TableCell>
                        <TableCell className="text-right">{s.miles?.toLocaleString() ?? 'N/A'}</TableCell>
                        <TableCell className="text-right">{s.utilization_pct != null ? `${s.utilization_pct}%` : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Maintenance Tab ── */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance &amp; Repair Events</CardTitle>
                <span className="text-sm font-medium">Total Cost: {formatCurrency(totalMrCost)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead className="text-right">Days Out</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrEvents.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No M&amp;R events.</TableCell></TableRow>
                  ) : mrEvents.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{formatDate(e.event_date)}</TableCell>
                      <TableCell>{formatDate(e.end_date)}</TableCell>
                      <TableCell className="text-right">{daysBetween(e.event_date, e.end_date) ?? 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{e.event_type || 'N/A'}</Badge></TableCell>
                      <TableCell className="text-sm">{e.description || 'N/A'}</TableCell>
                      <TableCell>{e.vendor || 'N/A'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(e.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GPS History Tab ── */}
        <TabsContent value="gps" className="space-y-4">
          <GpsHistoryTab gpsHistory={gpsHistory} loads={loads} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── GPS History Tab ─────────────────────────────────────────

const POLYLINE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6']

function parseRawData(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
  if (typeof raw === 'object') return raw as Record<string, unknown>
  return {}
}

function markerColor(locationName: string | null): string {
  if (!locationName) return 'red'
  const n = locationName.toLowerCase()
  if (n.includes('terminal') || n.includes('gateway')) return 'red'
  if (n.includes('yard') || n.includes('depot') || n.includes('staging')) return 'orange'
  if (n.includes('origin') || n.includes('loading')) return 'green'
  if (n.includes('delivery') || n.includes('unloading')) return 'blue'
  return 'purple'
}

function markerUrl(color: string): string {
  return `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
}

function fmtDateTime(dt: string | null): string {
  if (!dt) return 'N/A'
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function GpsHistoryTab({ gpsHistory, loads }: { gpsHistory: GpsRecord[]; loads: Load[] }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPing, setSelectedPing] = useState<GpsRecord | null>(null)

  useEffect(() => {
    async function fetchKey() {
      try {
        const { data } = await supabase
          .from('app_settings').select('value').eq('key', 'google_maps_api_key').single()
        setApiKey(data?.value || null)
      } catch { setApiKey(null) }
      finally { setLoadingKey(false) }
    }
    fetchKey()
  }, [])

  // Default date range from data
  useEffect(() => {
    if (gpsHistory.length === 0) return
    const dates = gpsHistory.filter(g => g.recorded_at).map(g => g.recorded_at!)
    if (dates.length > 0) {
      setDateFrom(dates[0].slice(0, 10))
      setDateTo(dates[dates.length - 1].slice(0, 10))
    }
  }, [gpsHistory])

  const filteredPings = useMemo(() => {
    return gpsHistory.filter(g => {
      if (!g.recorded_at || g.latitude == null || g.longitude == null) return false
      const d = g.recorded_at.slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      return true
    })
  }, [gpsHistory, dateFrom, dateTo])

  const loadsByNum = useMemo(() => {
    const m = new Map<string, Load>()
    loads.forEach(l => m.set(l.ld_num, l))
    return m
  }, [loads])

  const uniqueLoads = useMemo(() => {
    const s = new Set<string>()
    filteredPings.forEach(g => {
      const rd = parseRawData(g.raw_data)
      const ln = rd.load_number as string | undefined
      if (ln) s.add(ln)
    })
    return s
  }, [filteredPings])

  // Group pings by load_number for polylines
  const polylineGroups = useMemo(() => {
    const groups = new Map<string, { lat: number; lng: number }[]>()
    filteredPings.forEach(g => {
      const rd = parseRawData(g.raw_data)
      const ln = (rd.load_number as string) || '__no_load__'
      if (!groups.has(ln)) groups.set(ln, [])
      groups.get(ln)!.push({ lat: g.latitude!, lng: g.longitude! })
    })
    return groups
  }, [filteredPings])

  // Markers: only where location_name is not null
  const markers = useMemo(() => {
    return filteredPings.filter(g => {
      const rd = parseRawData(g.raw_data)
      return (rd.location_name as string | null) != null
    })
  }, [filteredPings])

  const resetDates = () => {
    if (gpsHistory.length === 0) return
    const dates = gpsHistory.filter(g => g.recorded_at).map(g => g.recorded_at!)
    if (dates.length > 0) {
      setDateFrom(dates[0].slice(0, 10))
      setDateTo(dates[dates.length - 1].slice(0, 10))
    }
  }

  const tableRows = filteredPings.slice(0, 200)
  const truncated = filteredPings.length > 200

  return (
    <>
      {/* Date filter bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border rounded px-2 py-1 text-sm" />
            <label className="text-sm font-medium">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border rounded px-2 py-1 text-sm" />
            <button onClick={resetDates}
              className="text-sm px-3 py-1 rounded bg-muted hover:bg-muted/80 font-medium">All</button>
            <Badge variant="secondary">
              {filteredPings.length} pings &middot; {uniqueLoads.size} loads
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          {loadingKey ? (
            <div className="h-[420px] flex items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg">
              <p className="text-muted-foreground">Loading map configuration...</p>
            </div>
          ) : !apiKey ? (
            <div className="h-[420px] flex items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg border-2 border-dashed border-muted-foreground/20">
              <p className="text-muted-foreground">Add Google Maps API key in <a href="/settings" className="text-teal-600 underline">Settings &rarr; Integrations</a></p>
            </div>
          ) : filteredPings.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg">
              <p className="text-muted-foreground">No GPS data for selected date range</p>
            </div>
          ) : (
            <GpsMapInner
              apiKey={apiKey}
              filteredPings={filteredPings}
              polylineGroups={polylineGroups}
              markers={markers}
              selectedPing={selectedPing}
              setSelectedPing={setSelectedPing}
              loadsByNum={loadsByNum}
            />
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>GPS Pings</CardTitle>
            {truncated && <span className="text-sm text-muted-foreground">Showing 200 of {filteredPings.length} pings</span>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recorded At</TableHead>
                  <TableHead>Load #</TableHead>
                  <TableHead>TMS Route</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No GPS history.</TableCell></TableRow>
                ) : tableRows.map(g => {
                  const rd = parseRawData(g.raw_data)
                  const loadNum = rd.load_number as string | null
                  const loc = rd.location_name as string | null
                  const status = rd.status as string | null
                  const load = loadNum ? loadsByNum.get(loadNum) : undefined
                  const route = load ? `${load.pickup_city ?? ''}, ${load.pickup_state ?? ''} → ${load.delivery_city ?? ''}, ${load.delivery_state ?? ''}` : '—'
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="text-sm">{fmtDateTime(g.recorded_at)}</TableCell>
                      <TableCell className="font-mono text-sm">{loadNum || '—'}</TableCell>
                      <TableCell className="text-sm">{route}</TableCell>
                      <TableCell className="text-sm">{loc || '—'}</TableCell>
                      <TableCell>{g.speed != null ? `${g.speed} mph` : '—'}</TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant={status === 'moving' ? 'default' : 'secondary'}
                            className={status === 'moving' ? 'bg-green-100 text-green-800' : ''}>
                            {status}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function GpsMapInner({
  apiKey, filteredPings, polylineGroups, markers, selectedPing, setSelectedPing, loadsByNum,
}: {
  apiKey: string
  filteredPings: GpsRecord[]
  polylineGroups: Map<string, { lat: number; lng: number }[]>
  markers: GpsRecord[]
  selectedPing: GpsRecord | null
  setSelectedPing: (g: GpsRecord | null) => void
  loadsByNum: Map<string, Load>
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    if (filteredPings.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      filteredPings.forEach(g => bounds.extend({ lat: g.latitude!, lng: g.longitude! }))
      map.fitBounds(bounds, 50)
    }
  }, [filteredPings])

  if (loadError) {
    return (
      <div className="h-[420px] flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-300">
        <p className="text-red-600 text-sm px-4 text-center">
          Map failed to load — check that Maps JavaScript API is enabled in Google Cloud Console and the key has no referrer restrictions blocking this domain
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-[420px] flex items-center justify-center bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg">
        <p className="text-muted-foreground">Loading Google Maps...</p>
      </div>
    )
  }

  const loadKeys = Array.from(polylineGroups.keys())

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '420px' }}
      center={{ lat: 33.0, lng: -80.0 }}
      zoom={6}
      onLoad={onMapLoad}
      options={{ mapTypeControl: true, streetViewControl: false, fullscreenControl: true }}
    >
      {/* Polylines per load */}
      {loadKeys.map((loadNum, i) => (
        <Polyline
          key={loadNum}
          path={polylineGroups.get(loadNum)!}
          options={{ strokeColor: POLYLINE_COLORS[i % POLYLINE_COLORS.length], strokeWeight: 3, strokeOpacity: 0.8 }}
        />
      ))}

      {/* Markers at named locations */}
      {markers.map(g => {
        const rd = parseRawData(g.raw_data)
        const locName = rd.location_name as string | null
        const color = markerColor(locName)
        return (
          <Marker
            key={g.id}
            position={{ lat: g.latitude!, lng: g.longitude! }}
            icon={{ url: markerUrl(color) }}
            onClick={() => setSelectedPing(g)}
          />
        )
      })}

      {/* InfoWindow */}
      {selectedPing && selectedPing.latitude != null && selectedPing.longitude != null && (
        <InfoWindow
          position={{ lat: selectedPing.latitude, lng: selectedPing.longitude }}
          onCloseClick={() => setSelectedPing(null)}
        >
          <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
            {(() => {
              const rd = parseRawData(selectedPing.raw_data)
              const locName = rd.location_name as string | null
              const loadNum = rd.load_number as string | null
              const status = rd.status as string | null
              const load = loadNum ? loadsByNum.get(loadNum) : undefined
              return (
                <>
                  {locName && <p style={{ fontWeight: 700, marginBottom: 4 }}>{locName}</p>}
                  <p>
                    <span style={{ color: '#666' }}>Load #:</span>{' '}
                    {loadNum || 'N/A'}
                    {load && <span> — {load.pickup_city}, {load.pickup_state} → {load.delivery_city}, {load.delivery_state}</span>}
                  </p>
                  <p><span style={{ color: '#666' }}>Date:</span> {fmtDateTime(selectedPing.recorded_at)}</p>
                  <p>
                    <span style={{ color: '#666' }}>Speed:</span> {selectedPing.speed != null ? `${selectedPing.speed} mph` : 'N/A'}
                    {status && (
                      <span style={{
                        display: 'inline-block', marginLeft: 8, padding: '1px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                        backgroundColor: status === 'moving' ? '#d1fae5' : '#f3f4f6',
                        color: status === 'moving' ? '#065f46' : '#374151',
                      }}>
                        {status}
                      </span>
                    )}
                  </p>
                </>
              )
            })()}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}

// ── Small helper component ──────────────────────────────────

function Field({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono font-medium' : 'font-medium'}>{value ?? 'N/A'}</dd>
    </div>
  )
}
