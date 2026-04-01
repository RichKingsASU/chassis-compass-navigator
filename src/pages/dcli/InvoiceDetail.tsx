import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency, formatRelativeTime } from '@/utils/dateUtils'
import {
  type DcliInvoice, type DcliLineItem, type InvoiceEvent,
  INVOICE_STATUSES, statusBadgeClass, eventLabel, eventIcon,
} from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

function ConfidenceBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>
  const color =
    score >= 75 ? 'bg-emerald-500' :
    score >= 40 ? 'bg-yellow-500'  :
                  'bg-red-500'
  const label =
    score >= 75 ? 'text-emerald-700 dark:text-emerald-400' :
    score >= 40 ? 'text-yellow-700 dark:text-yellow-400'   :
                  'text-red-600 dark:text-red-400'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${label}`}>{score}%</span>
    </div>
  )
}

export default function DCLIInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

  const [invoice,   setInvoice]   = useState<DcliInvoice | null>(null)
  const [lineItems, setLineItems] = useState<DcliLineItem[]>([])
  const [events,    setEvents]    = useState<InvoiceEvent[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const [newStatus, setNewStatus] = useState('')
  const [note,      setNote]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [matching,  setMatching]  = useState(false)
  const [matchResult, setMatchResult] = useState<{ total: number; matched: number; fuzzy: number; none: number } | null>(null)

  const load = useCallback(async () => {
    if (!invoiceId) return
    setLoading(true)
    try {
      const [invRes, lineRes, evtRes] = await Promise.all([
        supabase.from('dcli_invoice').select('*').eq('id', invoiceId).single(),
        supabase.from('dcli_invoice_line_item').select('*').eq('invoice_id', invoiceId).order('created_at'),
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
  }, [invoiceId])

  useEffect(() => { load() }, [load])

  async function handleStatusUpdate() {
    if (!invoiceId || !newStatus || !invoice) return
    setSaving(true)
    try {
      await supabase.from('dcli_invoice')
        .update({ portal_status: newStatus, internal_notes: note || invoice.internal_notes })
        .eq('id', invoiceId)
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: invoiceId, event_type: 'status_change',
        from_status: invoice.portal_status, to_status: newStatus,
        note: note || null, metadata: {},
      })
      setInvoice({ ...invoice, portal_status: newStatus as DcliInvoice['portal_status'] })
      const { data: evts } = await supabase.from('dcli_invoice_events').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false })
      setEvents(evts || [])
      setNote('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally { setSaving(false) }
  }

  async function runMatching() {
    if (!invoiceId) return
    setMatching(true)
    setMatchResult(null)
    setError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('match_dcli_line_items', { p_invoice_id: invoiceId })
      if (rpcErr) throw rpcErr
      setMatchResult(data as { total: number; matched: number; fuzzy: number; none: number })
      // Reload line items to show updated confidence scores
      const { data: lines } = await supabase.from('dcli_invoice_line_item').select('*').eq('invoice_id', invoiceId).order('created_at')
      setLineItems(lines || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Matching failed')
    } finally { setMatching(false) }
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!invoice) return <div className="p-6 text-destructive">Invoice not found.</div>

  const matchedCount  = lineItems.filter(l => (l.match_confidence ?? 0) >= 75).length
  const fuzzyCount    = lineItems.filter(l => (l.match_confidence ?? 0) >= 40 && (l.match_confidence ?? 0) < 75).length
  const unmatchedCount = lineItems.filter(l => (l.match_confidence ?? 0) < 40 || l.match_confidence == null).length
  const hasRunMatching = lineItems.some(l => l.match_confidence != null)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/vendors/dcli/invoices')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            &larr; Invoice Tracker
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold">{invoice.invoice_number ?? invoice.id.slice(0, 8)}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(invoice.portal_status)}`}>
            {invoice.portal_status || 'No Status'}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Invoice Date',  value: formatDate(invoice.invoice_date) },
          { label: 'Due Date',      value: formatDate(invoice.due_date) },
          { label: 'Total Amount',  value: invoice.total_amount != null ? formatCurrency(invoice.total_amount) : '—' },
          { label: 'Line Items',    value: lineItems.length },
        ].map(k => (
          <Card key={k.label} className="py-0">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className="text-lg font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Matching panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Activity Match</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Matches each line item against dcli_activity records by chassis, dates, and days.
              </p>
            </div>
            <Button onClick={runMatching} disabled={matching} variant="outline" className="gap-2">
              <RefreshCw size={14} className={matching ? 'animate-spin' : ''} />
              {matching ? 'Running\u2026' : hasRunMatching ? 'Re-run Matching' : 'Run Matching'}
            </Button>
          </div>
        </CardHeader>
        {(hasRunMatching || matchResult) && (
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Matched (&ge;75%)</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{matchedCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle size={16} className="text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">Fuzzy (40&ndash;74%)</p>
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{fuzzyCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-600 dark:text-red-400">No Match (&lt;40%)</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{unmatchedCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Status update */}
      <Card>
        <CardHeader><CardTitle className="text-base">Update Portal Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue placeholder="Select portal status" /></SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(s)}`}>{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStatusUpdate} disabled={saving || !newStatus}>
              {saving ? 'Saving\u2026' : 'Update Status'}
            </Button>
          </div>
          <Textarea placeholder="Add a note (optional)\u2026" value={note} onChange={e => setNote(e.target.value)} rows={2} />
        </CardContent>
      </Card>

      {/* Line items with confidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <span className="text-sm text-muted-foreground">{lineItems.length} total</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Date Out</TableHead>
                  <TableHead>Date In</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No line items found.</TableCell></TableRow>
                ) : lineItems.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono text-xs">{line.chassis ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{line.container ?? '—'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDate(line.date_out)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDate(line.date_in)}</TableCell>
                    <TableCell className="text-right text-xs">{line.days_used ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs">{line.daily_rate != null ? formatCurrency(line.daily_rate) : '—'}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{line.line_total != null ? formatCurrency(line.line_total) : '—'}</TableCell>
                    <TableCell><ConfidenceBar score={line.match_confidence} /></TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(line.portal_status)}`}>
                        {line.portal_status || 'Not Set'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link to={`/vendors/dcli/invoice-line/${line.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Event timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
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
                      {evt.created_by_email && ` \u00b7 ${evt.created_by_email}`}
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
