import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeAmount, safeDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'

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

export default function ChassisUtilization() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(1)
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((d) => {
                      const margin = Number(d.gross_margin) || 0
                      const isDormant = d.utilization_status === 'DORMANT'
                      const idleLeaseClass = isDormant ? 'text-red-600 font-medium' : ''
                      return (
                        <TableRow key={d.chassis_number} className="hover:bg-muted/50">
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
