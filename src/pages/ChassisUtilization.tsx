import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface UtilRecord {
  chassis_number: string
  total_loads: number
  completed_loads: number
  total_revenue: number
  total_carrier_cost: number
  total_margin: number
  first_load_date: string
  last_load_date: string
}

export default function ChassisUtilization() {
  const [data, setData] = useState<UtilRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Try view first, fall back to aggregation from mg_data
        const { data: viewData, error: viewErr } = await supabase
          .from('v_chassis_utilization')
          .select('*')
          .order('total_loads', { ascending: false })
          .limit(500)

        if (!viewErr && viewData) {
          setData(viewData)
        } else {
          // Fallback: aggregate from mg_data directly
          const { data: rawData, error: rawErr } = await supabase
            .from('mg_data')
            .select('chassis_number, customer_rate_amount, carrier_rate_amount, status, zero_rev, createdate')
            .not('chassis_number', 'is', null)
          if (rawErr) throw rawErr

          const map = new Map<string, UtilRecord>()
          for (const row of (rawData || [])) {
            const cn = (row.chassis_number as string)?.trim()
            if (!cn) continue
            const existing = map.get(cn) || {
              chassis_number: cn, total_loads: 0, completed_loads: 0,
              total_revenue: 0, total_carrier_cost: 0, total_margin: 0,
              first_load_date: row.createdate, last_load_date: row.createdate,
            }
            existing.total_loads++
            if (!['Cancelled', 'Void'].includes(row.status)) existing.completed_loads++
            if (row.zero_rev !== 'Y') existing.total_revenue += parseFloat(row.customer_rate_amount) || 0
            existing.total_carrier_cost += parseFloat(row.carrier_rate_amount) || 0
            existing.total_margin = existing.total_revenue - existing.total_carrier_cost
            if (row.createdate < existing.first_load_date) existing.first_load_date = row.createdate
            if (row.createdate > existing.last_load_date) existing.last_load_date = row.createdate
            map.set(cn, existing)
          }
          setData(Array.from(map.values()).sort((a, b) => b.total_loads - a.total_loads))
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load utilization data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = search ? data.filter(d => d.chassis_number.trim().toUpperCase().includes(search.toUpperCase().trim())) : data
  const totalRevenue = data.reduce((s, d) => s + (d.total_revenue || 0), 0)
  const totalLoads = data.reduce((s, d) => s + (d.total_loads || 0), 0)
  const totalMargin = data.reduce((s, d) => s + (d.total_margin || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Utilization</h1>
        <p className="text-muted-foreground">Fleet performance analytics</p>
      </div>
      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Chassis Tracked</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{data.length}</p>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1">Total Revenue<Tooltip><TooltipTrigger asChild><span className="text-xs cursor-help">(?)</span></TooltipTrigger><TooltipContent>Excludes cancelled and zero-revenue loads</TooltipContent></Tooltip></CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{safeAmount(totalRevenue)}</p>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{totalLoads.toLocaleString()}</p>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Margin</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className={`text-3xl font-bold ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{safeAmount(totalMargin)}</p>}</CardContent></Card>
      </div>
      <input type="text" placeholder="Search chassis number..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
      <Card>
        <CardHeader><CardTitle>Utilization by Chassis</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          : filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">No utilization data available.</p>
          : <div className="overflow-x-auto"><Table><TableHeader><TableRow>
            <TableHead>Chassis #</TableHead><TableHead className="text-right">Total Loads</TableHead><TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Carrier Cost</TableHead><TableHead className="text-right">Margin</TableHead>
            <TableHead>First Load</TableHead><TableHead>Last Load</TableHead>
          </TableRow></TableHeader><TableBody>
            {filtered.slice(0, 100).map(d => (
              <TableRow key={d.chassis_number}>
                <TableCell className="font-mono font-medium">{d.chassis_number}</TableCell>
                <TableCell className="text-right">{d.total_loads}</TableCell>
                <TableCell className="text-right">{d.completed_loads}</TableCell>
                <TableCell className="text-right">{safeAmount(d.total_revenue)}</TableCell>
                <TableCell className="text-right">{safeAmount(d.total_carrier_cost)}</TableCell>
                <TableCell className="text-right"><Badge variant={d.total_margin >= 0 ? 'default' : 'destructive'}>{safeAmount(d.total_margin)}</Badge></TableCell>
                <TableCell className="text-sm">{d.first_load_date || 'N/A'}</TableCell>
                <TableCell className="text-sm">{d.last_load_date || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></div>}
        </CardContent>
      </Card>
    </div>
  )
}
