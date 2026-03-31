import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type DcliInvoice,
  type DcliLineItem,
  type InvoiceEvent,
  INVOICE_STATUSES,
  statusBadgeClass,
  eventLabel,
  eventIcon,
} from '@/types/invoice'

export default function DCLIInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<DcliInvoice | null>(null)
  const [lineItems, setLineItems] = useState<DcliLineItem[]>([])
  const [events, setEvents] = useState<InvoiceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Status update state
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!invoiceId) return
      setLoading(true)
      try {
        const [invRes, lineRes, evtRes] = await Promise.all([
          supabase.from('dcli_invoice').select('*').eq('id', invoiceId).single(),
          supabase.from('dcli_invoice_line_item').select('*').eq('invoice_id', invoiceId),
          supabase.from('dcli_invoice_events').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false }),
        ])
        if (invRes.error) throw invRes.error
        setInvoice(invRes.data)
        setLineItems(lineRes.data || [])
        setEvents(evtRes.data || [])
        setNewStatus(invRes.data?.portal_status || '')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [invoiceId])

  async function handleStatusUpdate() {
    if (!invoiceId || !newStatus || !invoice) return
    setSaving(true)
    try {
      const { error: updateErr } = await supabase
        .from('dcli_invoice')
        .update({ portal_status: newStatus, internal_notes: note || invoice.internal_notes })
        .eq('id', invoiceId)
      if (updateErr) throw updateErr

      // Log the event
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: invoiceId,
        event_type: 'status_change',
        from_status: invoice.portal_status,
        to_status: newStatus,
        note: note || null,
        metadata: {},
      })

      // Refresh
      setInvoice({ ...invoice, portal_status: newStatus as DcliInvoice['portal_status'], internal_notes: note || invoice.internal_notes })
      const { data: evts } = await supabase.from('dcli_invoice_events').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false })
      setEvents(evts || [])
      setNote('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!invoice) return <div className="p-6"><p className="text-destructive">Invoice not found.</p></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vendors/dcli')} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back to DCLI</button>
        <h1 className="text-3xl font-bold">Invoice {invoice.invoice_number || invoice.id.slice(0, 8)}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(invoice.portal_status)}`}>
          {invoice.portal_status || 'No Status'}
        </span>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Invoice Date</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{invoice.invoice_date ? formatDate(invoice.invoice_date) : '—'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Due Date</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{invoice.total_amount != null ? formatCurrency(invoice.total_amount) : '—'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Line Items</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{lineItems.length}</p></CardContent>
        </Card>
      </div>

      {/* Status update */}
      <Card>
        <CardHeader><CardTitle>Update Portal Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select portal status" />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStatusUpdate} disabled={saving || !newStatus}>
              {saving ? 'Saving...' : 'Update Status'}
            </Button>
          </div>
          <Textarea
            placeholder="Add a note (optional)..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Date Out</TableHead>
                <TableHead>Date In</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Portal Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No line items found.</TableCell></TableRow>
              ) : lineItems.map(line => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">{line.chassis ?? '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{line.container ?? '—'}</TableCell>
                  <TableCell>{line.date_out ? formatDate(line.date_out) : '—'}</TableCell>
                  <TableCell>{line.date_in ? formatDate(line.date_in) : '—'}</TableCell>
                  <TableCell>{line.days_used ?? '—'}</TableCell>
                  <TableCell>{line.daily_rate != null ? formatCurrency(line.daily_rate) : '—'}</TableCell>
                  <TableCell>{line.line_total != null ? formatCurrency(line.line_total) : '—'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(line.portal_status)}`}>
                      {line.portal_status || 'Not Set'}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Link to={`/vendors/dcli/invoice-line/${line.id}`}><Button variant="outline" size="sm">View</Button></Link>
                    <Link to={`/vendors/dcli/invoice-line/${line.id}/dispute`}><Button variant="destructive" size="sm">Dispute</Button></Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {events.map(evt => (
                <li key={evt.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <span className="text-lg">{eventIcon(evt.event_type)}</span>
                  <div className="flex-1">
                    <p className="font-medium">{eventLabel(evt)}</p>
                    {evt.note && <p className="text-muted-foreground mt-0.5">{evt.note}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(evt.created_at).toLocaleString()}
                      {evt.created_by_email && ` by ${evt.created_by_email}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
