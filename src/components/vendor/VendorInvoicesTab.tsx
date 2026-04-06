import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { safeDate } from '@/lib/formatters'

export interface VendorInvoice {
  id: number
  vendor_slug: string
  invoice_number: string
  invoice_date: string
  due_date: string
  invoice_amount: number
  invoice_category: string | null
  invoice_status: string | null
  notes: string | null
  created_at: string
}

type SortKey = 'invoice_date' | 'invoice_amount' | 'invoice_status'

function statusBadgeClass(status: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    case 'approved': return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'disputed': return 'bg-red-100 text-red-800 hover:bg-red-100'
    case 'paid': return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export interface VendorInvoicesTabProps {
  vendorSlug: string
  refreshKey?: number
  onNewInvoice: () => void
  onDataLoaded?: (invoices: VendorInvoice[]) => void
}

export function VendorInvoicesTab({ vendorSlug, refreshKey = 0, onNewInvoice, onDataLoaded }: VendorInvoicesTabProps) {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('invoice_date')
  const [sortAsc, setSortAsc] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('vendor_invoices')
        .select('*')
        .eq('vendor_slug', vendorSlug.toLowerCase())
        .order('invoice_date', { ascending: false })
      if (fetchErr) throw fetchErr
      const rows = (data || []) as VendorInvoice[]
      setInvoices(rows)
      onDataLoaded?.(rows)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [vendorSlug, onDataLoaded])

  useEffect(() => { load() }, [load, refreshKey])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sorted = [...invoices].sort((a, b) => {
    const dir = sortAsc ? 1 : -1
    if (sortKey === 'invoice_amount') return (a.invoice_amount - b.invoice_amount) * dir
    if (sortKey === 'invoice_status') return (a.invoice_status || '').localeCompare(b.invoice_status || '') * dir
    return (a.invoice_date || '').localeCompare(b.invoice_date || '') * dir
  })

  if (loading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
  }

  if (error) {
    return <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>
  }

  if (invoices.length === 0) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-muted-foreground">No invoices found. Click + New Invoice to add one.</p>
        <Button onClick={onNewInvoice}>+ New Invoice</Button>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort('invoice_date')}>
              Invoice Date {sortKey === 'invoice_date' ? (sortAsc ? '↑' : '↓') : ''}
            </TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('invoice_amount')}>
              Amount {sortKey === 'invoice_amount' ? (sortAsc ? '↑' : '↓') : ''}
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="cursor-pointer" onClick={() => toggleSort('invoice_status')}>
              Status {sortKey === 'invoice_status' ? (sortAsc ? '↑' : '↓') : ''}
            </TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(inv => (
            <TableRow key={inv.id}>
              <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
              <TableCell className="text-sm">{safeDate(inv.invoice_date)}</TableCell>
              <TableCell className="text-sm">{safeDate(inv.due_date)}</TableCell>
              <TableCell className="text-sm text-right">{formatCurrency(inv.invoice_amount)}</TableCell>
              <TableCell className="text-sm">{inv.invoice_category || '—'}</TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(inv.invoice_status)}>{inv.invoice_status || 'Pending'}</Badge>
              </TableCell>
              <TableCell className="text-sm max-w-xs truncate" title={inv.notes || ''}>{inv.notes || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
