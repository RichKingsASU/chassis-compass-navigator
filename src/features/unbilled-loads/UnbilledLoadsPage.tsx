import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface UnbilledLoad {
  ld_num: string
  chassis_number: string
  customer_name: string
  acct_mg_name: string
  status: string
  created_date: string
  delivery_actual_date: string
  cust_rate_charge: number
  cust_invoice_charge: number
  unbilledflag: string
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

export default function UnbilledLoadsPage() {
  const [loads, setLoads] = useState<UnbilledLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('mg_data')
          .select('ld_num, chassis_number, customer_name, acct_mg_name, status, created_date, delivery_actual_date, cust_rate_charge, cust_invoice_charge, unbilledflag')
          .eq('unbilledflag', 'Y')
          .not('status', 'in', '("Cancelled","Void")')
          .order('created_date', { ascending: true })
        if (fetchErr) throw fetchErr
        setLoads(data || [])
      } catch (err) {
        console.error('[UnbilledLoads] load failed:', err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalAtRisk = loads.reduce((s, r) => s + (Number(r.cust_rate_charge) || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unbilled Loads</h1>
        <p className="text-muted-foreground">
          {loads.length} unbilled loads | {formatCurrency(totalAtRisk)} total at risk
        </p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Unbilled Queue</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : loads.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No unbilled loads found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Acct Mgr</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Days Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loads.map(r => {
                    const days = daysSince(r.created_date)
                    return (
                      <TableRow key={r.ld_num}>
                        <TableCell className="font-mono text-sm">{r.ld_num}</TableCell>
                        <TableCell className="font-mono text-sm">{r.chassis_number?.trim() || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{r.customer_name || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{r.acct_mg_name || 'N/A'}</TableCell>
                        <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                        <TableCell className="text-sm">{formatDate(r.created_date)}</TableCell>
                        <TableCell className="text-sm">{formatDate(r.delivery_actual_date)}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(r.cust_rate_charge)}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(r.cust_invoice_charge)}</TableCell>
                        <TableCell>
                          {days != null ? (
                            <Badge variant={days > 30 ? 'destructive' : days > 14 ? 'secondary' : 'outline'}>
                              {days}d
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
