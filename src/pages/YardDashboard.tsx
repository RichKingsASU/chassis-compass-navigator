import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
} from 'recharts'
import { Warehouse, BarChart3, Activity } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DirectionBadge } from '@/features/yard/statusBadge'
import { formatDate } from '@/utils/dateUtils'

interface YardRow {
  id: string
  name: string
  short_code: string
  capacity: number
}

interface InvRow {
  id: string
  yard_id: string
  status: string | null
  date_in: string | null
  actual_exit_at: string | null
}

interface JedEvent {
  id: number
  event_date: string | null
  event_time: string | null
  direction: string | null
  chassis_number_clean: string | null
  container_number: string | null
  driver_name: string | null
  carrier: string | null
}

interface YardEventsRow {
  id: number
  chassis_number: string | null
  container_number: string | null
  yard: string | null
  event_type: string | null
  event_date: string | null
  gate_in: string | null
  gate_out: string | null
}

export default function YardDashboard() {
  const { data: yards, isLoading: yardsLoading } = useQuery({
    queryKey: ['yards_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yards')
        .select('id, name, short_code, capacity')
        .order('name')
      if (error) throw error
      return (data ?? []) as YardRow[]
    },
  })

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['yard_inventory', 'dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('id, yard_id, status, date_in, actual_exit_at')
      if (error) throw error
      return (data ?? []) as InvRow[]
    },
  })

  const { data: jedEvents } = useQuery({
    queryKey: ['jed_events_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jed_yard_events')
        .select(
          'id, event_date, event_time, direction, chassis_number_clean, container_number, driver_name, carrier'
        )
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as JedEvent[]
    },
  })

  const { data: yardEvents } = useQuery({
    queryKey: ['yard_events_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_events_data')
        .select(
          'id, chassis_number, container_number, yard, event_type, event_date, gate_in, gate_out'
        )
        .order('event_date', { ascending: false })
        .limit(200)
      if (error) {
        console.warn('yard_events_data unavailable', error.message)
        return [] as YardEventsRow[]
      }
      return (data ?? []) as YardEventsRow[]
    },
  })

  const activeRows = useMemo(
    () => (inventory ?? []).filter((r) => !r.actual_exit_at),
    [inventory]
  )

  const kpis = useMemo(() => {
    const total = activeRows.length
    const empty = activeRows.filter((r) => (r.status ?? '').toUpperCase() === 'EMPTY').length
    const occupied = activeRows.filter((r) =>
      ['LOADED', 'SHOP'].includes((r.status ?? '').toUpperCase())
    ).length
    const totalCap = (yards ?? []).reduce((s, y) => s + (y.capacity || 0), 0)
    const utilPct = totalCap > 0 ? Math.round((total / totalCap) * 100) : 0
    const days = activeRows
      .map((r) => {
        if (!r.date_in) return null
        try {
          return differenceInCalendarDays(new Date(), parseISO(r.date_in))
        } catch {
          return null
        }
      })
      .filter((v): v is number => v != null)
    const avgDays = days.length ? Math.round(days.reduce((s, n) => s + n, 0) / days.length) : 0
    return { total, empty, occupied, utilPct, avgDays }
  }, [activeRows, yards])

  const stackedYardData = useMemo(() => {
    return (yards ?? []).map((y) => {
      const rows = activeRows.filter((r) => r.yard_id === y.id)
      const empty = rows.filter((r) => (r.status ?? '').toUpperCase() === 'EMPTY').length
      const loaded = rows.filter((r) => (r.status ?? '').toUpperCase() === 'LOADED').length
      const shop = rows.filter((r) => (r.status ?? '').toUpperCase() === 'SHOP').length
      return { yard: y.name, EMPTY: empty, LOADED: loaded, SHOP: shop }
    })
  }, [yards, activeRows])

  const activityData = useMemo(() => {
    const cutoff = subDays(new Date(), 30)
    const buckets = new Map<string, { date: string; IN: number; OUT: number }>()
    for (let i = 29; i >= 0; i -= 1) {
      const d = subDays(new Date(), i)
      const key = format(d, 'yyyy-MM-dd')
      buckets.set(key, { date: format(d, 'MMM d'), IN: 0, OUT: 0 })
    }
    ;(jedEvents ?? []).forEach((e) => {
      if (!e.event_date) return
      try {
        const d = parseISO(e.event_date)
        if (d < cutoff) return
        const key = format(d, 'yyyy-MM-dd')
        const b = buckets.get(key)
        if (!b) return
        const dir = (e.direction ?? '').toUpperCase()
        if (dir === 'IN' || dir === 'INBOUND') b.IN += 1
        if (dir === 'OUT' || dir === 'OUTBOUND') b.OUT += 1
      } catch {
        /* skip */
      }
    })
    ;(yardEvents ?? []).forEach((e) => {
      if (!e.event_date) return
      try {
        const d = parseISO(e.event_date)
        if (d < cutoff) return
        const key = format(d, 'yyyy-MM-dd')
        const b = buckets.get(key)
        if (!b) return
        if (e.gate_in) b.IN += 1
        if (e.gate_out) b.OUT += 1
      } catch {
        /* skip */
      }
    })
    return Array.from(buckets.values())
  }, [jedEvents, yardEvents])

  const recentEvents = useMemo(() => (jedEvents ?? []).slice(0, 20), [jedEvents])

  const isLoading = yardsLoading || invLoading

  const kpiCards = [
    { label: 'Total Chassis (All Yards)', value: kpis.total, icon: Warehouse },
    { label: 'Available (EMPTY)', value: kpis.empty, icon: Warehouse },
    { label: 'Occupied (LOADED+SHOP)', value: kpis.occupied, icon: Warehouse },
    { label: 'Capacity Utilization', value: `${kpis.utilPct}%`, icon: BarChart3 },
    { label: 'Avg Days in Yard', value: kpis.avgDays, icon: Activity },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Warehouse className="h-7 w-7" />
        <div>
          <h1 className="text-3xl font-bold">Yard Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Executive summary across every operating yard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <k.icon className="h-3.5 w-3.5" />
                {k.label}
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{k.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory by Yard</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : stackedYardData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No yards configured</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stackedYardData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="yard" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="EMPTY" stackId="a" fill="#10b981" />
                    <Bar dataKey="LOADED" stackId="a" fill="#2563eb" />
                    <Bar dataKey="SHOP" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inbound vs Outbound (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {activityData.every((d) => d.IN === 0 && d.OUT === 0) ? (
                <p className="text-sm text-muted-foreground">
                  No gate activity in the last 30 days
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="IN" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="OUT" stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">
                No recent gate events
              </p>
            ) : (
              <ul className="divide-y max-h-[560px] overflow-auto">
                {recentEvents.map((e) => (
                  <li key={e.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <DirectionBadge direction={e.direction} />
                      <span className="font-mono">
                        {e.chassis_number_clean ?? '—'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(e.event_date)} · {e.event_time ?? ''}
                    </div>
                    <div className="text-xs">
                      {e.container_number ? `📦 ${e.container_number}` : ''}{' '}
                      {e.driver_name ? `· ${e.driver_name}` : ''}{' '}
                      {e.carrier ? `· ${e.carrier}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
