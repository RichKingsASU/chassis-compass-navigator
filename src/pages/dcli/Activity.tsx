import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DcliActivityRow {
  id: number
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  invoice_amount: number | null
  amount_paid: number | null
  amount_due: number | null
  invoice_status: string | null
  invoice_category: string | null
  created_at: string
}

const PAGE_SIZE = 50

export default function DCLIActivity() {
  const [rows, setRows] = useState<DcliActivityRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('dcli_activity')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })

        if (search.trim()) {
          query = query.ilike('invoice_number', `%${search.trim()}%`)
        }

        const { data, error: fetchErr, count } = await query
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (fetchErr) throw fetchErr
        setRows(data || [])
        setTotalCount(count ?? 0)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [search, page])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function statusColor(status: string | null): string {
    if (!status) return 'secondary'
    const s = status.toLowerCase()
    if (s.includes('paid') || s.includes('closed')) return 'default'
    if (s.includes('open') || s.includes('pending')) return 'outline'
    if (s.includes('dispute') || s.includes('overdue')) return 'destructive'
    return 'secondary'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DCLI Activity</h1>
        <p className="text-muted-foreground">
          Chassis activity from dcli_activity — {totalCount.toLocaleString()} records
        </p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by invoice number..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading activity...</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No matching records found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.invoice_number ?? '—'}</TableCell>
                      <TableCell>{row.invoice_category ?? '—'}</TableCell>
                      <TableCell>
                        {row.invoice_status ? (
                          <Badge variant={statusColor(row.invoice_status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                            {row.invoice_status}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{formatDate(row.invoice_date)}</TableCell>
                      <TableCell>{formatDate(row.due_date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.invoice_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.amount_paid)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.amount_due)}</TableCell>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
