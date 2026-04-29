import { useState, useMemo } from 'react'
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
  id: string
  ld_num: string
  so_num: string
  chassis_number: string
  container_number: string
  pickup_actual_date: string
  drop_actual_date: string
  carrier_name: string
  acct_mgr_name: string
  status: string
  create_date: string
  customer_rate_amount: string
  customer_inv_amount: string
  carrier_rate_amount: string
  pickup_loc_name: string
  drop_loc_name: string
  steamship_line: string
  mbl: string
  zero_rev: string
  chassis_type: string
  container_description: string
  actual_rc_date: string
  [key: string]: unknown
}

export default function MercuryGate() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRecord, setSelectedRecord] = useState<MGRecord | null>(null)

  const { data: records = [], isLoading: loading, error: errorObj } = useQuery({
    queryKey: ['mg_data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mg_data')
        .select('*')
        .order('create_date', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data || []) as MGRecord[]
    }
  })

  const error = errorObj?.message || null

  const filtered = useMemo(() => {
    let result = records
    if (search) {
      const q = search.toUpperCase().trim()
      result = result.filter(r =>
        r.ld_num?.toUpperCase().includes(q) ||
        r.chassis_number?.trim().toUpperCase().includes(q) ||
        r.container_number?.toUpperCase().includes(q) ||
        r.acct_mgr_name?.toUpperCase().includes(q) ||
        r.carrier_name?.toUpperCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status?.toLowerCase() === statusFilter)
    }
    return result
  }, [search, statusFilter, records])

  const totalRevenue = records
    .filter(r => r.zero_rev !== 'Y' && !['Cancelled', 'Void', 'Rejected'].includes(r.status))
    .reduce((s, r) => s + (parseFloat(r.customer_rate_amount) || 0), 0)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mercury Gate TMS</h1>
        <p className="text-muted-foreground mt-2">MercuryGate Transportation Management System data</p>
        <div className="mt-4">
          <DataFreshnessBar tableName="mg_data" label="MG TMS" />
        </div>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{records.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Filtered Results</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{filtered.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{new Set(records.map(r => r.chassis_number?.trim()).filter(Boolean)).size}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              Total Revenue
              <Tooltip>
                <TooltipTrigger asChild><span className="text-xs cursor-help">(?)</span></TooltipTrigger>
                <TooltipContent>Excludes cancelled and zero-revenue loads</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{safeAmount(totalRevenue)}</p>}</CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input type="text" placeholder="Search LD#, chassis, container, acct mgr, carrier..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-64 px-3 py-2 border rounded-md text-sm" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all') }}>Clear</Button>
      </div>

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
                    <TableHead>SO #</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Drop Date</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Acct Mgr</TableHead>
                    <TableHead>Cust Rate</TableHead>
                    <TableHead>Cust Invoice</TableHead>
                    <TableHead>Carrier Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No records found.</TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRecord(r)}>
                      <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.so_num || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.chassis_number?.trim() || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.container_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.pickup_actual_date)}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.drop_actual_date)}</TableCell>
                      <TableCell className="text-sm">{r.carrier_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.acct_mgr_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{safeAmount(r.customer_rate_amount)}</TableCell>
                      <TableCell className="text-sm">{safeAmount(r.customer_inv_amount)}</TableCell>
                      <TableCell className="text-sm">{safeAmount(r.carrier_rate_amount)}</TableCell>
                      <TableCell><Badge variant="outline">{r.status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 100 && <p className="text-sm text-muted-foreground text-center mt-4">Showing 100 of {filtered.length} records.</p>}
        </CardContent>
      </Card>

      <Sheet open={!!selectedRecord} onOpenChange={open => { if (!open) setSelectedRecord(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-mono">{selectedRecord?.ld_num}</SheetTitle>
            <SheetDescription>Mercury Gate Load Details</SheetDescription>
          </SheetHeader>
          {selectedRecord && (
            <div className="mt-8 space-y-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <DField label="Load #" value={selectedRecord.ld_num} />
                <DField label="SO #" value={selectedRecord.so_num} />
                <DField label="Status" value={selectedRecord.status} />
                <DField label="Container #" value={selectedRecord.container_number} />
                <DField label="Chassis #" value={selectedRecord.chassis_number?.trim()} />
                <DField label="Acct Manager" value={selectedRecord.acct_mgr_name} />
                <DField label="Carrier" value={selectedRecord.carrier_name} />
                <DField label="Pickup Location" value={selectedRecord.pickup_loc_name} />
                <DField label="Drop Location" value={selectedRecord.drop_loc_name} />
                <DField label="Created" value={safeDate(selectedRecord.create_date)} />
                <DField label="Pickup Date" value={safeDate(selectedRecord.pickup_actual_date)} />
                <DField label="Drop Date" value={safeDate(selectedRecord.drop_actual_date)} />
                <DField label="Container Return" value={safeDate(selectedRecord.actual_rc_date)} />
                <DField label="Cust Rate" value={safeAmount(selectedRecord.customer_rate_amount)} />
                <DField label="Cust Invoice" value={safeAmount(selectedRecord.customer_inv_amount)} />
                <DField label="Carrier Rate" value={safeAmount(selectedRecord.carrier_rate_amount)} />
                <DField label="Margin" value={safeAmount((parseFloat(selectedRecord.customer_rate_amount) || 0) - (parseFloat(selectedRecord.carrier_rate_amount) || 0))} />
                <DField label="Steamship Line" value={selectedRecord.steamship_line} />
                <DField label="MBL" value={selectedRecord.mbl} />
                <DField label="Zero Revenue" value={selectedRecord.zero_rev} />
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs mb-1">{label}</dt>
      <dd className="font-medium">{value || 'N/A'}</dd>
    </div>
  )
}
