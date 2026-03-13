import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
  created_at: string
}

export default function MercuryGate() {
  const [records, setRecords] = useState<MGRecord[]>([])
  const [filtered, setFiltered] = useState<MGRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('mg_tms')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
        setFiltered(data || [])
      } catch (err: unknown) {
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
      const q = search.toUpperCase()
      result = result.filter(r =>
        r.ld_num?.includes(q) ||
        r.chassis_number?.includes(q) ||
        r.container_number?.includes(q) ||
        r.shipment_number?.includes(q) ||
        r.customer_name?.toUpperCase().includes(q) ||
        r.carrier_name?.toUpperCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status?.toLowerCase() === statusFilter)
    }
    setFiltered(result)
  }, [search, statusFilter, records])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mercury Gate TMS</h1>
        <p className="text-muted-foreground">MercuryGate Transportation Management System data</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

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
          <CardContent><p className="text-3xl font-bold">{new Set(records.map(r => r.chassis_number).filter(Boolean)).size}</p></CardContent>
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
        <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading TMS data...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LD #</TableHead>
                    <TableHead>SO #</TableHead>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.so_num || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.shipment_number || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.chassis_number || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.container_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.pickup_actual_date)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.delivery_actual_date)}</TableCell>
                      <TableCell className="text-sm">{r.carrier_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.customer_name || 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{r.status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} records. Refine your search to see more.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
