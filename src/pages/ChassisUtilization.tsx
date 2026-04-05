import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface ChassisUtilRow {
  chassis_number: string
  total_loads: number
  completed_loads: number
  total_revenue: number
  total_carrier_cost: number
}

export default function ChassisUtilization() {
  const [rows, setRows] = useState<ChassisUtilRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Aggregate from mg_tms
        const { data, error: fetchErr } = await supabase
          .from('mg_tms')
          .select('chassis_number, cust_rate_charge, carrier_rate_charge, status, zero_rev')
        if (fetchErr) throw fetchErr

        const map = new Map<string, ChassisUtilRow>()
        for (const r of (data || [])) {
          const cn = (r.chassis_number || '').trim()
          if (!cn) continue
          const existing = map.get(cn) || {
            chassis_number: cn,
            total_loads: 0,
            completed_loads: 0,
            total_revenue: 0,
            total_carrier_cost: 0,
          }
          existing.total_loads++
          if (!['Cancelled', 'Void'].includes(r.status)) {
            existing.completed_loads++
          }
          if (r.zero_rev !== 'Y') {
            existing.total_revenue += Number(r.cust_rate_charge) || 0
          }
          existing.total_carrier_cost += Number(r.carrier_rate_charge) || 0
          map.set(cn, existing)
        }
        const sorted = Array.from(map.values()).sort((a, b) => b.total_loads - a.total_loads)
        setRows(sorted)
      } catch (err) {
        console.error('[ChassisUtilization] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load utilization data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalRevenue = rows.reduce((s, r) => s + r.total_revenue, 0)
  const totalLoads = rows.reduce((s, r) => s + r.total_loads, 0)
  const totalCarrierCost = rows.reduce((s, r) => s + r.total_carrier_cost, 0)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Utilization</h1>
        <p className="text-muted-foreground">Fleet performance analytics aggregated from TMS data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{rows.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              Total Revenue
              <UITooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent>Excludes cancelled and zero-revenue loads</TooltipContent>
              </UITooltip>
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalLoads.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Margin</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{formatCurrency(totalRevenue - totalCarrierCost)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Utilization by Chassis</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No utilization data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead className="text-right">Total Loads</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Carrier Cost</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 200).map(r => {
                    const margin = r.total_revenue - r.total_carrier_cost
                    return (
                      <TableRow key={r.chassis_number}>
                        <TableCell className="font-mono font-medium">{r.chassis_number}</TableCell>
                        <TableCell className="text-right">{r.total_loads}</TableCell>
                        <TableCell className="text-right">{r.completed_loads}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.total_revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.total_carrier_cost)}</TableCell>
                        <TableCell className={`text-right ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(margin)}
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
