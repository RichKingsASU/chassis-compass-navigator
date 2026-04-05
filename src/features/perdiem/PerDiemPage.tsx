import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface PerDiemRecord {
  chassis_number: string
  reservation_number: string
  date_out: string
  date_in: string
  vendor_days_claimed: number
  pick_up_location: string
  pool_contract: string
  ld_num: string
  load_status: string
  pickup_actual_date: string
  actual_rc_date: string
  acct_mgr_name: string
  forrest_days: number
  day_discrepancy: number
}

function discrepancyBadge(disc: number | null) {
  if (disc === null || disc === undefined) return <Badge className="bg-orange-500 text-white">Unmatched</Badge>
  if (disc === 0) return <Badge variant="default" className="bg-green-600">Match</Badge>
  if (Math.abs(disc) <= 2) return <Badge className="bg-yellow-500 text-white">Minor</Badge>
  return <Badge variant="destructive">Overbill Risk</Badge>
}

export default function PerDiemPage() {
  const [records, setRecords] = useState<PerDiemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Per Diem view not available — ask admin to create v_perdiem_reconciliation')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const matched = records.filter(r => r.day_discrepancy !== null && r.day_discrepancy !== undefined)
  const unmatched = records.filter(r => r.day_discrepancy === null || r.day_discrepancy === undefined)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Per Diem Reconciliation</h1>
        <p className="text-muted-foreground">Compare vendor-claimed days vs actual usage</p>
      </div>
      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{records.length}</p>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Matched</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold text-green-600">{matched.length}</p>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unmatched</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold text-orange-600">{unmatched.length}</p>}</CardContent></Card>
      </div>
      <Card><CardContent className="pt-4">
        {loading ? <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        : records.length === 0 ? <p className="text-center text-muted-foreground py-8">No per diem data available. Create the v_perdiem_reconciliation view first.</p>
        : <div className="overflow-x-auto"><Table><TableHeader><TableRow>
          <TableHead>Chassis #</TableHead><TableHead>Reservation</TableHead><TableHead>Vendor Days</TableHead><TableHead>Forrest Days</TableHead>
          <TableHead>Discrepancy</TableHead><TableHead>Date Out</TableHead><TableHead>Date In</TableHead><TableHead>Load #</TableHead><TableHead>Acct Mgr</TableHead>
        </TableRow></TableHeader><TableBody>
          {records.slice(0, 100).map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-sm">{r.chassis_number?.trim()}</TableCell>
              <TableCell className="text-sm">{r.reservation_number || 'N/A'}</TableCell>
              <TableCell className="text-right">{r.vendor_days_claimed ?? 'N/A'}</TableCell>
              <TableCell className="text-right">{r.forrest_days ?? 'N/A'}</TableCell>
              <TableCell>{discrepancyBadge(r.day_discrepancy)}</TableCell>
              <TableCell className="text-sm">{safeDate(r.date_out)}</TableCell>
              <TableCell className="text-sm">{safeDate(r.date_in)}</TableCell>
              <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
              <TableCell className="text-sm">{r.acct_mgr_name || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody></Table></div>}
      </CardContent></Card>
    </div>
  )
}
