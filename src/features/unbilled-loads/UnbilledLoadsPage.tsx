import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'

interface UnbilledRow {
  id: string
  ld_num: string | null
  so_num: string | null
  chassis_number: string | null
  container_number: string | null
  status: string | null
  acct_mgr: string | null
  carrier_name: string | null
  steamship_line: string | null
  pickup_loc_name: string | null
  pickup_region: string | null
  drop_loc_name: string | null
  drop_region: string | null
  create_date: string | null
  pickup_actual_date: string | null
  drop_actual_date: string | null
  actual_rc_date: string | null
  customer_rate_amount: number | null
  customer_inv_amount: number | null
  carrier_rate_amount: number | null
  carrier_inv_amount: number | null
  margin_rate: number | null
  margin_invoice: number | null
  zero_rev: string | null
  days_since_drop: number | null
  revenue_at_risk: number | null
  unbilled_reason: string | null
}

type ReasonFilter = 'ALL' | 'INVOICE_ZERO' | 'NO_CHASSIS'

export default function UnbilledLoadsPage() {
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('ALL')

  const { data = [], isLoading: loading, error: fetchError } = useQuery<UnbilledRow[]>({
    queryKey: ['v_unbilled_loads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_unbilled_loads')
        .select('*')
      if (error) throw error
      return (data || []) as UnbilledRow[]
    },
  })

  const error = fetchError ? (fetchError as Error).message : null

  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) => (Number(b.revenue_at_risk) || 0) - (Number(a.revenue_at_risk) || 0),
      ),
    [data],
  )

  const invoiceZeroCount = data.filter((r) => r.unbilled_reason === 'INVOICE_ZERO').length
  const noChassisCount = data.filter((r) => r.unbilled_reason === 'NO_CHASSIS').length

  const filtered = reasonFilter === 'ALL' ? sorted : sorted.filter((r) => r.unbilled_reason === reasonFilter)

  const totalAtRisk = data.reduce((s, r) => s + (Number(r.revenue_at_risk) || 0), 0)
  const avgDaysSinceDrop = data.length
    ? data.reduce((s, r) => s + (Number(r.days_since_drop) || 0), 0) / data.length
    : 0

  const renderReasonBadge = (reason: string | null) => {
    if (reason === 'INVOICE_ZERO') {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          Invoice Zero
        </Badge>
      )
    }
    if (reason === 'NO_CHASSIS') {
      return <Badge variant="destructive">No Chassis</Badge>
    }
    return <Badge variant="outline">{reason || '—'}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unbilled Loads</h1>
        <p className="text-muted-foreground">Loads with customer rate but no invoice — revenue at risk</p>
      </div>
      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unbilled Loads</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{data.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total at Risk</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold text-red-600">{safeAmount(totalAtRisk)}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Days Since Drop</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{avgDaysSinceDrop.toFixed(1)}</p>}</CardContent>
        </Card>
      </div>

      <Tabs value={reasonFilter} onValueChange={(v) => setReasonFilter(v as ReasonFilter)}>
        <TabsList>
          <TabsTrigger value="ALL">All ({data.length})</TabsTrigger>
          <TabsTrigger value="INVOICE_ZERO">Invoice Zero ({invoiceZeroCount})</TabsTrigger>
          <TabsTrigger value="NO_CHASSIS">No Chassis ({noChassisCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>SO #</TableHead>
                    <TableHead>Chassis</TableHead>
                    <TableHead>Container</TableHead>
                    <TableHead>Acct Mgr</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Days Since Drop</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No unbilled loads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-sm">{l.ld_num || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{l.so_num || '—'}</TableCell>
                        <TableCell className="font-mono text-sm">{l.chassis_number?.trim() || '—'}</TableCell>
                        <TableCell className="font-mono text-sm">{l.container_number || '—'}</TableCell>
                        <TableCell className="text-sm">{l.acct_mgr || '—'}</TableCell>
                        <TableCell className="text-sm">{l.drop_region || l.pickup_region || '—'}</TableCell>
                        <TableCell><Badge variant="outline">{l.status || 'N/A'}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{l.days_since_drop ?? '—'}</TableCell>
                        <TableCell className="text-right text-sm">{safeAmount(l.customer_rate_amount)}</TableCell>
                        <TableCell>{renderReasonBadge(l.unbilled_reason)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
