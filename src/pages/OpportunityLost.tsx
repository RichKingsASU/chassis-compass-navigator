import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  LabelList,
  Cell,
} from 'recharts'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  TrendingDown,
  DollarSign,
  Clock,
  Trophy,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { safeDate } from '@/lib/formatters'
import { exportToCSV } from '@/utils/exportUtils'

interface OpportunityRow {
  chassis_number: string
  chassis_type: string | null
  lessor: string | null
  region: string | null
  reporting_category: string | null
  days_idle: number | null
  idle_lease_cost: number | null
  lease_rate_per_day: number | null
  last_activity_date: string | null
  utilization_status: string | null
  acct_mgr_name: string | null
  container_number: string | null
  ld_num: string | null
}

interface TrendRow {
  report_date: string
  dormant_count: number
  daily_opportunity_cost: number
}

const fmtMoney = (v: number | null | undefined) =>
  v == null
    ? '—'
    : v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtMoneyShort = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const fmtShortDate = (v: string) => {
  const d = new Date(v)
  return isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function regionBadge(region: string | null) {
  if (!region) return <span className="text-muted-foreground">—</span>
  const map: Record<string, string> = {
    SW: 'bg-blue-600 hover:bg-blue-700 text-white',
    EC: 'bg-green-600 hover:bg-green-700 text-white',
    NW: 'bg-purple-600 hover:bg-purple-700 text-white',
    NE: 'bg-amber-600 hover:bg-amber-700 text-white',
  }
  return <Badge className={map[region] || ''}>{region}</Badge>
}

function statusBadge(status: string | null) {
  if (!status) return <span className="text-muted-foreground">—</span>
  if (status === 'DORMANT') return <Badge className="bg-red-600 hover:bg-red-700 text-white">DORMANT</Badge>
  if (status === 'IDLE') return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">IDLE</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function daysClass(days: number | null) {
  if (days == null) return ''
  if (days > 30) return 'text-red-600 font-bold'
  if (days > 14) return 'text-amber-600 font-semibold'
  if (days > 7) return 'text-yellow-600 font-medium'
  return 'text-green-600'
}

function lerpColor(t: number) {
  // #fca5a5 -> #dc2626
  const start = [252, 165, 165]
  const end = [220, 38, 38]
  const c = start.map((s, i) => Math.round(s + (end[i] - s) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

export default function OpportunityLost() {
  const [search, setSearch] = React.useState('')
  const [regionFilter, setRegionFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [daysFilter, setDaysFilter] = React.useState('all')
  const [lessorFilter, setLessorFilter] = React.useState('all')
  const [groupByAM, setGroupByAM] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'days_idle', desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const { data: dormantChassis = [] } = useQuery({
    queryKey: ['opportunity-lost-detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_opportunity_lost')
        .select('*')
        .order('days_idle', { ascending: false })
      if (error) throw error
      return (data ?? []) as OpportunityRow[]
    },
    refetchInterval: 5 * 60_000,
  })

  const { data: trendData = [] } = useQuery({
    queryKey: ['opportunity-lost-trend'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dormant_trend')
      if (error) throw error
      return (data ?? []) as TrendRow[]
    },
  })

  const filtered = React.useMemo(() => {
    return dormantChassis.filter((r) => {
      if (regionFilter !== 'all' && r.region !== regionFilter) return false
      if (statusFilter !== 'all' && r.utilization_status !== statusFilter) return false
      if (lessorFilter !== 'all' && r.lessor !== lessorFilter) return false
      if (daysFilter !== 'all') {
        const d = r.days_idle ?? 0
        if (daysFilter === '>7' && d <= 7) return false
        if (daysFilter === '>14' && d <= 14) return false
        if (daysFilter === '>30' && d <= 30) return false
      }
      if (search) {
        const s = search.toLowerCase()
        const c = r.chassis_number?.toLowerCase() ?? ''
        const a = r.acct_mgr_name?.toLowerCase() ?? ''
        if (!c.includes(s) && !a.includes(s)) return false
      }
      return true
    })
  }, [dormantChassis, search, regionFilter, statusFilter, daysFilter, lessorFilter])

  const dormantCount = filtered.length
  const dailyOppCost = filtered.reduce((s, r) => s + (r.lease_rate_per_day ?? 0), 0)
  const totalAccrued = filtered.reduce((s, r) => s + (r.idle_lease_cost ?? 0), 0)
  const avgDays =
    filtered.length > 0
      ? filtered.reduce((s, r) => s + (r.days_idle ?? 0), 0) / filtered.length
      : 0
  const worst = filtered.reduce<OpportunityRow | null>(
    (best, r) =>
      best == null || (r.days_idle ?? 0) > (best.days_idle ?? 0) ? r : best,
    null,
  )

  const dormantColor =
    dormantCount > 50 ? 'text-red-600' : dormantCount > 20 ? 'text-amber-500' : 'text-green-600'

  const lessors = React.useMemo(
    () =>
      Array.from(new Set(dormantChassis.map((r) => r.lessor).filter(Boolean))) as string[],
    [dormantChassis],
  )

  const amCostData = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of filtered) {
      const key = r.acct_mgr_name || 'Unassigned'
      map.set(key, (map.get(key) || 0) + (r.idle_lease_cost ?? 0))
    }
    const arr = Array.from(map.entries())
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
    const max = arr[0]?.cost || 1
    return arr.map((d) => ({ ...d, color: lerpColor(d.cost / max) }))
  }, [filtered])

  const trendChartData = React.useMemo(
    () =>
      trendData.map((t) => ({
        ...t,
        date: fmtShortDate(t.report_date),
      })),
    [trendData],
  )

  const columns = React.useMemo<ColumnDef<OpportunityRow>[]>(
    () => [
      {
        accessorKey: 'chassis_number',
        header: 'Chassis #',
        cell: ({ row }) => (
          <div className="font-mono font-bold">{row.getValue('chassis_number')}</div>
        ),
      },
      {
        accessorKey: 'chassis_type',
        header: 'Type',
        cell: ({ row }) => row.getValue('chassis_type') || '—',
      },
      {
        accessorKey: 'lessor',
        header: 'Lessor',
        cell: ({ row }) => row.getValue('lessor') || '—',
      },
      {
        accessorKey: 'region',
        header: 'Region',
        cell: ({ row }) => regionBadge(row.getValue('region') as string | null),
      },
      {
        accessorKey: 'acct_mgr_name',
        header: 'Account Manager',
        cell: ({ row }) => row.getValue('acct_mgr_name') || '—',
      },
      {
        accessorKey: 'days_idle',
        header: 'Days Dormant',
        cell: ({ row }) => {
          const v = row.getValue('days_idle') as number | null
          return <span className={daysClass(v)}>{v ?? '—'}</span>
        },
      },
      {
        accessorKey: 'lease_rate_per_day',
        header: 'Daily Rate',
        cell: ({ row }) => {
          const v = row.getValue('lease_rate_per_day') as number | null
          return v == null ? '—' : `${fmtMoney(v)}/day`
        },
      },
      {
        accessorKey: 'idle_lease_cost',
        header: 'Accrued Cost',
        cell: ({ row }) => (
          <span className="font-bold text-red-600">
            {fmtMoney(row.getValue('idle_lease_cost') as number | null)}
          </span>
        ),
      },
      {
        accessorKey: 'last_activity_date',
        header: 'Last Activity',
        cell: ({ row }) => safeDate(row.getValue('last_activity_date')),
      },
      {
        accessorKey: 'container_number',
        header: 'Last Container',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue('container_number') || '—'}</span>
        ),
      },
      {
        accessorKey: 'ld_num',
        header: 'Last Load',
        cell: ({ row }) => {
          const v = row.getValue('ld_num') as string | null
          return v ? <span className="text-blue-600 underline">{v}</span> : '—'
        },
      },
      {
        accessorKey: 'utilization_status',
        header: 'Status',
        cell: ({ row }) => statusBadge(row.getValue('utilization_status') as string | null),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const groupedRows = React.useMemo(() => {
    if (!groupByAM) return null
    const sortedRows = table.getSortedRowModel().rows
    const groups = new Map<string, OpportunityRow[]>()
    for (const row of sortedRows) {
      const key = row.original.acct_mgr_name || 'Unassigned'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row.original)
    }
    return Array.from(groups.entries())
      .map(([name, rows]) => ({
        name,
        rows,
        count: rows.length,
        total: rows.reduce((s, r) => s + (r.idle_lease_cost ?? 0), 0),
      }))
      .sort((a, b) => b.total - a.total)
  }, [groupByAM, table, sorting, filtered])

  const handleExport = () => {
    exportToCSV(
      filtered,
      `Opportunity_Lost_${new Date().toISOString().split('T')[0]}`,
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunity Lost</h1>
          <p className="text-muted-foreground">
            MCL chassis not on active Forrest loads — daily lease cost accruing
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dormant Chassis Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${dormantColor}`}>{dormantCount}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <AlertTriangle className="h-3 w-3 mr-1" /> Active MCL units idle/dormant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Opportunity Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{fmtMoney(dailyOppCost)}/day</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <DollarSign className="h-3 w-3 mr-1" /> Lease cost burning per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Accrued Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{fmtMoney(totalAccrued)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" /> Cumulative idle cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Days Dormant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgDays.toFixed(1)} days</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1" /> Across filtered fleet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Worst Offender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {worst?.chassis_number || '—'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Trophy className="h-3 w-3 mr-1" />
              {worst ? `${worst.days_idle ?? 0} days dormant` : 'No dormant chassis'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dormant Chassis & Revenue Opportunity Lost (Last 30 Days)</CardTitle>
            <CardDescription>Trend of dormant count and daily cost</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendChartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v: number) => fmtMoneyShort(v)}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const key = String(name ?? '')
                    if (key === 'daily_opportunity_cost')
                      return [fmtMoney(Number(value)), 'Daily Cost']
                    if (key === 'dormant_count') return [value, 'Dormant Count']
                    return [value, key]
                  }}
                />
                <Legend />
                <ReferenceLine
                  y={50}
                  yAxisId="left"
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: 'Alert threshold', position: 'insideTopRight', fill: '#f59e0b', fontSize: 11 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="dormant_count"
                  name="Dormant Count"
                  fill="#94a3b8"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="daily_opportunity_cost"
                  name="Daily Cost"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accrued Cost by Account Manager</CardTitle>
            <CardDescription>Top 10 AMs by total dormant cost</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {amCostData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={amCostData}
                  layout="vertical"
                  margin={{ top: 5, right: 70, bottom: 5, left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => fmtMoneyShort(v)} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip
                    formatter={(value: any) => [fmtMoney(Number(value)), 'Accrued Cost']}
                  />
                  <Bar dataKey="cost">
                    {amCostData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                    <LabelList
                      dataKey="cost"
                      position="right"
                      formatter={(v: any) => fmtMoneyShort(Number(v))}
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Dormant Chassis Detail</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mr-2">
                  {filtered.length} of {dormantChassis.length} chassis
                </Badge>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search chassis or AM…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="SW">SW</SelectItem>
                  <SelectItem value="EC">EC</SelectItem>
                  <SelectItem value="NW">NW</SelectItem>
                  <SelectItem value="NE">NE</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DORMANT">DORMANT</SelectItem>
                  <SelectItem value="IDLE">IDLE</SelectItem>
                </SelectContent>
              </Select>
              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  <SelectItem value=">7">&gt; 7 days</SelectItem>
                  <SelectItem value=">14">&gt; 14 days</SelectItem>
                  <SelectItem value=">30">&gt; 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={lessorFilter} onValueChange={setLessorFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Lessor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lessors</SelectItem>
                  {lessors.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-2">
                <Switch
                  id="group-by-am"
                  checked={groupByAM}
                  onCheckedChange={setGroupByAM}
                />
                <label htmlFor="group-by-am" className="text-sm">Group by AM</label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-3" />
              <p className="text-lg font-medium">No dormant chassis found</p>
              <p className="text-sm text-muted-foreground">All MCL chassis are active.</p>
            </div>
          ) : (
            <div className="rounded-md border max-h-[700px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className="cursor-pointer select-none whitespace-nowrap"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' ▲',
                            desc: ' ▼',
                          }[header.column.getIsSorted() as string] ?? null}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {groupByAM && groupedRows
                    ? groupedRows.map((g) => (
                        <React.Fragment key={g.name}>
                          <TableRow className="bg-muted/60 font-semibold">
                            <TableCell colSpan={columns.length}>
                              {g.name} — {g.count} chassis · Total accrued{' '}
                              <span className="text-red-600">{fmtMoney(g.total)}</span>
                            </TableCell>
                          </TableRow>
                          {g.rows.map((r) => (
                            <TableRow
                              key={r.chassis_number}
                              className="odd:bg-background even:bg-muted/20 hover:bg-muted/50"
                            >
                              {columns.map((col) => {
                                const key = (col as any).accessorKey as keyof OpportunityRow
                                const value = r[key]
                                const cellRenderer = (col as any).cell
                                return (
                                  <TableCell key={String(key)}>
                                    {cellRenderer
                                      ? cellRenderer({
                                          row: { getValue: (k: string) => r[k as keyof OpportunityRow], original: r },
                                        } as any)
                                      : (value as any) ?? '—'}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))
                    : table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="odd:bg-background even:bg-muted/20 hover:bg-muted/50"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
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
