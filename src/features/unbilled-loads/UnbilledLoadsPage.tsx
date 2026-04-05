import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import DataFreshnessBar from '@/components/DataFreshnessBar'

interface UnbilledLoad {
  ld_num: string
  chassis_number: string | null
  customer_name: string | null
  acct_mg_name: string | null
  status: string | null
  created_date: string | null
  pickup_actual_date: string | null
  delivery_actual_date: string | null
  cust_rate_charge: number | null
  cust_invoice_charge: number | null
  unbilledflag: string | null
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

function ageBadge(days: number | null) {
  if (days == null) return <span className="text-muted-foreground">N/A</span>
  if (days <= 14) return <span>{days}d</span>
  if (days <= 30) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{days}d</Badge>
  return <Badge className="bg-red-100 text-red-800 border-red-300">{days}d</Badge>
}

export default function UnbilledLoadsPage() {
  const [loads, setLoads] = useState<UnbilledLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('mg_tms')
          .select('ld_num, chassis_number, customer_name, acct_mg_name, status, created_date, pickup_actual_date, delivery_actual_date, cust_rate_charge, cust_invoice_charge, unbilledflag')
          .eq('unbilledflag', 'Y')
          .not('status', 'in', '("Cancelled","Void")')
          .order('created_date', { ascending: true })
        if (fetchErr) throw fetchErr
        setLoads(data || [])
      } catch (err: unknown) {
        console.error('Unbilled loads query error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load unbilled loads')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const totalAtRisk = loads.reduce((s, l) => s + (Number(l.cust_rate_charge) || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unbilled Loads</h1>
        <p className="text-muted-foreground">Loads flagged as unbilled that need invoicing attention</p>
      </div>

      <DataFreshnessBar tableName="mg_tms" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30">
          Query error — data could not be loaded. Check console for details.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unbilled Loads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{loads.length.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total at Risk</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{formatCurrency(totalAtRisk)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
            </div>
          ) : !error && loads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No records found for the current filters.</p>
          ) : !error ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Chassis</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Account Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead className="text-right">Rate Charge</TableHead>
                    <TableHead className="text-right">Invoice Charge</TableHead>
                    <TableHead className="text-right">Days Since Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loads.map((l, i) => {
                    const days = daysSince(l.created_date)
                    return (
                      <TableRow key={`${l.ld_num}-${i}`}>
                        <TableCell className="font-mono text-sm">{l.ld_num || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{l.chassis_number?.trim() || 'N/A'}</TableCell>
                        <TableCell>{l.customer_name || 'N/A'}</TableCell>
                        <TableCell>{l.acct_mg_name || 'N/A'}</TableCell>
                        <TableCell><Badge variant="outline">{l.status || 'N/A'}</Badge></TableCell>
                        <TableCell>{formatDate(l.created_date)}</TableCell>
                        <TableCell>{formatDate(l.delivery_actual_date)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(l.cust_rate_charge)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(l.cust_invoice_charge)}</TableCell>
                        <TableCell className="text-right">{ageBadge(days)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
