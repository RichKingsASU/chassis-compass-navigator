import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useQuery } from '@tanstack/react-query'

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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Reset pagination when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  const { data = [], isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['mg_data_utilization'],
    queryFn: async () => {
      const { data: rawData, error } = await supabase
        .from('mg_data')
        .select('chassis_number, customer_rate_amount, carrier_rate_amount, status, zero_rev, create_date')
        .not('chassis_number', 'is', null)

      if (error) throw error

      const map = new Map<string, UtilRecord>()
      for (const row of (rawData || [])) {
        const cn = (row.chassis_number as string)?.trim()
        if (!cn) continue
        const existing = map.get(cn) || {
          chassis_number: cn,
          total_loads: 0,
          completed_loads: 0,
          total_revenue: 0,
          total_carrier_cost: 0,
          total_margin: 0,
          first_load_date: row.create_date as string,
          last_load_date: row.create_date as string,
        }
        existing.total_loads++
        if (!['Cancelled', 'Void'].includes(row.status as string)) existing.completed_loads++
        if (row.zero_rev !== 'Y') existing.total_revenue += parseFloat(row.customer_rate_amount as string) || 0
        existing.total_carrier_cost += parseFloat(row.carrier_rate_amount as string) || 0
        existing.total_margin = existing.total_revenue - existing.total_carrier_cost
        if (row.create_date && row.create_date < existing.first_load_date) existing.first_load_date = row.create_date as string
        if (row.create_date && row.create_date > existing.last_load_date) existing.last_load_date = row.create_date as string
        map.set(cn, existing)
      }
      return Array.from(map.values()).sort((a, b) => b.total_loads - a.total_loads)
    }
  })

  const error = fetchError ? (fetchError as Error).message : null

  const filtered = search ? data.filter(d => d.chassis_number.trim().toUpperCase().includes(search.toUpperCase().trim())) : data
  const totalRevenue = data.reduce((s, d) => s + (d.total_revenue || 0), 0)
  const totalLoads = data.reduce((s, d) => s + (d.total_loads || 0), 0)
  const totalMargin = data.reduce((s, d) => s + (d.total_margin || 0), 0)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedRecords = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Chassis Utilization</h1>
        <p className="text-muted-foreground mt-2">Fleet performance analytics</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Chassis Tracked</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{data.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              Total Revenue
              <Tooltip><TooltipTrigger asChild><span className="text-xs cursor-help">(?)</span></TooltipTrigger><TooltipContent>Excludes cancelled and zero-revenue loads</TooltipContent></Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{safeAmount(totalRevenue)}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{totalLoads.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Margin</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className={`text-3xl font-bold ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{safeAmount(totalMargin)}</p>}</CardContent>
        </Card>
      </div>

      <input 
        type="text" 
        placeholder="Search chassis number..." 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
        className="w-full max-w-md px-4 py-2 border rounded-md text-sm" 
      />

      <Card>
        <CardHeader><CardTitle>Utilization by Chassis</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No utilization data available.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead className="text-right">Total Loads</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Carrier Cost</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead>First Load</TableHead>
                      <TableHead>Last Load</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map(d => (
                      <TableRow key={d.chassis_number} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium text-sm">{d.chassis_number}</TableCell>
                        <TableCell className="text-right">{d.total_loads}</TableCell>
                        <TableCell className="text-right">{d.completed_loads}</TableCell>
                        <TableCell className="text-right">{safeAmount(d.total_revenue)}</TableCell>
                        <TableCell className="text-right">{safeAmount(d.total_carrier_cost)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={d.total_margin >= 0 ? 'default' : 'destructive'}>{safeAmount(d.total_margin)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{d.first_load_date?.slice(0, 10) || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{d.last_load_date?.slice(0, 10) || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filtered.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
