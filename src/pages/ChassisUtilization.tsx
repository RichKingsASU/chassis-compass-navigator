import { useMemo, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeAmount, safeDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Settings2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'

interface UtilizationRow {
  chassis_number: string
  lessor: string | null
  chassis_type: string | null
  chassis_status: string | null
  chassis_category: string | null
  region: string | null
  gps_provider: string | null
  lease_rate_per_day: number | null
  on_hire_date: string | null
  off_hire_date: string | null
  contract_end_date: string | null
  total_loads: number | null
  completed_loads: number | null
  first_load_date: string | null
  last_activity_date: string | null
  days_idle: number | null
  total_revenue: number | null
  total_invoiced: number | null
  total_carrier_cost: number | null
  gross_margin: number | null
  unbilled_load_count: number | null
  unbilled_revenue: number | null
  idle_lease_cost: number | null
  utilization_status: string | null
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'IDLE' | 'DORMANT'

const FORREST_STATUS_OPTIONS = [
  'Active',
  'Reserved',
  'Available',
  'Out of Service',
  'Under Repair',
  'Returned',
  'Off-Hired',
  'Inactive',
]

function isForrestRow(d: UtilizationRow): boolean {
  return d.lessor === 'Forrest' || (d.chassis_number?.startsWith('FRQZ') ?? false)
}

function renderForrestStatusBadge(status: string | null | undefined) {
  if (!status) return <span className="text-muted-foreground">—</span>
  switch (status) {
    case 'Active':
      return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
    case 'Reserved':
      return <Badge className="bg-blue-600 hover:bg-blue-700">Reserved</Badge>
    case 'Available':
      return <Badge className="bg-teal-600 hover:bg-teal-700">Available</Badge>
    case 'Out of Service':
      return <Badge className="bg-orange-600 hover:bg-orange-700">Out of Service</Badge>
    case 'Under Repair':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Under Repair</Badge>
    case 'Returned':
      return <Badge variant="secondary">Returned</Badge>
    case 'Off-Hired':
      return <Badge variant="outline">Off-Hired</Badge>
    case 'Inactive':
      return <Badge variant="destructive">Inactive</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function StatusChangePopover({
  chassisNumber,
  currentStatus,
}: {
  chassisNumber: string
  currentStatus: string | null
}) {
  const [open, setOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>(currentStatus || 'Active')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const updatePayload: Record<string, unknown> = {
        chassis_status: newStatus,
        updated_at: new Date().toISOString(),
      }
      if (notes.trim()) {
        updatePayload.notes = notes.trim()
      }
      const { error } = await supabase
        .from('chassis_master')
        .update(updatePayload)
        .eq('chassis_number', chassisNumber)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['v_chassis_utilization'] })
      toast.success(`Status updated for ${chassisNumber}`)
      setOpen(false)
      setNotes('')
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
          <Settings2 className="h-3 w-3" />
          Change Status
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Status</p>
            {renderForrestStatusBadge(currentStatus)}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">New Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORREST_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimelineMilestone {
  label: string
  date: string
  color: string
}

function ChassisTimeline({
  chassis,
  onClose,
}: {
  chassis: UtilizationRow
  onClose: () => void
}) {
  const milestones: TimelineMilestone[] = []
  if (chassis.first_load_date) milestones.push({ label: 'First Load', date: chassis.first_load_date, color: '#3b82f6' })
  if (chassis.on_hire_date) milestones.push({ label: 'On Hire', date: chassis.on_hire_date, color: '#10b981' })
  if (chassis.off_hire_date) milestones.push({ label: 'Off Hire', date: chassis.off_hire_date, color: '#f59e0b' })
  if (chassis.contract_end_date) milestones.push({ label: 'Contract End', date: chassis.contract_end_date, color: '#8b5cf6' })
  if (chassis.last_activity_date) milestones.push({ label: 'Last Load', date: chassis.last_activity_date, color: '#ef4444' })

  const sorted = [...milestones]
    .filter((m) => m.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const minTs = sorted.length ? new Date(sorted[0].date).getTime() : 0
  const maxTs = sorted.length ? new Date(sorted[sorted.length - 1].date).getTime() : 0
  const range = maxTs - minTs || 1

  const totalRevenue = Number(chassis.total_revenue) || 0
  const status = chassis.utilization_status || 'UNKNOWN'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-mono text-base">{chassis.chassis_number}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {chassis.lessor || '—'} · {chassis.chassis_type || '—'} · Revenue {safeAmount(totalRevenue)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'ACTIVE' && <Badge className="bg-green-600">ACTIVE</Badge>}
            {status === 'IDLE' && <Badge variant="secondary">IDLE</Badge>}
            {status === 'DORMANT' && <Badge variant="destructive">DORMANT</Badge>}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No timeline data available</p>
        ) : (
          <div className="space-y-2">
            <div className="w-full h-24 relative">
              <svg viewBox="0 0 1000 96" preserveAspectRatio="none" className="w-full h-full">
                <line x1="20" y1="48" x2="980" y2="48" stroke="#cbd5e1" strokeWidth="2" />
                {sorted.map((m, i) => {
                  const x = 20 + ((new Date(m.date).getTime() - minTs) / range) * 960
                  return (
                    <g key={i}>
                      <title>{`${m.label}: ${safeDate(m.date)}`}</title>
                      <circle cx={x} cy={48} r={6} fill={m.color} stroke="white" strokeWidth="2" />
                      <text x={x} y={28} textAnchor="middle" fontSize="10" fill="#475569">{m.label}</text>
                      <text x={x} y={72} textAnchor="middle" fontSize="9" fill="#64748b">{safeDate(m.date)}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            {totalRevenue > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Revenue</span>
                  <span>{safeAmount(totalRevenue)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ChassisUtilization() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [selectedChassis, setSelectedChassis] = useState<UtilizationRow | null>(null)
  const ITEMS_PER_PAGE = 15

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const { data = [], isLoading: loading, error: fetchError } = useQuery<UtilizationRow[]>({
    queryKey: ['v_chassis_utilization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_chassis_utilization')
        .select('*')
        .order('total_revenue', { ascending: false })
      if (error) throw error
      return (data || []) as UtilizationRow[]
    },
  })

  const error = fetchError ? (fetchError as Error).message : null

  const filtered = data.filter((d) => {
    if (statusFilter !== 'ALL' && d.utilization_status !== statusFilter) return false
    if (search && !d.chassis_number?.trim().toUpperCase().includes(search.toUpperCase().trim())) return false
    return true
  })

  const totalRevenue = data.reduce((s, d) => s + (Number(d.total_revenue) || 0), 0)
  const totalLoads = data.reduce((s, d) => s + (Number(d.total_loads) || 0), 0)
  const totalMargin = data.reduce((s, d) => s + (Number(d.gross_margin) || 0), 0)
  const dormantCount = data.filter((d) => d.utilization_status === 'DORMANT').length
  const idleLeaseCost = data
    .filter((d) => d.utilization_status !== 'ACTIVE')
    .reduce((s, d) => s + (Number(d.idle_lease_cost) || 0), 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginatedRecords = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const revenueByLessor = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) {
      const key = d.lessor || 'Unknown'
      map.set(key, (map.get(key) || 0) + (Number(d.total_revenue) || 0))
    }
    const arr = Array.from(map.entries())
      .map(([lessor, revenue]) => ({ lessor, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
    if (arr.length <= 8) return arr
    const top = arr.slice(0, 8)
    const other = arr.slice(8).reduce((s, x) => s + x.revenue, 0)
    return [...top, { lessor: 'Other', revenue: other }]
  }, [data])

  const fleetStatusData = useMemo(() => {
    const counts: Record<string, number> = { ACTIVE: 0, IDLE: 0, DORMANT: 0 }
    for (const d of data) {
      const k = d.utilization_status || 'UNKNOWN'
      counts[k] = (counts[k] || 0) + 1
    }
    const total = (counts.ACTIVE || 0) + (counts.IDLE || 0) + (counts.DORMANT || 0)
    return [
      { name: 'ACTIVE', value: counts.ACTIVE || 0, color: '#10b981', pct: total ? ((counts.ACTIVE || 0) / total) * 100 : 0 },
      { name: 'IDLE', value: counts.IDLE || 0, color: '#f59e0b', pct: total ? ((counts.IDLE || 0) / total) * 100 : 0 },
      { name: 'DORMANT', value: counts.DORMANT || 0, color: '#ef4444', pct: total ? ((counts.DORMANT || 0) / total) * 100 : 0 },
    ]
  }, [data])

  const activityTimeline = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) {
      if (!d.last_activity_date) continue
      const dt = new Date(d.last_activity_date)
      if (isNaN(dt.getTime())) continue
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([k, v]) => {
        const [y, m] = k.split('-')
        const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        return { month: monthName, count: v }
      })
  }, [data])

  const renderStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground">—</span>
    if (status === 'ACTIVE') {
      return <Badge variant="default" className="bg-green-600">ACTIVE</Badge>
    }
    if (status === 'IDLE') {
      return <Badge variant="secondary">IDLE</Badge>
    }
    if (status === 'DORMANT') {
      return <Badge variant="destructive">DORMANT</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Chassis Utilization</h1>
        <p className="text-muted-foreground mt-2">Fleet performance analytics</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Chassis Tracked</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{data.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              Total Revenue
              <Tooltip><TooltipTrigger asChild><span className="text-xs cursor-help">(?)</span></TooltipTrigger><TooltipContent>Excludes cancelled and zero-revenue loads</TooltipContent></Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{safeAmount(totalRevenue)}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{totalLoads.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Margin</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className={`text-3xl font-bold ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{safeAmount(totalMargin)}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dormant Chassis</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold text-red-600">{dormantCount.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Idle Lease Cost</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold text-red-600">{safeAmount(idleLeaseCost)}</p>}</CardContent>
        </Card>
      </div>

      {/* SECTION B: Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue by Lessor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByLessor} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <YAxis type="category" dataKey="lessor" width={80} fontSize={11} />
                <RechartsTooltip formatter={(v: unknown) => safeAmount(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fleet Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={fleetStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {fleetStatusData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: unknown, name: unknown, item: unknown) => {
                    const pct = (item as { payload?: { pct?: number } })?.payload?.pct ?? 0
                    const numValue = Number(value) || 0
                    return [`${numValue.toLocaleString()} (${pct.toFixed(1)}%)`, String(name)]
                  }}
                />
                <Legend
                  formatter={(value: string, entry: unknown) => {
                    const payload = (entry as { payload?: { value?: number; pct?: number } })?.payload
                    return `${value} — ${payload?.value ?? 0} (${(payload?.pct ?? 0).toFixed(1)}%)`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityTimeline}>
                <defs>
                  <linearGradient id="ut-activity-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#ut-activity-gradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION C: Selected chassis timeline */}
      {selectedChassis && (
        <ChassisTimeline chassis={selectedChassis} onClose={() => setSelectedChassis(null)} />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search chassis number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-md text-sm"
        />
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="IDLE">Idle</TabsTrigger>
            <TabsTrigger value="DORMANT">Dormant</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader><CardTitle>Utilization by Chassis</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No utilization data available.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Lessor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Days Idle</TableHead>
                      <TableHead className="text-right">Total Loads</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Gross Margin</TableHead>
                      <TableHead className="text-right">Unbilled $</TableHead>
                      <TableHead className="text-right">Idle Lease Cost</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((d) => {
                      const margin = Number(d.gross_margin) || 0
                      const isDormant = d.utilization_status === 'DORMANT'
                      const idleLeaseClass = isDormant ? 'text-red-600 font-medium' : ''
                      const isSelected = selectedChassis?.chassis_number === d.chassis_number
                      return (
                        <TableRow
                          key={d.chassis_number}
                          className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedChassis(d)}
                        >
                          <TableCell className="font-mono font-medium text-sm">{d.chassis_number}</TableCell>
                          <TableCell className="text-sm">{d.lessor || '—'}</TableCell>
                          <TableCell className="text-sm">{d.chassis_type || '—'}</TableCell>
                          <TableCell>{renderStatusBadge(d.utilization_status)}</TableCell>
                          <TableCell className="text-right">{d.days_idle ?? '—'}</TableCell>
                          <TableCell className="text-right">{Number(d.total_loads) || 0}</TableCell>
                          <TableCell className="text-right">{safeAmount(d.total_revenue)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={margin >= 0 ? 'default' : 'destructive'}>{safeAmount(margin)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{safeAmount(d.unbilled_revenue)}</TableCell>
                          <TableCell className={`text-right ${idleLeaseClass}`}>{safeAmount(d.idle_lease_cost)}</TableCell>
                          <TableCell className="text-sm">{safeDate(d.last_activity_date)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {isForrestRow(d) ? (
                              <StatusChangePopover
                                chassisNumber={d.chassis_number}
                                currentStatus={d.chassis_status}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {filtered.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
