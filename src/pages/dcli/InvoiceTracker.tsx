import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Filter, FileText, AlertCircle } from 'lucide-react'
import {
  type DcliInvoice,
  INVOICE_STATUSES,
  statusBadgeClass,
} from '@/types/invoice'
import { useQuery } from '@tanstack/react-query'

export default function InvoiceTracker() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['dcli_invoice'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_invoice')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as DcliInvoice[]
    }
  })

  const filtered = useMemo(() => 
    invoices.filter(inv => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'unset') {
          if (inv.portal_status) return false
        } else if (inv.portal_status !== statusFilter) {
          return false
        }
      }
      if (search) {
        const q = search.toLowerCase()
        return (
          inv.invoice_number?.toLowerCase().includes(q) ||
          inv.account_code?.toLowerCase().includes(q) ||
          inv.vendor?.toLowerCase().includes(q)
        )
      }
      return true
    }),
    [invoices, statusFilter, search]
  )

  const statusCounts = useMemo(() => 
    INVOICE_STATUSES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = invoices.filter(i => i.portal_status === s).length
      return acc
    }, {}),
    [invoices]
  )
  const unsetCount = useMemo(() => invoices.filter(i => !i.portal_status).length, [invoices])
  const hasReviewers = useMemo(() => invoices.some(inv => inv.reviewed_by), [invoices])

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Tracker</h1>
          <p className="text-muted-foreground mt-1">Track and manage DCLI invoice lifecycle and portal statuses</p>
        </div>
        <Link to="/vendors/dcli/invoices/new">
          <Button size="lg" className="gap-2 font-bold shadow-lg shadow-primary/20">
            <Plus size={18} strokeWidth={3} /> New Invoice
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{error instanceof Error ? error.message : 'Failed to synchronize invoices'}</p>
        </div>
      )}

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2 pb-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="rounded-full px-4 font-bold uppercase tracking-widest text-[10px]"
        >
          All ({invoices.length})
        </Button>
        {unsetCount > 0 && (
          <Button
            variant={statusFilter === 'unset' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('unset')}
            className="rounded-full px-4 font-bold uppercase tracking-widest text-[10px]"
          >
            No Status ({unsetCount})
          </Button>
        )}
        {INVOICE_STATUSES.map(s => {
          const count = statusCounts[s]
          if (!count) return null
          return (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 font-bold uppercase tracking-widest text-[10px] transition-all ${
                statusFilter === s ? '' : 'hover:bg-muted'
              }`}
            >
              {s} ({count})
            </Button>
          )
        })}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice #, account, or vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-muted/30 border-2"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-full sm:w-64 border-2">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Portal Statuses</SelectItem>
              <SelectItem value="unset">No Status Set</SelectItem>
              {INVOICE_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Invoices ({filtered.length})</CardTitle>
            <Badge variant="outline" className="bg-background text-[10px] font-black uppercase tracking-tighter">
              LIVE DATA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <TableHead className="px-6 py-4">Invoice #</TableHead>
                <TableHead className="px-6 py-4">Date</TableHead>
                <TableHead className="px-6 py-4">Due Date</TableHead>
                <TableHead className="px-6 py-4">Account</TableHead>
                <TableHead className="px-6 py-4 text-right">Amount</TableHead>
                <TableHead className="px-6 py-4">Portal Status</TableHead>
                {hasReviewers && <TableHead className="px-6 py-4">Audit</TableHead>}
                <TableHead className="px-6 py-4 text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={hasReviewers ? 8 : 7} className="px-6 py-4">
                      <Skeleton className="h-8 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasReviewers ? 8 : 7} className="px-6 py-20 text-center text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} strokeWidth={1} />
                      <p>No matching invoices found in your history.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(inv => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-6 py-4 font-mono font-black text-sm text-foreground">
                      {inv.invoice_number || inv.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs font-medium">{inv.invoice_date ?? '—'}</TableCell>
                    <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground">{inv.due_date ?? '—'}</TableCell>
                    <TableCell className="px-6 py-4 text-xs font-bold uppercase">{inv.account_code ?? '—'}</TableCell>
                    <TableCell className="px-6 py-4 text-right font-black text-primary">
                      {inv.total_amount != null ? formatCurrency(inv.total_amount) : '—'}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${statusBadgeClass(inv.portal_status)} font-bold text-[10px] uppercase tracking-wider py-1 px-3`}>
                        {inv.portal_status || 'NOT SET'}
                      </Badge>
                    </TableCell>
                    {hasReviewers && (
                      <TableCell className="px-6 py-4 text-[11px] font-semibold text-muted-foreground">
                        {inv.reviewed_by?.split('@')[0] ?? '—'}
                      </TableCell>
                    )}
                    <TableCell className="px-6 py-4 text-right">
                      <Link to={`/vendors/dcli/invoices/${inv.id}/detail`}>
                        <Button variant="ghost" size="sm" className="h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          View Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
