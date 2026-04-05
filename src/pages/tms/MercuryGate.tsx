import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import DataFreshnessBar from '@/components/DataFreshnessBar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface MGRecord {
  id: string
  ld_num: string
  so_num: string
  shipment_number: string
  chassis_number: string
  container_number: string
  pickup_actual_date: string
  delivery_actual_date: string
  carrier_name: string
  customer_name: string
  status: string
  created_date: string
  cust_rate_charge: number
  cust_invoice_charge: number
  carrier_rate_charge: number
  carrier_invoice_charge: number
  unbilledflag: string
  steamshipline: string
  mbl: string
  vessel_eta: string
  actual_rc_date: string
  acct_mg_name: string
  pickup_location: string
  drop_location: string
  zero_rev: string
  [key: string]: unknown
}

export default function MercuryGate() {
  const [records, setRecords] = useState<MGRecord[]>([])
  const [filtered, setFiltered] = useState<MGRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [unbilledOnly, setUnbilledOnly] = useState(false)
  const [selected, setSelected] = useState<MGRecord | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('mg_tms')
          .select('*')
          .order('created_date', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
        setFiltered(data || [])
      } catch (err) {
        console.error('[MercuryGate] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load TMS data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = records
    if (search) {
      const q = search.toUpperCase().trim()
      result = result.filter(r =>
        r.ld_num?.includes(q) ||
        r.chassis_number?.toUpperCase().trim().includes(q) ||
        r.container_number?.toUpperCase().includes(q) ||
        r.customer_name?.toUpperCase().includes(q) ||
        r.carrier_name?.toUpperCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status?.toLowerCase() === statusFilter)
    }
    if (unbilledOnly) {
      result = result.filter(r => r.unbilledflag === 'Y')
    }
    setFiltered(result)
  }, [search, statusFilter, unbilledOnly, records])

  const unbilledCount = records.filter(r => r.unbilledflag === 'Y').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mercury Gate TMS</h1>
        <p className="text-muted-foreground">MercuryGate Transportation Management System data</p>
        <DataFreshnessBar tableName="mg_tms" label="TMS Data" />
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{records.length.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Filtered Results</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{filtered.length.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{new Set(records.map(r => r.chassis_number?.trim()).filter(Boolean)).size}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search LD#, chassis, container, carrier, customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-64 px-3 py-2 border rounded-md text-sm"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button
          variant={unbilledOnly ? 'default' : 'outline'}
          onClick={() => setUnbilledOnly(!unbilledOnly)}
          size="sm"
        >
          Unbilled Only ({unbilledCount})
        </Button>
        <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); setUnbilledOnly(false) }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Unbilled</TableHead>
                    <TableHead>SO #</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        Cust Rate
                        <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Excludes cancelled and zero-revenue loads</TooltipContent></Tooltip>
                      </span>
                    </TableHead>
                    <TableHead>Cust Invoice</TableHead>
                    <TableHead>Carrier Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={13} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(r => (
                    <TableRow
                      key={r.id || r.ld_num}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
                      <TableCell>
                        {r.unbilledflag === 'Y' && <Badge variant="destructive" className="text-xs">UNBILLED</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{r.so_num || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.chassis_number?.trim() || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.container_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.pickup_actual_date)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.delivery_actual_date)}</TableCell>
                      <TableCell className="text-sm">{r.carrier_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.customer_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{safeAmount(r.cust_rate_charge)}</TableCell>
                      <TableCell className="text-sm">{safeAmount(r.cust_invoice_charge)}</TableCell>
                      <TableCell className="text-sm">{safeAmount(r.carrier_rate_charge)}</TableCell>
                      <TableCell><Badge variant="outline">{r.status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} records.</p>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="font-mono">{selected?.ld_num}</SheetTitle>
            <SheetDescription>Mercury Gate Load Details</SheetDescription>
          </SheetHeader>
          {selected && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-6">
              <Field label="Load #" value={selected.ld_num} />
              <Field label="SO #" value={selected.so_num} />
              <Field label="Status" value={selected.status} />
              <Field label="Container #" value={selected.container_number} />
              <Field label="Chassis #" value={selected.chassis_number?.trim()} />
              <Field label="Customer" value={selected.customer_name} />
              <Field label="Carrier" value={selected.carrier_name} />
              <Field label="Pickup Location" value={selected.pickup_location} />
              <Field label="Drop Location" value={selected.drop_location} />
              <Field label="Created Date" value={formatDate(selected.created_date)} />
              <Field label="Pickup Date" value={formatDate(selected.pickup_actual_date)} />
              <Field label="Delivery Date" value={formatDate(selected.delivery_actual_date)} />
              <Field label="Container Return" value={formatDate(selected.actual_rc_date)} />
              <Field label="Cust Rate" value={safeAmount(selected.cust_rate_charge)} />
              <Field label="Cust Invoice" value={safeAmount(selected.cust_invoice_charge)} />
              <Field label="Carrier Rate" value={safeAmount(selected.carrier_rate_charge)} />
              <Field label="Carrier Invoice" value={safeAmount(selected.carrier_invoice_charge)} />
              <Field label="Margin" value={safeAmount((Number(selected.cust_rate_charge) || 0) - (Number(selected.carrier_rate_charge) || 0))} />
              <Field label="Steamship Line" value={selected.steamshipline} />
              <Field label="MBL" value={selected.mbl} />
              <Field label="Vessel ETA" value={formatDate(selected.vessel_eta)} />
              <Field label="Unbilled" value={selected.unbilledflag === 'Y' ? 'Yes' : 'No'} />
              <Field label="Account Manager" value={selected.acct_mg_name} />
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value ?? 'N/A'}</dd>
    </div>
  )
}
