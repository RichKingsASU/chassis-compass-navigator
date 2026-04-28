import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'

interface InvoiceLine {
  id: string
  chassis_number: string
  container_number: string
  provider: string
  invoice_number: string
  pickup_date: string
  return_date: string
  days: number
  rate: number
  amount: number
  status: string
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'matched': return 'default'
    case 'disputed': return 'destructive'
    case 'pending': return 'secondary'
    case 'unmatched': return 'destructive'
    default: return 'outline'
  }
}

export default function InvoicesList() {
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Reset pagination when any filter changes
  useEffect(() => {
    setPage(1)
  }, [search, providerFilter, statusFilter])

  const { data: lines = [], isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['invoice_lines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_lines')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
      if (error) throw error
      return data || []
    }
  })

  const error = fetchError ? (fetchError as Error).message : null

  let filtered = lines
  if (search) {
    const q = search.toUpperCase()
    filtered = filtered.filter(l =>
      l.chassis_number?.includes(q) ||
      l.container_number?.includes(q) ||
      l.invoice_number?.includes(q)
    )
  }
  if (providerFilter !== 'all') {
    filtered = filtered.filter(l => l.provider === providerFilter)
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(l => l.status?.toLowerCase() === statusFilter)
  }

  const providers = [...new Set(lines.map(l => l.provider).filter(Boolean))]
  const totalAmount = lines.reduce((sum, l) => sum + (l.amount || 0), 0)
  const disputedCount = lines.filter(l => l.status?.toLowerCase() === 'disputed').length

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedLines = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Invoice Lines</h1>
        <p className="text-muted-foreground mt-2">All invoice line items across all vendors</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Lines</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{lines.length.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Amount</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disputed</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold text-red-600">{disputedCount}</p>}</CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis, container, invoice#..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border rounded-md text-sm"
        />
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearch(''); setProviderFilter('all'); setStatusFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Container #</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLines.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground h-24">No invoice lines found.</TableCell></TableRow>
                    ) : paginatedLines.map(line => (
                      <TableRow key={line.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{line.chassis_number}</TableCell>
                        <TableCell className="font-mono text-sm">{line.container_number || 'N/A'}</TableCell>
                        <TableCell><Badge variant="outline">{line.provider}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{line.invoice_number}</TableCell>
                        <TableCell className="text-sm">{formatDate(line.pickup_date)}</TableCell>
                        <TableCell className="text-sm">{formatDate(line.return_date)}</TableCell>
                        <TableCell>{line.days}</TableCell>
                        <TableCell>{formatCurrency(line.amount)}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(line.status)}>{line.status || 'N/A'}</Badge></TableCell>
                        <TableCell className="flex gap-2">
                          <Link to={`/invoices/line/${line.id}`}><Button variant="outline" size="sm">View</Button></Link>
                          <Link to={`/invoices/line/${line.id}/dispute`}><Button variant="destructive" size="sm">Dispute</Button></Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filtered.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} lines
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
