import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataFreshnessBar from '@/components/DataFreshnessBar'

interface ActiveLoad {
  id: string
  ld_num: string
  chassis_number: string | null
  container_number: string | null
  customer_name: string | null
  carrier_name: string | null
  status: string | null
  pickup_actual_date: string | null
  delivery_actual_date: string | null
  cust_rate_charge: number | null
  unbilledflag: string | null
  acct_mg_name: string | null
}

export default function ActiveLoads() {
  const [records, setRecords] = useState<ActiveLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [unbilledOnly, setUnbilledOnly] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('mg_tms')
          .select('id, ld_num, chassis_number, container_number, customer_name, carrier_name, status, pickup_actual_date, delivery_actual_date, cust_rate_charge, unbilledflag, acct_mg_name')
          .not('status', 'in', '("Cancelled","Void","Rejected")')
          .order('pickup_actual_date', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
      } catch (err: unknown) {
        console.error('Active loads query error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load active loads')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const unbilledCount = records.filter(r => r.unbilledflag === 'Y').length

  const filtered = records.filter(r => {
    if (unbilledOnly && r.unbilledflag !== 'Y') return false
    if (!search) return true
    const q = search.toUpperCase()
    return (
      r.ld_num?.includes(q) ||
      r.chassis_number?.includes(q) ||
      r.container_number?.includes(q) ||
      r.customer_name?.toUpperCase().includes(q) ||
      r.carrier_name?.toUpperCase().includes(q)
    )
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Loads</h1>
        <p className="text-muted-foreground">Current loads from Mercury Gate TMS — excludes cancelled and void</p>
      </div>

      <DataFreshnessBar tableName="mg_tms" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30">
          Query error — data could not be loaded. Check console for details.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Loads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{records.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Filtered</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{filtered.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unbilled</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{unbilledCount}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search LD#, chassis, container, customer, carrier..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-64 px-3 py-2 border rounded-md text-sm"
        />
        <Button
          variant={unbilledOnly ? 'default' : 'outline'}
          onClick={() => setUnbilledOnly(!unbilledOnly)}
        >
          Unbilled Only ({unbilledCount})
        </Button>
        <Button variant="outline" onClick={() => { setSearch(''); setUnbilledOnly(false) }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
            </div>
          ) : !error && filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No records found for the current filters.</p>
          ) : !error ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Unbilled</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Account Manager</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead className="text-right">Customer Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
                      <TableCell>
                        {r.unbilledflag === 'Y' && <Badge className="bg-red-100 text-red-800 border-red-300">UNBILLED</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{r.chassis_number?.trim() || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.container_number || 'N/A'}</TableCell>
                      <TableCell>{r.customer_name || 'N/A'}</TableCell>
                      <TableCell>{r.carrier_name || 'N/A'}</TableCell>
                      <TableCell>{r.acct_mg_name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(r.pickup_actual_date)}</TableCell>
                      <TableCell>{formatDate(r.delivery_actual_date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.cust_rate_charge)}</TableCell>
                      <TableCell><Badge variant="outline">{r.status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 100 && (
                <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} records.</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
