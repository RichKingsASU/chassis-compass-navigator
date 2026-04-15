import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  type DcliInvoice,
  INVOICE_STATUSES,
  statusBadgeClass,
} from '@/types/invoice'

export default function InvoiceTracker() {
  const [invoices, setInvoices] = useState<DcliInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice')
          .select('*')
          .order('created_at', { ascending: false })
        if (fetchErr) throw fetchErr
        setInvoices(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.portal_status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.account_code?.toLowerCase().includes(q) ||
        inv.vendor?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const statusCounts = INVOICE_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = invoices.filter(i => i.portal_status === s).length
    return acc
  }, {})
  const unsetCount = invoices.filter(i => !i.portal_status).length
  const hasReviewers = invoices.some(inv => inv.reviewed_by)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Tracker</h1>
          <p className="text-muted-foreground">Track and manage DCLI invoice portal statuses</p>
        </div>
        <Link to="/vendors/dcli/invoices/new">
          <Button>+ New Invoice</Button>
        </Link>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {/* Status summary cards */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          }`}
        >
          All ({invoices.length})
        </button>
        {unsetCount > 0 && (
          <button
            onClick={() => setStatusFilter('unset')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === 'unset'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            No Status ({unsetCount})
          </button>
        )}
        {INVOICE_STATUSES.map(s => {
          const count = statusCounts[s]
          if (!count) return null
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border border-primary'
                  : `${statusBadgeClass(s)} hover:opacity-80`
              }`}
            >
              {s} ({count})
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search invoice #, account, vendor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by portal status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unset">No Status Set</SelectItem>
            {INVOICE_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading invoices...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoices ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Portal Status</TableHead>
                  {hasReviewers && <TableHead>Reviewed By</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={hasReviewers ? 8 : 7} className="text-center text-muted-foreground">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium font-mono">
                        {inv.invoice_number || inv.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{inv.invoice_date ?? '—'}</TableCell>
                      <TableCell>{inv.due_date ?? '—'}</TableCell>
                      <TableCell>{inv.account_code ?? '—'}</TableCell>
                      <TableCell>{inv.total_amount != null ? formatCurrency(inv.total_amount) : '—'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(inv.portal_status)}`}>
                          {inv.portal_status || 'Not Set'}
                        </span>
                      </TableCell>
                      {hasReviewers && (
                        <TableCell className="text-sm text-muted-foreground">
                          {inv.reviewed_by ?? '—'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Link to={`/vendors/dcli/invoices/${inv.id}/detail`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
