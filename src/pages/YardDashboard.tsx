import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { Warehouse, Package, Wrench, Clock, Inbox } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'

interface YardInventoryItem {
  id: string
  yard_id: string
  status: string | null
  created_at: string | null
  actual_exit_at: string | null
  yards?:
    | { id: string; name: string; short_code: string | null }
    | { id: string; name: string; short_code: string | null }[]
    | null
}

function firstYard(
  y: YardInventoryItem['yards']
): { id: string; name: string; short_code: string | null } | null {
  if (!y) return null
  if (Array.isArray(y)) return y[0] ?? null
  return y
}

interface JedYardEvent {
  chassis_number_clean: string | null
  direction: string | null
  event_date: string | null
  event_time: string | null
  container_number: string | null
  driver_name: string | null
  carrier: string | null
  match_confidence: string | null
  tms_customer: string | null
  tms_ld_num: string | null
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DirectionBadge({ dir }: { dir: string | null }) {
  const d = (dir || '').toUpperCase()
  if (d === 'IN' || d === 'INBOUND')
    return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20">IN</Badge>
  if (d === 'OUT' || d === 'OUTBOUND')
    return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">OUT</Badge>
  return <Badge variant="outline">{d || '—'}</Badge>
}

function MatchBadge({ conf }: { conf: string | null }) {
  const c = (conf || '').toUpperCase()
  if (c === 'HIGH' || c === 'EXACT')
    return <Badge className="bg-green-500/15 text-green-700">{c}</Badge>
  if (c === 'MEDIUM' || c === 'PARTIAL')
    return <Badge className="bg-amber-500/15 text-amber-700">{c}</Badge>
  if (c === 'LOW' || c === 'NONE') return <Badge variant="outline">{c}</Badge>
  return c ? <Badge variant="outline">{c}</Badge> : <span className="text-muted-foreground">—</span>
}

export default function YardDashboard() {
  const { data: inventory, isLoading } = useQuery<YardInventoryItem[]>({
    queryKey: ['yard_inventory', 'dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('id, yard_id, status, created_at, actual_exit_at, yards:yard_id(id, name, short_code)')
        .is('actual_exit_at', null)
      if (error) throw error
      return (data ?? []) as YardInventoryItem[]
    },
  })

  const { data: gateEvents } = useQuery<JedYardEvent[]>({
    queryKey: ['jed_yard_events', 'last_30'],
    queryFn: async () => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data, error } = await supabase
        .from('jed_yard_events')
        .select('*')
        .gte('event_date', since.toISOString().slice(0, 10))
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false })
      if (error) throw error
      return (data ?? []) as JedYardEvent[]
    },
  })

  const total = (inventory ?? []).length
  const empty = (inventory ?? []).filter((i) => (i.status || '').toUpperCase() === 'EMPTY').length
  const loaded = (inventory ?? []).filter((i) => (i.status || '').toUpperCase() === 'LOADED').length
  const shop = (inventory ?? []).filter((i) => (i.status || '').toUpperCase() === 'SHOP').length
  const avgDays = React.useMemo(() => {
    const items = inventory ?? []
    if (items.length === 0) return 0
    const now = Date.now()
    const total = items.reduce((s, i) => {
      if (!i.created_at) return s
      const ms = now - new Date(i.created_at).getTime()
      return s + ms / (1000 * 60 * 60 * 24)
    }, 0)
    return total / items.length
  }, [inventory])

  const stackByYard = React.useMemo(() => {
    const map: Record<string, { name: string; EMPTY: number; LOADED: number; SHOP: number }> = {}
    for (const i of inventory ?? []) {
      const yardRel = firstYard(i.yards)
      const name = yardRel?.name || 'Unknown'
      if (!map[name]) map[name] = { name, EMPTY: 0, LOADED: 0, SHOP: 0 }
      const s = (i.status || '').toUpperCase()
      if (s === 'EMPTY' || s === 'LOADED' || s === 'SHOP') {
        map[name][s] += 1
      }
    }
    return Object.values(map)
  }, [inventory])

  const inOutByDay = React.useMemo(() => {
    const map: Record<string, { date: string; IN: number; OUT: number }> = {}
    for (const e of gateEvents ?? []) {
      if (!e.event_date) continue
      const date = e.event_date.slice(0, 10)
      if (!map[date]) map[date] = { date, IN: 0, OUT: 0 }
      const d = (e.direction || '').toUpperCase()
      if (d === 'IN' || d === 'INBOUND') map[date].IN += 1
      else if (d === 'OUT' || d === 'OUTBOUND') map[date].OUT += 1
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  }, [gateEvents])

  const recentEvents = (gateEvents ?? []).slice(0, 30)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Yard Dashboard</h1>
        <p className="text-muted-foreground">Live yard utilization and gate activity</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Warehouse className="h-4 w-4" /> Total in Yards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available (EMPTY)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{empty}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> In Use (LOADED)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loaded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" /> In Shop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{shop}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Avg Days in Yard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDays.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Yard</CardTitle>
            <CardDescription>EMPTY / LOADED / SHOP per yard</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stackByYard.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No inventory data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackByYard}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="EMPTY" stackId="a" fill="#10b981" />
                  <Bar dataKey="LOADED" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="SHOP" stackId="a" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inbound vs Outbound (Last 30 Days)</CardTitle>
            <CardDescription>Gate events from JED yard</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {inOutByDay.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No gate events
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inOutByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="IN" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="OUT" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 30 gate events from JED yard</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : recentEvents.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No recent gate events"
              description="No gate events recorded in the past 30 days."
            />
          ) : (
            <div className="overflow-auto max-h-[60vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>TMS Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((e, idx) => (
                    <TableRow key={`${e.chassis_number_clean}-${e.event_date}-${e.event_time}-${idx}`}>
                      <TableCell>{formatDate(e.event_date)}</TableCell>
                      <TableCell>{e.event_time || '—'}</TableCell>
                      <TableCell>
                        <DirectionBadge dir={e.direction} />
                      </TableCell>
                      <TableCell className="font-mono">{e.chassis_number_clean || '—'}</TableCell>
                      <TableCell>{e.container_number || '—'}</TableCell>
                      <TableCell>{e.driver_name || '—'}</TableCell>
                      <TableCell>{e.carrier || '—'}</TableCell>
                      <TableCell>
                        <MatchBadge conf={e.match_confidence} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
