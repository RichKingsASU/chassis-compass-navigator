import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import {
  type DcliInvoice, type DcliLineItem, type InvoiceEvent,
  INVOICE_STATUSES, statusBadgeClass, eventLabel, eventIcon,
} from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, RefreshCw, TrendingUp } from 'lucide-react'

// ── Confidence bar ─────────────────────────────────────────────────────────
function ConfidenceBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>
  const color = score >= 75 ? 'bg-emerald-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  const text  = score >= 75 ? 'text-emerald-700 dark:text-emerald-400'
              : score >= 40 ? 'text-yellow-700 dark:text-yellow-400'
              :               'text-red-600 dark:text-red-400'
  return (
    <div className="flex items-center gap-1.5 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${text}`}>{score}%</span>
    </div>
  )
}

// ── Analytics panel ────────────────────────────────────────────────────────
function LineItemAnalytics({ lineItems }: { lineItems: DcliLineItem[] }) {
  if (!lineItems.length) return null

  const total = lineItems.length

  // Group by status
  const groups: Record<string, { count: number; amount: number }> = {}
  let unsetCount = 0; let unsetAmount = 0
  for (const l of lineItems) {
    const s = l.portal_status ?? '__unset__'
    if (s === '__unset__') { unsetCount++; unsetAmount += l.line_total ?? 0; continue }
    if (!groups[s]) groups[s] = { count: 0, amount: 0 }
    groups[s].count  += 1
    groups[s].amount += l.line_total ?? 0
  }
  if (unsetCount > 0) groups['Not Set'] = { count: unsetCount, amount: unsetAmount }

  const totalAmount = lineItems.reduce((s, l) => s + (l.line_total ?? 0), 0)

  // Match summary
  const matched  = lineItems.filter(l => (l.match_confidence ?? 0) >= 75).length
  const fuzzy    = lineItems.filter(l => (l.match_confidence ?? 0) >= 40 && (l.match_confidence ?? 0) < 75).length
  const unmatched = lineItems.filter(l => l.match_confidence != null && (l.match_confidence ?? 0) < 40).length
  const notRun   = lineItems.filter(l => l.match_confidence == null).length

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Status breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={16} /> Line Item Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-px">
            {Object.entries(groups).map(([status, { count }]) => (
              <div
                key={status}
                className={`h-full ${statusBarColor(status)} transition-all`}
                style={{ width: `${pct(count)}%` }}
                title={`${status}: ${count} (${pct(count)}%)`}
              />
            ))}
          </div>

          {/* Legend rows */}
          <div className="space-y-1.5">
            {Object.entries(groups).map(([status, { count, amount }]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDotColor(status)}`} />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(status === 'Not Set' ? null : status)}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{count} line{count !== 1 ? 's' : ''} ({pct(count)}%)</span>
                  <span className="font-medium text-foreground">{formatCurrency(amount)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
            <span>{total} total line items</span>
            <span className="font-medium text-foreground">{formatCurrency(totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Match summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 size={16} /> Activity Match Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notRun === total ? (
            <p className="text-sm text-muted-foreground">Matching has not been run yet. Click "Run Matching" above.</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {matched   > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pct(matched)}%` }} title={`Matched: ${matched}`} />}
                {fuzzy     > 0 && <div className="h-full bg-yellow-400" style={{ width: `${pct(fuzzy)}%` }}   title={`Fuzzy: ${fuzzy}`} />}
                {unmatched > 0 && <div className="h-full bg-red-400"    style={{ width: `${pct(unmatched)}%` }} title={`No match: ${unmatched}`} />}
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Matched (≥75%)',  count: matched,   cls: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
                  { label: 'Fuzzy (40–74%)',  count: fuzzy,     cls: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800' },
                  { label: 'No Match (<40%)', count: unmatched, cls: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${r.cls}`}>{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.count} ({pct(r.count)}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// status → stacked bar color
function statusBarColor(status: string): string {
  const s = status.toUpperCase()
  if (s === 'OK TO PAY')             return 'bg-emerald-400'
  if (s === 'PAID')                  return 'bg-green-500'
  if (s === 'SCHEDULED')             return 'bg-blue-400'
  if (s === 'DISPUTE')               return 'bg-red-400'
  if (s === 'NEED TO DISPUTE')       return 'bg-orange-400'
  if (s === 'DISPUTE PENDING')       return 'bg-yellow-400'
  if (s === 'DISPUTE APPROVED')      return 'bg-purple-400'
  if (s === 'DISPUTE REJECTED')      return 'bg-red-600'
  if (s.startsWith('NEED TO EMAIL')) return 'bg-orange-300'
  if (s.startsWith('EMAILED'))       return 'bg-sky-400'
  return 'bg-muted-foreground/30'
}

function statusDotColor(status: string): string {
  const s = status.toUpperCase()
  if (s === 'OK TO PAY')             return 'bg-emerald-400'
  if (s === 'PAID')                  return 'bg-green-500'
  if (s === 'SCHEDULED')             return 'bg-blue-400'
  if (s === 'DISPUTE')               return 'bg-red-400'
  if (s === 'NEED TO DISPUTE')       return 'bg-orange-400'
  if (s === 'DISPUTE PENDING')       return 'bg-yellow-400'
  if (s === 'DISPUTE APPROVED')      return 'bg-purple-400'
  if (s === 'DISPUTE REJECTED')      return 'bg-red-600'
  if (s.startsWith('NEED TO EMAIL')) return 'bg-orange-300'
  if (s.startsWith('EMAILED'))       return 'bg-sky-400'
  return 'bg-muted-foreground/40'
}

// ── Main component ─────────────────────────────────────────────────────────
export default function DCLIInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

  const [invoice,    setInvoice]    = useState<DcliInvoice | null>(null)
  const [lineItems,  setLineItems]  = useState<DcliLineItem[]>([])
  const [events,     setEvents]     = useState<InvoiceEvent[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [matching,   setMatching]   = useState(false)
  const [matchMsg,   setMatchMsg]   = useState<string | null>(null)
  // Per-row inline status: lineId -> selected status value
  const [rowStatus,  setRowStatus]  = useState<Record<string, string>>({})
  const [rowSaving,  setRowSaving]  = useState<Record<string, boolean>>({})

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
      const lines = lineRes.data || []
      setLineItems(lines)
      setEvents(evtRes.data || [])
      // Seed inline status selectors with current values
      const init: Record<string, string> = {}
      lines.forEach(l => { init[l.id] = l.portal_status ?? '' })
      setRowStatus(init)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => { load() }, [load])

  // ── Run activity matching ──────────────────────────────────────────────
  async function runMatching() {
    if (!invoiceId) return
    setMatching(true); setMatchMsg(null); setError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('match_dcli_line_items', { p_invoice_id: invoiceId })
      if (rpcErr) throw rpcErr
      const r = data as { total: number; matched: number; fuzzy: number; none: number }
      setMatchMsg(`Matching complete: ${r.matched} matched · ${r.fuzzy} fuzzy · ${r.none} unmatched (${r.total} total)`)
      const { data: lines } = await supabase.from('dcli_invoice_line_item').select('*').eq('invoice_id', invoiceId).order('created_at')
      setLineItems(lines || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Matching failed')
    } finally { setMatching(false) }
  }

  // ── Inline status change per line item ────────────────────────────────
  async function saveLineStatus(lineId: string, status: string, currentStatus: string | null) {
    if (!status || !invoiceId) return
    setRowSaving(prev => ({ ...prev, [lineId]: true }))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('dcli_invoice_line_item')
        .update({ portal_status: status, updated_at: new Date().toISOString() })
        .eq('id', lineId)
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: invoiceId,
        line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: currentStatus,
        to_status: status,
        note: null,
        created_by_email: user?.email ?? null,
        metadata: {},
      })
      setLineItems(prev => prev.map(l => l.id === lineId ? { ...l, portal_status: status as DcliLineItem['portal_status'] } : l))
      const { data: evts } = await supabase.from('dcli_invoice_events').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false })
      setEvents(evts || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setRowSaving(prev => ({ ...prev, [lineId]: false }))
    }
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!invoice) return <div className="p-6 text-destructive">Invoice not found.</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/vendors/dcli/invoices')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            ← Invoice Tracker
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold">Invoice {invoice.invoice_number ?? invoice.id.slice(0, 8)}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(invoice.portal_status)}`}>
            {invoice.portal_status || 'No Status'}
          </span>
        </div>
        <Button onClick={runMatching} disabled={matching} variant="outline" size="sm" className="gap-2">
          <RefreshCw size={14} className={matching ? 'animate-spin' : ''} />
          {matching ? 'Matching…' : 'Run Activity Matching'}
        </Button>
      </div>

      {error    && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
      {matchMsg && <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm"><CheckCircle2 size={14} />{matchMsg}</div>}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Invoice Date',  value: formatDate(invoice.invoice_date) },
          { label: 'Due Date',      value: formatDate(invoice.due_date) },
          { label: 'Total Amount',  value: invoice.total_amount != null ? formatCurrency(invoice.total_amount) : '—' },
          { label: 'Line Items',    value: String(lineItems.length) },
        ].map(k => (
          <Card key={k.label} className="py-0">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground mb-0.5">{k.label}</p>
              <p className="text-lg font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics */}
      <LineItemAnalytics lineItems={lineItems} />

      {/* Line items table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <span className="text-xs text-muted-foreground">Set status inline or click View for full details</span>
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
                    <TableCell className="font-mono text-xs font-medium">{line.chassis ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{line.container ?? '—'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDate(line.date_out)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDate(line.date_in)}</TableCell>
                    <TableCell className="text-right text-xs">{line.days_used ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs">{line.daily_rate != null ? formatCurrency(line.daily_rate) : '—'}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{line.line_total != null ? formatCurrency(line.line_total) : '—'}</TableCell>
                    <TableCell><ConfidenceBar score={line.match_confidence} /></TableCell>
                    <TableCell>
                      {/* Inline status dropdown — changes save immediately */}
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={rowStatus[line.id] ?? ''}
                          onValueChange={val => {
                            setRowStatus(prev => ({ ...prev, [line.id]: val }))
                            saveLineStatus(line.id, val, line.portal_status)
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs w-[160px]">
                            <SelectValue placeholder="Set status…" />
                          </SelectTrigger>
                          <SelectContent>
                            {INVOICE_STATUSES.map(s => (
                              <SelectItem key={s} value={s}>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusBadgeClass(s)}`}>{s}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {rowSaving[line.id] && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary flex-shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link to={`/vendors/dcli/invoice-line/${line.id}`}>
                        <Button variant="outline" size="sm">View</Button>
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
                  <span className="text-lg leading-none pt-0.5">{eventIcon(evt.event_type)}</span>
                  <div className="flex-1">
                    <p className="font-medium">{eventLabel(evt)}</p>
                    {evt.note && <p className="text-muted-foreground mt-0.5">{evt.note}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(evt.created_at).toLocaleString()}{evt.created_by_email && ` · ${evt.created_by_email}`}
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
