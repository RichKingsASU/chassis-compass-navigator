import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PerDiemRecord {
  chassis_number: string
  reservation: string
  date_out: string
  date_in: string
  vendor_days_claimed: number
  pick_up_location: string
  pool_contract: string
  ld_num: string
  load_status: string
  pickup_actual_date: string
  actual_rc_date: string
  customer_name: string
  cust_rate_charge: number
  carrier_rate_charge: number
  forrest_days: number | null
  day_discrepancy: number | null
}

export default function PerDiemPage() {
  const [records, setRecords] = useState<PerDiemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('v_perdiem_reconciliation')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
      } catch (err) {
        console.error('[PerDiem] load failed:', err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filter === 'all' ? records
    : filter === 'matched' ? records.filter(r => r.ld_num != null)
    : records.filter(r => r.ld_num == null)

  const matched = records.filter(r => r.ld_num != null).length
  const unmatched = records.filter(r => r.ld_num == null).length
  const exposure = records
    .filter(r => r.day_discrepancy != null && r.day_discrepancy > 0)
    .reduce((s, r) => s + (r.day_discrepancy! * 14.95), 0)

  function discrepancyBadge(d: number | null) {
    if (d === null || d === undefined) return <Badge className="bg-orange-100 text-orange-800">Unmatched</Badge>
    if (d === 0) return <Badge className="bg-green-100 text-green-800">Match</Badge>
    if (d <= 2) return <Badge className="bg-yellow-100 text-yellow-800">Minor</Badge>
    return <Badge variant="destructive">Overbill Risk</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Per Diem Reconciliation</h1>
        <p className="text-muted-foreground">
          {records.length} total | {matched} matched | {unmatched} unmatched | {formatCurrency(exposure)} exposure
        </p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All ({records.length})</Button>
        <Button variant={filter === 'matched' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('matched')}>Matched ({matched})</Button>
        <Button variant={filter === 'unmatched' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unmatched')}>Unmatched ({unmatched})</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Reconciliation Details</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No records found. Ensure the v_perdiem_reconciliation view has been created in Supabase.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Reservation</TableHead>
                    <TableHead>Vendor Days</TableHead>
                    <TableHead>Forrest Days</TableHead>
                    <TableHead>Discrepancy</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead>Load #</TableHead>
                    <TableHead>Customer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((r, i) => (
                    <TableRow key={`${r.chassis_number}-${r.reservation}-${i}`}>
                      <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
                      <TableCell className="text-sm">{r.reservation || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.vendor_days_claimed ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.forrest_days ?? 'N/A'}</TableCell>
                      <TableCell>{discrepancyBadge(r.day_discrepancy)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_out)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_in)}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.customer_name || 'N/A'}</TableCell>
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
