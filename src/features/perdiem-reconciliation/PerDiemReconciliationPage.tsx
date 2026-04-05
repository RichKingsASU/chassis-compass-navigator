import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataFreshnessBar from '@/components/DataFreshnessBar'

interface PerDiemRow {
  chassis_number: string | null
  reservation: string | null
  vendor_days_claimed: number | null
  forrest_days_computed: number | null
  day_discrepancy: number | null
  date_out: string | null
  date_in: string | null
  ld_num: string | null
  load_status: string | null
  customer_name: string | null
  carrier_rate_charge: number | null
  pick_up_location: string | null
  location_in: string | null
  pool_contract: string | null
}

function discrepancyBadge(d: number | null) {
  if (d == null) return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Unmatched</Badge>
  if (d === 0) return <Badge className="bg-green-100 text-green-800 border-green-300">Matched</Badge>
  if (d >= 1 && d <= 2) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{d}d Variance</Badge>
  return <Badge className="bg-red-100 text-red-800 border-red-300">{d}d Overbill Risk</Badge>
}

export default function PerDiemReconciliationPage() {
  const [rows, setRows] = useState<PerDiemRow[]>([])
  const [filtered, setFiltered] = useState<PerDiemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched' | 'variance'>('all')
  const [poolFilter, setPoolFilter] = useState('all')

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('v_perdiem_reconciliation')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(1000)
        if (fetchErr) throw fetchErr
        setRows(data || [])
      } catch (err: unknown) {
        console.error('Per diem reconciliation query error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load reconciliation data')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    let result = rows
    if (statusFilter === 'matched') result = result.filter(r => r.day_discrepancy === 0)
    else if (statusFilter === 'unmatched') result = result.filter(r => r.day_discrepancy == null)
    else if (statusFilter === 'variance') result = result.filter(r => r.day_discrepancy != null && r.day_discrepancy > 0)
    if (poolFilter !== 'all') result = result.filter(r => r.pool_contract === poolFilter)
    setFiltered(result)
  }, [rows, statusFilter, poolFilter])

  const matched = rows.filter(r => r.day_discrepancy === 0).length
  const unmatched = rows.filter(r => r.day_discrepancy == null).length
  const overbillExposure = rows
    .filter(r => r.day_discrepancy != null && r.day_discrepancy > 0)
    .reduce((s, r) => s + (r.day_discrepancy ?? 0) * 75, 0) // ~$75/day estimate

  const pools = [...new Set(rows.map(r => r.pool_contract).filter(Boolean))]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Per Diem Reconciliation</h1>
        <p className="text-muted-foreground">DCLI vendor days vs Forrest TMS days — identify overbilling</p>
      </div>

      <DataFreshnessBar tableName="mg_tms" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30">
          Query error — data could not be loaded. Check console for details.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{rows.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Matched</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{matched}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unmatched</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-600">{unmatched}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overbill Exposure</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(overbillExposure)}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border rounded-md text-sm">
          <option value="all">All Statuses</option>
          <option value="matched">Matched</option>
          <option value="unmatched">Unmatched</option>
          <option value="variance">Variance ({'>'}0)</option>
        </select>
        <select value={poolFilter} onChange={e => setPoolFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="all">All Pools</option>
          {pools.map(p => <option key={p} value={p!}>{p}</option>)}
        </select>
        <Button variant="outline" onClick={() => { setStatusFilter('all'); setPoolFilter('all') }}>Clear</Button>
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
                    <TableHead>Chassis</TableHead>
                    <TableHead>Reservation</TableHead>
                    <TableHead className="text-right">Vendor Days</TableHead>
                    <TableHead className="text-right">Forrest Days</TableHead>
                    <TableHead>Discrepancy</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead>Load #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Carrier Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map((r, i) => (
                    <TableRow key={`${r.reservation}-${i}`}>
                      <TableCell className="font-mono text-sm">{r.chassis_number?.trim() || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.reservation || 'N/A'}</TableCell>
                      <TableCell className="text-right">{r.vendor_days_claimed ?? 'N/A'}</TableCell>
                      <TableCell className="text-right">{r.forrest_days_computed ?? 'N/A'}</TableCell>
                      <TableCell>{discrepancyBadge(r.day_discrepancy)}</TableCell>
                      <TableCell>{formatDate(r.date_out)}</TableCell>
                      <TableCell>{formatDate(r.date_in)}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{r.load_status || 'N/A'}</Badge></TableCell>
                      <TableCell>{r.customer_name || 'N/A'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.carrier_rate_charge)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 200 && (
                <p className="text-sm text-muted-foreground text-center mt-2">Showing 200 of {filtered.length} records.</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
