import * as React from 'react'
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
import { Truck, Warehouse, Clock, DollarSign, Wrench, Inbox } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { EmptyState } from '@/components/shared/EmptyState'
import ChassisDetailDrawer from '@/components/chassis/ChassisDetailDrawer'

interface MclChassisRow {
  chassis_number: string
  lessor: string | null
  chassis_type: string | null
  chassis_status: string | null
  region: string | null
  gps_provider: string | null
  lease_rate_per_day: number | null
  on_hire_date: string | null
  contract_end_date: string | null
  reporting_category: string | null
}

const COLORS = [
  'hsl(var(--primary))',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Unknown</Badge>
  const upper = status.toUpperCase()
  if (upper === 'ACTIVE')
    return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20">ACTIVE</Badge>
  if (upper === 'OFFHIRED' || upper === 'OFF-HIRED')
    return <Badge variant="secondary">OFFHIRED</Badge>
  if (upper === 'STOLEN') return <Badge variant="destructive">STOLEN</Badge>
  return <Badge variant="outline">{upper}</Badge>
}

export default function FleetOverview() {
  const [search, setSearch] = React.useState('')
  const [lessorFilter, setLessorFilter] = React.useState<string>('all')
  const [regionFilter, setRegionFilter] = React.useState<string>('all')
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedChassis, setSelectedChassis] = React.useState<string | null>(null)

  const { data: chassisRows, isLoading } = useQuery<MclChassisRow[]>({
    queryKey: ['mcl_chassis', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mcl_chassis').select('*')
      if (error) throw error
      return (data ?? []) as MclChassisRow[]
    },
  })

  const { data: yardEmptyCount } = useQuery<number>({
    queryKey: ['yard_inventory', 'empty_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('yard_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'EMPTY')
        .is('actual_exit_at', null)
      if (error) throw error
      return count ?? 0
    },
  })

  const { data: idleCount } = useQuery<number>({
    queryKey: ['v_chassis_gps_mcl', 'idle_gt_7'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('v_chassis_gps_mcl')
        .select('chassis_number', { count: 'exact', head: true })
        .gt('dormant_days', 7)
      if (error) throw error
      return count ?? 0
    },
  })

  const { data: repairTotal } = useQuery<number>({
    queryKey: ['chassis_repairs', 'total_cost'],
    queryFn: async () => {
      const { data, error } = await supabase.from('chassis_repairs').select('cost')
      if (error) throw error
      return (data ?? []).reduce((s: number, r: { cost: number | null }) => s + (r.cost || 0), 0)
    },
  })

  const activeChassis = React.useMemo(
    () => (chassisRows ?? []).filter((c) => (c.chassis_status || '').toUpperCase() === 'ACTIVE'),
    [chassisRows]
  )

  const totalActive = activeChassis.length
  const dailyBurn = activeChassis.reduce((s, c) => s + (c.lease_rate_per_day || 0), 0)

  const lessorChartData = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of activeChassis) {
      const k = c.lessor || 'Unknown'
      map[k] = (map[k] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [activeChassis])

  const regionChartData = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of activeChassis) {
      const k = c.region || 'Unknown'
      map[k] = (map[k] || 0) + 1
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [activeChassis])

  const lessorOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of activeChassis) if (c.lessor) set.add(c.lessor)
    return Array.from(set).sort()
  }, [activeChassis])

  const regionOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of activeChassis) if (c.region) set.add(c.region)
    return Array.from(set).sort()
  }, [activeChassis])

  const filtered = React.useMemo(() => {
    return activeChassis.filter((c) => {
      if (search && !c.chassis_number.toLowerCase().includes(search.toLowerCase())) return false
      if (lessorFilter !== 'all' && c.lessor !== lessorFilter) return false
      if (regionFilter !== 'all' && c.region !== regionFilter) return false
      return true
    })
  }, [activeChassis, search, lessorFilter, regionFilter])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fleet Overview</h1>
        <p className="text-muted-foreground">
          Active chassis fleet metrics and breakdowns by lessor and region.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" /> Total Active Chassis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Warehouse className="h-4 w-4" /> Available at Yard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(yardEmptyCount ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Idle &gt; 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {(idleCount ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Daily Lease Burn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(dailyBurn)}/day</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Total Repair Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(repairTotal ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chassis by Lessor</CardTitle>
            <CardDescription>Active chassis distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {lessorChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No active chassis data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lessorChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {lessorChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <CardTitle>Chassis by Region</CardTitle>
            <CardDescription>Active chassis count per region</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {regionChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No active chassis data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Active Chassis</CardTitle>
              <CardDescription>Detailed view of active fleet</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search chassis #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px]"
              />
              <Select value={lessorFilter} onValueChange={setLessorFilter}>
                <SelectTrigger className="w-[160px]">
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
                <SelectTrigger className="w-[160px]">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No chassis found"
              description="No active chassis match the current filters."
            />
          ) : (
            <div className="overflow-auto max-h-[60vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Lessor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>GPS Provider</TableHead>
                    <TableHead className="text-right">Daily Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.chassis_number}>
                      <TableCell>
                        <button
                          className="font-mono font-medium text-primary hover:underline"
                          onClick={() => {
                            setSelectedChassis(c.chassis_number)
                            setDrawerOpen(true)
                          }}
                        >
                          {c.chassis_number}
                        </button>
                      </TableCell>
                      <TableCell>{c.lessor || '—'}</TableCell>
                      <TableCell>{c.chassis_type || '—'}</TableCell>
                      <TableCell>{c.region || '—'}</TableCell>
                      <TableCell>{c.gps_provider || '—'}</TableCell>
                      <TableCell className="text-right">
                        {c.lease_rate_per_day != null ? formatMoney(c.lease_rate_per_day) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.chassis_status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ChassisDetailDrawer
        chassisNumber={selectedChassis}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
