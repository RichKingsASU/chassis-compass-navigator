import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Truck, Warehouse, Package, Clock, DollarSign, Search } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ChassisStatusBadge } from '@/features/yard/statusBadge'
import ChassisDetailDrawer from '@/components/chassis/ChassisDetailDrawer'
import { formatDateTime, formatCurrency } from '@/utils/dateUtils'

interface MclChassisRow {
  chassis_number: string
  chassis_type: string | null
  lessor: string | null
  region: string | null
  gps_provider: string | null
  chassis_status: string | null
  current_rate_per_day: number | null
}

interface GpsRow {
  chassis_number: string | null
  last_updated: string | null
  landmark: string | null
  address: string | null
  dormant_days: number | null
}

interface MgRow {
  chassis_number: string | null
  status: string | null
}

interface YardInvRow {
  chassis_number: string | null
  status: string | null
  actual_exit_at: string | null
}

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#9333ea', '#0891b2', '#ea580c', '#65a30d']

export default function FleetOverview() {
  const [search, setSearch] = useState('')
  const [lessorFilter, setLessorFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedChassis, setSelectedChassis] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['fleet_overview'],
    queryFn: async () => {
      const [mclRes, gpsRes, mgRes, yardRes] = await Promise.all([
        supabase.from('mcl_chassis').select(
          'chassis_number, chassis_type, lessor, region, gps_provider, chassis_status, current_rate_per_day'
        ),
        supabase.from('v_chassis_gps_unified').select(
          'chassis_number, last_updated, landmark, address, dormant_days'
        ),
        supabase.from('mg_data').select('chassis_number, status'),
        supabase.from('yard_inventory').select('chassis_number, status, actual_exit_at'),
      ])

      const mcl: MclChassisRow[] = (mclRes.data as MclChassisRow[] | null) ?? []
      const gps: GpsRow[] = (gpsRes.data as GpsRow[] | null) ?? []
      const mg: MgRow[] = (mgRes.data as MgRow[] | null) ?? []
      const yard: YardInvRow[] = (yardRes.data as YardInvRow[] | null) ?? []

      const gpsByChassis = new Map<string, GpsRow>()
      gps.forEach((g) => {
        if (g.chassis_number) gpsByChassis.set(g.chassis_number.trim(), g)
      })

      return { mcl, gpsByChassis, mg, yard }
    },
  })

  const mcl = data?.mcl ?? []
  const gpsByChassis = data?.gpsByChassis ?? new Map<string, GpsRow>()
  const mg = data?.mg ?? []
  const yard = data?.yard ?? []

  const activeChassis = useMemo(
    () => mcl.filter((c) => (c.chassis_status ?? '').toUpperCase() === 'ACTIVE'),
    [mcl]
  )

  const kpis = useMemo(() => {
    const totalActive = activeChassis.length

    const availableAtYard = yard.filter(
      (y) => (y.status ?? '').toUpperCase() === 'EMPTY' && !y.actual_exit_at
    ).length

    const activeMgChassis = new Set(
      mg
        .filter((m) => {
          const s = (m.status ?? '').toLowerCase()
          return s !== 'delivered' && s !== 'cancelled' && m.chassis_number
        })
        .map((m) => (m.chassis_number ?? '').trim())
    )
    const onActiveLoad = activeChassis.filter((c) =>
      activeMgChassis.has(c.chassis_number.trim())
    ).length

    let idleOver7 = 0
    activeChassis.forEach((c) => {
      const g = gpsByChassis.get(c.chassis_number.trim())
      if (g && (g.dormant_days ?? 0) > 7) idleOver7 += 1
    })

    const dailyBurn = activeChassis.reduce(
      (sum, c) => sum + (Number(c.current_rate_per_day) || 0),
      0
    )

    return { totalActive, availableAtYard, onActiveLoad, idleOver7, dailyBurn }
  }, [activeChassis, yard, mg, gpsByChassis])

  const lessorData = useMemo(() => {
    const counts = new Map<string, number>()
    activeChassis.forEach((c) => {
      const key = c.lessor || 'Unknown'
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    return Array.from(counts, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    )
  }, [activeChassis])

  const regionData = useMemo(() => {
    const counts = new Map<string, number>()
    activeChassis.forEach((c) => {
      const key = c.region || 'Unknown'
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    return Array.from(counts, ([region, count]) => ({ region, count })).sort(
      (a, b) => b.count - a.count
    )
  }, [activeChassis])

  const lessorOptions = useMemo(
    () => Array.from(new Set(mcl.map((c) => c.lessor).filter((v): v is string => !!v))).sort(),
    [mcl]
  )
  const regionOptions = useMemo(
    () => Array.from(new Set(mcl.map((c) => c.region).filter((v): v is string => !!v))).sort(),
    [mcl]
  )
  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(mcl.map((c) => (c.chassis_status ?? '').toUpperCase()).filter((v) => v))
      ).sort(),
    [mcl]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mcl.filter((c) => {
      if (q && !c.chassis_number.toLowerCase().includes(q)) return false
      if (lessorFilter !== 'all' && c.lessor !== lessorFilter) return false
      if (regionFilter !== 'all' && c.region !== regionFilter) return false
      if (
        statusFilter !== 'all' &&
        (c.chassis_status ?? '').toUpperCase() !== statusFilter
      )
        return false
      return true
    })
  }, [mcl, search, lessorFilter, regionFilter, statusFilter])

  const handleRowClick = (chassisNumber: string) => {
    setSelectedChassis(chassisNumber)
    setDrawerOpen(true)
  }

  const kpiCards = [
    { label: 'Total MCL Chassis', value: kpis.totalActive.toLocaleString(), icon: Truck },
    { label: 'Available at Yard', value: kpis.availableAtYard.toLocaleString(), icon: Warehouse },
    { label: 'On Active Load', value: kpis.onActiveLoad.toLocaleString(), icon: Package },
    { label: 'Idle >7 Days', value: kpis.idleOver7.toLocaleString(), icon: Clock },
    {
      label: 'Daily Lease Burn',
      value: formatCurrency(kpis.dailyBurn),
      icon: DollarSign,
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Truck className="h-7 w-7" />
        <div>
          <h1 className="text-3xl font-bold">Fleet Overview</h1>
          <p className="text-muted-foreground mt-2">
            Real-time view of every active chassis in the MCL fleet
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
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{k.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chassis by Lessor</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : lessorData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active chassis</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={lessorData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    label={(entry: { name?: string; value?: number }) =>
                      `${entry.name ?? ''} (${entry.value ?? 0})`
                    }
                  >
                    {lessorData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chassis by Region</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : regionData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active chassis</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">Active Fleet</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chassis #"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={lessorFilter} onValueChange={setLessorFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Lessor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lessors</SelectItem>
                  {lessorOptions.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regionOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="No chassis found"
              description="Try adjusting your filters or search query"
            />
          ) : (
            <div className="rounded-md border max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Lessor</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>GPS Provider</TableHead>
                    <TableHead>Last GPS Ping</TableHead>
                    <TableHead>Current Location</TableHead>
                    <TableHead className="text-right">Days Dormant</TableHead>
                    <TableHead className="text-right">Daily Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((c) => {
                    const g = gpsByChassis.get(c.chassis_number.trim())
                    return (
                      <TableRow
                        key={c.chassis_number}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(c.chassis_number)}
                      >
                        <TableCell className="font-mono font-medium">
                          {c.chassis_number}
                        </TableCell>
                        <TableCell>{c.chassis_type ?? '—'}</TableCell>
                        <TableCell>{c.lessor ?? '—'}</TableCell>
                        <TableCell>{c.region ?? '—'}</TableCell>
                        <TableCell>{c.gps_provider ?? '—'}</TableCell>
                        <TableCell>{formatDateTime(g?.last_updated ?? null)}</TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {g?.landmark || g?.address || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {g?.dormant_days ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.current_rate_per_day != null
                            ? formatCurrency(c.current_rate_per_day)
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <ChassisStatusBadge status={c.chassis_status} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ChassisDetailDrawer
        chassisNumber={selectedChassis}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedChassis(null)
        }}
      />
    </div>
  )
}
