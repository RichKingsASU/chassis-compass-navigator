import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import DataFreshnessBar from '@/components/DataFreshnessBar'
import { useQuery } from '@tanstack/react-query'

interface ActiveLoad {
  id: string
  ld_num: string
  chassis_number: string | null
  container_number: string | null
  customer_name: string | null
  carrier_name: string | null
  status: string | null
  pickup_actual_date: string | null
  delivery_actual_date: string | null
  cust_rate_charge: number | null
  unbilledflag: string | null
  acct_mg_name: string | null
}

export default function ActiveLoads() {
  const [search, setSearch] = useState('')
  const [unbilledOnly, setUnbilledOnly] = useState(false)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Reset pagination when search or unbilled changes
  useEffect(() => {
    setPage(1)
  }, [search, unbilledOnly])

  const { data: records = [], isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['mg_tms_active_loads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mg_data')
        .select('id, ld_num, chassis_number, container_number, customer_name, carrier_name, status, pickup_actual_date, delivery_actual_date, cust_rate_charge, unbilledflag, acct_mg_name')
        .not('status', 'in', '("Cancelled","Void","Rejected")')
        .order('pickup_actual_date', { ascending: false })
        .limit(1000)
      if (error) throw error
      return data || []
    }
  })

  const error = fetchError ? (fetchError as Error).message : null

  const unbilledCount = records.filter(r => r.unbilledflag === 'Y').length

  const filtered = records.filter(r => {
    if (unbilledOnly && r.unbilledflag !== 'Y') return false
    if (!search) return true
    const q = search.toUpperCase()
    return (
      r.ld_num?.includes(q) ||
      r.chassis_number?.includes(q) ||
      r.container_number?.includes(q) ||
      r.customer_name?.toUpperCase().includes(q) ||
      r.carrier_name?.toUpperCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedRecords = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Active Loads</h1>
        <p className="text-muted-foreground mt-2">Current loads from Mercury Gate TMS — excludes cancelled and void</p>
      </div>

      <DataFreshnessBar tableName="mg_data" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30">
          Query error — data could not be loaded. {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Loads</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{records.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Filtered</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{filtered.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unbilled</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold text-red-600">{unbilledCount.toLocaleString()}</p>}</CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search LD#, chassis, container, customer, carrier..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 border rounded-md text-sm"
        />
        <Button
          variant={unbilledOnly ? 'default' : 'outline'}
          onClick={() => setUnbilledOnly(!unbilledOnly)}
        >
          Unbilled Only ({unbilledCount})
        </Button>
        <Button variant="outline" onClick={() => { setSearch(''); setUnbilledOnly(false) }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !error && filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No records found for the current filters.</p>
          ) : !error ? (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Unbilled</TableHead>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Container #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Account Manager</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Customer Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map(r => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{r.ld_num || 'N/A'}</TableCell>
                        <TableCell>
                          {r.unbilledflag === 'Y' && <Badge className="bg-red-100 text-red-800 border-red-300">UNBILLED</Badge>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{r.chassis_number?.trim() || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{r.container_number || 'N/A'}</TableCell>
                        <TableCell>{r.customer_name || 'N/A'}</TableCell>
                        <TableCell>{r.carrier_name || 'N/A'}</TableCell>
                        <TableCell>{r.acct_mg_name || 'N/A'}</TableCell>
                        <TableCell>{formatDate(r.pickup_actual_date)}</TableCell>
                        <TableCell>{formatDate(r.delivery_actual_date)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.cust_rate_charge)}</TableCell>
                        <TableCell><Badge variant="outline">{r.status || 'N/A'}</Badge></TableCell>
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
