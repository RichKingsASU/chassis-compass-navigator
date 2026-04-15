import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface MGLoad {
  id: string
  ld_num: string
  chassis_number: string
  acct_mgr_name: string
  status: string
  create_date: string
  drop_actual_date: string
  customer_rate_amount: string
  customer_inv_amount: string
  zero_rev: string
}

export default function UnbilledLoadsPage() {
  const [loads, setLoads] = useState<MGLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('mg_data')
          .select('id, ld_num, chassis_number, acct_mgr_name, status, create_date, drop_actual_date, customer_rate_amount, customer_inv_amount, zero_rev')
          .not('status', 'in', '("Cancelled","Void")')
          .neq('zero_rev', 'Y')
          .order('create_date', { ascending: true })
          .limit(500)
        if (fetchErr) throw fetchErr
        const unbilled = (data || []).filter(r => {
          const rate = parseFloat(r.customer_rate_amount) || 0
          const inv = parseFloat(r.customer_inv_amount) || 0
          return rate > 0 && inv === 0
        })
        setLoads(unbilled)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalAtRisk = loads.reduce((s, l) => s + (parseFloat(l.customer_rate_amount) || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unbilled Loads</h1>
        <p className="text-muted-foreground">Loads with customer rate but no invoice — revenue at risk</p>
      </div>
      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unbilled Loads</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{loads.length}</p>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total at Risk</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold text-red-600">{safeAmount(totalAtRisk)}</p>}</CardContent></Card>
      </div>
      <Card><CardContent className="pt-4">
        {loading ? <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
          <div className="overflow-x-auto"><Table><TableHeader><TableRow>
            <TableHead>Load #</TableHead><TableHead>Chassis #</TableHead><TableHead>Acct Mgr</TableHead><TableHead>Status</TableHead>
            <TableHead>Created</TableHead><TableHead>Delivered</TableHead><TableHead>Rate</TableHead><TableHead>Invoice</TableHead>
          </TableRow></TableHeader><TableBody>
            {loads.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No unbilled loads found.</TableCell></TableRow>
            : loads.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-sm">{l.ld_num || 'N/A'}</TableCell>
                <TableCell className="font-mono text-sm">{l.chassis_number?.trim() || 'N/A'}</TableCell>
                <TableCell className="text-sm">{l.acct_mgr_name || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{l.status || 'N/A'}</Badge></TableCell>
                <TableCell className="text-sm">{safeDate(l.create_date)}</TableCell>
                <TableCell className="text-sm">{safeDate(l.drop_actual_date)}</TableCell>
                <TableCell className="text-sm">{safeAmount(l.customer_rate_amount)}</TableCell>
                <TableCell className="text-sm">{safeAmount(l.customer_inv_amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></div>
        )}
      </CardContent></Card>
    </div>
  )
}
