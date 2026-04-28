import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DataFreshnessBar from '@/components/DataFreshnessBar'
import { useQuery } from '@tanstack/react-query'

interface MGRecord {
  id: number
  ld_num: string | null
  so_num: string | null
  chassis_number: string | null
  container_number: string | null
  container_description: string | null
  chassis_type: string | null
  pickup_actual_date: string | null
  drop_actual_date: string | null
  actual_rc_date: string | null
  create_date: string | null
  carrier_name: string | null
  carrier_scac: string | null
  acct_mgr_name: string | null
  owner: string | null
  customer_name: string | null
  customer_parent: string | null
  status: string | null
  steamship_line: string | null
  mbl: string | null
  zero_rev: string | null
  miles: number | null
  customer_rate_amount: number | null
  customer_inv_amount: number | null
  carrier_rate_amount: number | null
  carrier_inv_amount: number | null
  margin_rate: number | null
  margin_invoice: number | null
  pickup_loc_name: string | null
  pickup_loc_city: string | null
  pickup_loc_state: string | null
  drop_loc_name: string | null
  drop_loc_city: string | null
  drop_loc_state: string | null
  line_of_business: string | null
  work_order: string | null
  service_description: string | null
  [key: string]: unknown
}

const PAGE_SIZE = 100

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">—</Badge>
  const s = status.toLowerCase()
  const variant =
    s === 'delivered' ? 'default' :
    s === 'in transit' ? 'secondary' :
    s === 'cancelled' || s === 'void' ? 'destructive' :
    'outline'
  return <Badge variant={variant}>{status}</Badge>
}

export default function MercuryGate() {
  const [page, setPage] = useState(0)
  const [selectedRecord, setSelectedRecord] = useState<MGRecord | null>(null)

  // Filters
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [zeroRevFilter, setZeroRevFilter] = useState(false)

  const buildQuery = useCallback(() => {
    let q = supabase
      .from('mg_tms')
      .select('*', { count: 'exact' })
      .order('create_date', { ascending: false })

    if (search.trim()) {
      const s = search.trim()
      q = q.or(
        `ld_num.ilike.%${s}%,` +
        `chassis_number.ilike.%${s}%,` +
        `container_number.ilike.%${s}%,` +
        `carrier_name.ilike.%${s}%,` +
        `acct_mgr_name.ilike.%${s}%,` +
        `mbl.ilike.%${s}%`
      )
    }
    if (customerFilter.trim()) {
      q = q.ilike('customer_name', `%${customerFilter.trim()}%`)
    }
    if (statusFilter !== 'all') {
      q = q.ilike('status', statusFilter)
    }
    if (dateFrom) {
      q = q.gte('create_date', dateFrom)
    }
    if (dateTo) {
      q = q.lte('create_date', dateTo + 'T23:59:59')
    }
    if (zeroRevFilter) {
      q = q.neq('zero_rev', 'Y')
    }
    return q
  }, [search, customerFilter, statusFilter, dateFrom, dateTo, zeroRevFilter])

  // Reset to page 0 when filters change
  const handleFilterChange = () => {
    setPage(0)
  }

  const { data: pageData, isLoading: loading, error: errorObj } = useQuery({
    queryKey: ['mg_tms_page', page, search, customerFilter, statusFilter, dateFrom, dateTo, zeroRevFilter],
    queryFn: async () => {
      const { data, error, count } = await buildQuery()
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (error) throw error
      return { records: (data as MGRecord[]) || [], count: count || 0 }
    }
  })

  const records = pageData?.records || []
  const totalCount = pageData?.count || 0
  const error = errorObj?.message || null

  const { data: stats } = useQuery({
    queryKey: ['mg_tms_stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mg_tms')
        .select('customer_rate_amount, margin_rate, chassis_number, customer_name')
        .neq('zero_rev', 'Y')
        .not('status', 'in', '("Cancelled","Void","Rejected")')
        .limit(10000)

      const rows = (data || []) as MGRecord[]
      return {
        totalRevenue:    rows.reduce((s, r) => s + (r.customer_rate_amount || 0), 0),
        totalMargin:     rows.reduce((s, r) => s + (r.margin_rate || 0), 0),
        uniqueChassis:   new Set(rows.map(r => r.chassis_number?.trim()).filter(Boolean)).size,
        uniqueCustomers: new Set(rows.map(r => r.customer_name).filter(Boolean)).size,
      }
    },
    staleTime: 5 * 60 * 1000 // cache stats for 5 minutes
  })

  const displayStats = stats || { totalRevenue: 0, totalMargin: 0, uniqueChassis: 0, uniqueCustomers: 0 }
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function clearFilters() {
    setSearch('')
    setCustomerFilter('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setZeroRevFilter(false)
    setPage(0)
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mercury Gate TMS</h1>
        <p className="text-muted-foreground mt-2">MercuryGate Transportation Management System — {totalCount.toLocaleString()} records</p>
        <div className="mt-4">
          <DataFreshnessBar tableName="mg_data" label="MG TMS" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{totalCount.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              Total Revenue
              <Tooltip>
                <TooltipTrigger asChild><span className="text-xs cursor-help text-muted-foreground">(?)</span></TooltipTrigger>
                <TooltipContent>Excludes zero-revenue and cancelled loads. Based on first 10k records.</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{safeAmount(displayStats.totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{displayStats.uniqueChassis.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Customers</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{displayStats.uniqueCustomers.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search LD#, chassis, container, carrier, MBL..."
              value={search}
              onChange={e => { setSearch(e.target.value); handleFilterChange() }}
              className="px-3 py-2 border rounded-md text-sm col-span-1 md:col-span-2"
            />
            <input
              type="text"
              placeholder="Filter by customer name..."
              value={customerFilter}
              onChange={e => { setCustomerFilter(e.target.value); handleFilterChange() }}
              className="px-3 py-2 border rounded-md text-sm"
            />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); handleFilterChange() }}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Void">Void</option>
            </select>
            <div className="flex gap-2">
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); handleFilterChange() }}
                className="flex-1 px-3 py-2 border rounded-md text-sm" title="Create date from" />
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); handleFilterChange() }}
                className="flex-1 px-3 py-2 border rounded-md text-sm" title="Create date to" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={zeroRevFilter} onChange={e => { setZeroRevFilter(e.target.checked); handleFilterChange() }} className="rounded" />
                Exclude zero revenue
              </label>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Drop</TableHead>
                    <TableHead>RC Date</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Acct Mgr</TableHead>
                    <TableHead>Cust Rate</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                        No records found.
                      </TableCell>
                    </TableRow>
                  ) : records.map(r => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRecord(r)}
                    >
                      <TableCell className="font-mono text-xs">{r.ld_num || '—'}</TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate" title={r.customer_name || r.owner || ''}>
                        {r.customer_name || <span className="text-muted-foreground text-xs">{r.owner || '—'}</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.chassis_number?.trim() || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{r.container_number || '—'}</TableCell>
                      <TableCell className="text-xs">{safeDate(r.pickup_actual_date)}</TableCell>
                      <TableCell className="text-xs">{safeDate(r.drop_actual_date)}</TableCell>
                      <TableCell className="text-xs">{safeDate(r.actual_rc_date)}</TableCell>
                      <TableCell className="text-sm max-w-[120px] truncate" title={r.carrier_name || ''}>{r.carrier_name || '—'}</TableCell>
                      <TableCell className="text-xs">{r.acct_mgr_name || '—'}</TableCell>
                      <TableCell className="text-sm">{safeAmount(r.customer_rate_amount)}</TableCell>
                      <TableCell className="text-sm">
                        <span className={(r.margin_rate || 0) < 0 ? 'text-destructive' : 'text-green-600'}>
                          {safeAmount(r.margin_rate)}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 text-sm">
              <p className="text-muted-foreground">
                Page {page + 1} of {totalPages} ({totalCount.toLocaleString()} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>Last</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedRecord} onOpenChange={open => { if (!open) setSelectedRecord(null) }}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-mono">{selectedRecord?.ld_num || 'Load Detail'}</SheetTitle>
            <SheetDescription>
              {selectedRecord?.customer_name || selectedRecord?.owner || 'Mercury Gate Load'}
            </SheetDescription>
          </SheetHeader>
          {selectedRecord && (
            <div className="mt-8 space-y-6">
              {/* Identity */}
              <Section title="Load Info">
                <DField label="Load #"       value={selectedRecord.ld_num} />
                <DField label="SO #"         value={selectedRecord.so_num} />
                <DField label="Status"       value={selectedRecord.status} />
                <DField label="Created"      value={safeDate(selectedRecord.create_date)} />
                <DField label="Work Order"   value={selectedRecord.work_order} />
                <DField label="Line of Biz"  value={selectedRecord.line_of_business} />
                <DField label="Zero Revenue" value={selectedRecord.zero_rev} />
              </Section>

              {/* Customer */}
              <Section title="Customer">
                <DField label="Account #"    value={selectedRecord.owner} />
                <DField label="Customer"     value={selectedRecord.customer_name} />
                <DField label="Parent"       value={selectedRecord.customer_parent} />
                <DField label="Acct Manager" value={selectedRecord.acct_mgr_name} />
              </Section>

              {/* Equipment */}
              <Section title="Equipment">
                <DField label="Chassis #"    value={selectedRecord.chassis_number?.trim()} />
                <DField label="Chassis Type" value={selectedRecord.chassis_type} />
                <DField label="Container #"  value={selectedRecord.container_number} />
                <DField label="Container"    value={selectedRecord.container_description} />
                <DField label="Steamship"    value={selectedRecord.steamship_line} />
                <DField label="MBL"          value={selectedRecord.mbl} />
              </Section>

              {/* Movement */}
              <Section title="Movement">
                <DField label="Pickup Location" value={`${selectedRecord.pickup_loc_name || ''} ${selectedRecord.pickup_loc_city ? `— ${selectedRecord.pickup_loc_city}, ${selectedRecord.pickup_loc_state}` : ''}`} />
                <DField label="Drop Location"   value={`${selectedRecord.drop_loc_name || ''} ${selectedRecord.drop_loc_city ? `— ${selectedRecord.drop_loc_city}, ${selectedRecord.drop_loc_state}` : ''}`} />
                <DField label="Pickup Date"     value={safeDate(selectedRecord.pickup_actual_date)} />
                <DField label="Drop Date"       value={safeDate(selectedRecord.drop_actual_date)} />
                <DField label="RC Date"         value={safeDate(selectedRecord.actual_rc_date)} />
                <DField label="Miles"           value={selectedRecord.miles?.toString()} />
                <DField label="Carrier"         value={selectedRecord.carrier_name} />
                <DField label="SCAC"            value={selectedRecord.carrier_scac} />
              </Section>

              {/* Financials */}
              <Section title="Financials">
                <DField label="Cust Rate"    value={safeAmount(selectedRecord.customer_rate_amount)} />
                <DField label="Cust Invoice" value={safeAmount(selectedRecord.customer_inv_amount)} />
                <DField label="Carrier Rate" value={safeAmount(selectedRecord.carrier_rate_amount)} />
                <DField label="Carrier Inv"  value={safeAmount(selectedRecord.carrier_inv_amount)} />
                <DField label="Margin Rate"  value={safeAmount(selectedRecord.margin_rate)} />
                <DField label="Margin Inv"   value={safeAmount(selectedRecord.margin_invoice)} />
              </Section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 border-b pb-1">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">{children}</dl>
    </div>
  )
}

function DField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs mb-1">{label}</dt>
      <dd className="font-medium truncate" title={String(value || '')}>{value || '—'}</dd>
    </div>
  )
}
