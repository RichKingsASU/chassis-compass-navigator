import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InvoiceLine {
  id: string
  invoice_id: string
  chassis_number: string
  container_number: string
  vendor: string
  pickup_date: string
  return_date: string
  days: number
  amount: number
  status: string
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'matched': return 'default'
    case 'approved': return 'default'
    case 'disputed': return 'destructive'
    case 'unmatched': return 'destructive'
    case 'pending': return 'secondary'
    default: return 'outline'
  }
}

const PAGE_SIZE = 25

export default function InvoicesList() {
  const navigate = useNavigate()
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadLines()
  }, [page, search])

  async function loadLines() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('invoice_lines')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (search.trim()) {
        query = query.or(
          `chassis_number.ilike.%${search}%,container_number.ilike.%${search}%,vendor.ilike.%${search}%`
        )
      }

      const { data, error: fetchErr, count } = await query
      if (fetchErr) throw fetchErr
      setLines(data || [])
      setTotal(count || 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice lines')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(0)
    loadLines()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Lines</h1>
          <p className="text-muted-foreground mt-1">All invoice line items across vendors</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">{total.toLocaleString()} total records</Badge>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{page + 1} / {totalPages || 1}</p>
            <p className="text-xs text-muted-foreground mt-1">Page {page + 1} of {totalPages || 1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Showing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lines.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Records this page</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Invoice Lines</CardTitle>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search chassis, container, vendor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-64"
              />
              <Button type="submit" variant="outline" size="sm">Search</Button>
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(''); setPage(0); }}
                >
                  Clear
                </Button>
              )}
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading invoice lines...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {search ? 'No results found for your search.' : 'No invoice lines found.'}
                      </TableCell>
                    </TableRow>
                  ) : lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-sm">{line.chassis_number}</TableCell>
                      <TableCell className="font-mono text-sm">{line.container_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{line.vendor || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {line.pickup_date ? new Date(line.pickup_date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {line.return_date ? new Date(line.return_date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>{line.days ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {line.amount != null ? `$${Number(line.amount).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(line.status)}>
                          {line.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link to={`/invoices/line/${line.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Link to={`/invoices/line/${line.id}/dispute`}>
                            <Button variant="ghost" size="sm" className="text-destructive">Dispute</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()} records
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
