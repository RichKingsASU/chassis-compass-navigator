import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import {
  type DcliInvoice, type DcliLineItem, type InvoiceEvent, type ValidationFinding, type ValidationStatus,
  INVOICE_STATUSES, statusBadgeClass, eventLabel, eventIcon,
} from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataGrid } from '@/components/ui/DataGrid'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ColDef, CellValueChangedEvent, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community'
import { AlertCircle, CheckCircle2, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react'

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

  // Match summary (match_type set by match_dcli_line_items RPC)
  const matched   = lineItems.filter(l => l.match_type === 'activity').length
  const fuzzy     = lineItems.filter(l => l.match_type === 'tms').length
  const unmatched = lineItems.filter(l => l.match_type === 'none').length
  const notRun    = lineItems.filter(l => l.match_type == null && l.matched_at == null).length

  // Validation summary
  const vPass    = lineItems.filter(l => l.validation_status === 'pass').length
  const vFail    = lineItems.filter(l => l.validation_status === 'fail').length
  const vWarn    = lineItems.filter(l => l.validation_status === 'warn').length
  const vSkipped = lineItems.filter(l => l.validation_status === 'skipped').length
  const vRun     = vPass + vFail + vWarn + vSkipped

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

      {/* Match + validation summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 size={16} /> Activity Match Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notRun === total ? (
            <p className="text-sm text-muted-foreground">Matching has not been run yet. Click "Run Activity Matching" above.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {matched   > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pct(matched)}%` }}   title={`Matched: ${matched}`} />}
                {fuzzy     > 0 && <div className="h-full bg-yellow-400"  style={{ width: `${pct(fuzzy)}%` }}     title={`Fuzzy: ${fuzzy}`} />}
                {unmatched > 0 && <div className="h-full bg-red-400"     style={{ width: `${pct(unmatched)}%` }} title={`No match: ${unmatched}`} />}
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{matched} matched</span>
                {' · '}
                <span className="text-yellow-700 dark:text-yellow-400 font-medium">{fuzzy} fuzzy</span>
                {' · '}
                <span className="text-red-700 dark:text-red-400 font-medium">{unmatched} unmatched</span>
                {' · '}
                <span className="text-foreground font-medium">{total} total</span>
              </p>
            </div>
          )}

          {vRun > 0 && (
            <div className="space-y-2 pt-3 border-t">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <ShieldCheck size={12} /> Validation
              </p>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {vPass    > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pct(vPass)}%` }}    title={`Pass: ${vPass}`} />}
                {vWarn    > 0 && <div className="h-full bg-yellow-400"  style={{ width: `${pct(vWarn)}%` }}    title={`Warn: ${vWarn}`} />}
                {vFail    > 0 && <div className="h-full bg-red-500"     style={{ width: `${pct(vFail)}%` }}    title={`Fail: ${vFail}`} />}
                {vSkipped > 0 && <div className="h-full bg-muted-foreground/40" style={{ width: `${pct(vSkipped)}%` }} title={`Skipped: ${vSkipped}`} />}
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{vPass} pass</span>
                {' · '}
                <span className="text-red-700 dark:text-red-400 font-medium">{vFail} fail</span>
                {vWarn > 0 && <><span> · </span><span className="text-yellow-700 dark:text-yellow-400 font-medium">{vWarn} warn</span></>}
                {' · '}
                <span>{vSkipped} skipped</span>
                {' · '}
                <span className="text-foreground font-medium">{total} total</span>
              </p>
            </div>
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

// ── AG Grid cell renderers ─────────────────────────────────────────────────
const VALIDATION_BADGE_CLS: Record<ValidationStatus, string> = {
  pass:    'bg-green-100 text-green-700',
  fail:    'bg-red-100 text-red-700',
  warn:    'bg-yellow-100 text-yellow-700',
  skipped: 'bg-gray-100 text-gray-500',
}

function ValidationCell({ value, data }: ICellRendererParams<DcliLineItem, ValidationStatus | null>) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>
  const label = value.charAt(0).toUpperCase() + value.slice(1)
  const findings = (data?.validation_findings ?? []) as ValidationFinding[]
  const badge = (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${VALIDATION_BADGE_CLS[value] ?? 'bg-gray-100 text-gray-500'}`}>
      {label}
    </span>
  )
  if (findings.length === 0) return badge
  return (
    <Popover>
      <PopoverTrigger asChild onClick={e => e.stopPropagation()}>
        <button type="button" className="leading-none">{badge}</button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs space-y-2" align="start" onClick={e => e.stopPropagation()}>
        <p className="font-semibold">Validation findings</p>
        <ul className="space-y-2">
          {findings.map((f, i) => (
            <li key={i} className="border-b last:border-0 pb-2 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold">{f.code}</span>
                <span className={`text-[10px] uppercase font-semibold ${
                  f.severity === 'fail' ? 'text-red-600'
                  : f.severity === 'warn' ? 'text-yellow-700'
                  : 'text-muted-foreground'}`}>{f.severity}</span>
              </div>
              <p className="text-muted-foreground mt-1">{f.message}</p>
              {(f.billed_days != null || f.tms_days != null || f.variance != null) && (
                <p className="mt-1 tabular-nums">
                  {f.billed_days != null && <>billed: <span className="font-medium">{f.billed_days}</span></>}
                  {f.tms_days != null && <> · tms: <span className="font-medium">{f.tms_days}</span></>}
                  {f.variance != null && <> · variance: <span className="font-medium">{f.variance > 0 ? '+' : ''}{f.variance}</span></>}
                </p>
              )}
              {(f.lds?.length || f.sos?.length) ? (
                <p className="mt-1 font-mono text-[10px] break-all">
                  {f.lds?.length ? <>LDs: {f.lds.join(', ')}</> : null}
                  {f.lds?.length && f.sos?.length ? <><br/></> : null}
                  {f.sos?.length ? <>SOs: {f.sos.join(', ')}</> : null}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function DCLIInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

  const [invoice,        setInvoice]        = useState<DcliInvoice | null>(null)
  const [lineItems,      setLineItems]      = useState<DcliLineItem[]>([])
  const [events,         setEvents]         = useState<InvoiceEvent[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)
  const [matching,       setMatching]       = useState(false)
  const [matchError,     setMatchError]     = useState<string | null>(null)
  const [matchMsg,       setMatchMsg]       = useState<string | null>(null)
  const [hasMatchedOnce, setHasMatchedOnce] = useState(false)
  const [validating,     setValidating]     = useState(false)
  const [validateError,  setValidateError]  = useState<string | null>(null)
  const [validateMsg,    setValidateMsg]    = useState<string | null>(null)

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
      setHasMatchedOnce(lines.some(l => l.matched_at != null || l.match_type != null))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => { load() }, [load])

  // ── Editable line item grid: column defs + cell change handler ────────
  const lineItemColumnDefs = useMemo<ColDef<DcliLineItem>[]>(() => [
    { headerName: 'Chassis', field: 'chassis', width: 130, cellClass: 'font-mono' },
    { headerName: 'Container', field: 'container', width: 140, cellClass: 'font-mono' },
    { headerName: 'Date Out', field: 'date_out', width: 130 },
    { headerName: 'Date In', field: 'date_in', width: 130 },
    { headerName: 'Days', field: 'days_used', type: 'numericColumn', width: 90 },
    {
      headerName: 'Rate',
      field: 'daily_rate',
      type: 'numericColumn',
      width: 110,
      editable: true,
      valueParser: (p) => (p.newValue === '' || p.newValue == null ? null : Number(p.newValue)),
      valueFormatter: (p) => (p.value == null ? '' : formatCurrency(Number(p.value))),
    },
    {
      headerName: 'Total',
      field: 'line_total',
      type: 'numericColumn',
      width: 120,
      editable: true,
      valueParser: (p) => (p.newValue === '' || p.newValue == null ? null : Number(p.newValue)),
      valueFormatter: (p) => (p.value == null ? '' : formatCurrency(Number(p.value))),
    },
    {
      headerName: 'Match',
      field: 'match_confidence',
      width: 170,
      filter: false,
      sortable: true,
      cellRenderer: function(params: ICellRendererParams<DcliLineItem>) {
        const val = params.value;
        if (!val || val === 'none') {
          if (!val) return '<span style="color:#9ca3af">—</span>';
          return '<div style="width:100%;height:10px;border-radius:3px;background:#ef4444"></div>';
        }
        return '<div style="width:100%;height:10px;border-radius:3px;background:#f59e0b"></div>';
      },
    },
    {
      headerName: 'Variance',
      field: 'day_variance',
      type: 'numericColumn',
      width: 110,
      valueFormatter: (p: ValueFormatterParams<DcliLineItem, number | null>) =>
        p.value == null ? '—' : (p.value > 0 ? `+${p.value}` : String(p.value)),
      cellClass: (p) => {
        const v = p.value as number | null | undefined
        if (v == null) return 'text-muted-foreground'
        if (v === 0)   return 'text-green-700 font-semibold'
        return 'text-red-700 font-semibold'
      },
    },
    {
      headerName: 'Validation',
      field: 'validation_status',
      width: 140,
      filter: true,
      sortable: true,
      cellRenderer: ValidationCell,
    },
    {
      headerName: 'Status',
      field: 'portal_status',
      width: 180,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['', ...INVOICE_STATUSES] },
    },
    {
      headerName: 'Remarks',
      field: 'internal_notes',
      width: 260,
      editable: true,
      cellEditor: 'agLargeTextCellEditor',
    },
  ], [])

  async function handleLineCellChanged(event: CellValueChangedEvent<DcliLineItem>) {
    const field = event.colDef.field as keyof DcliLineItem | undefined
    if (!field) return
    const rowId = event.data?.id
    if (!rowId) return
    const newValue = event.newValue
    const { error: updateErr } = await supabase
      .from('dcli_invoice_line_item')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('id', rowId)
    if (updateErr) {
      toast.error(`Failed to save ${String(field)}: ${updateErr.message}`)
      if (event.node) event.node.setDataValue(field as string, event.oldValue)
      return
    }
    setLineItems(prev => prev.map(l => (l.id === rowId ? { ...l, [field]: newValue } as DcliLineItem : l)))
    toast.success('Saved')
  }

  // ── Run activity matching ──────────────────────────────────────────────
  async function runMatching() {
    if (!invoiceId) return
    setMatching(true); setMatchMsg(null); setMatchError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('match_dcli_line_items', { p_invoice_id: invoiceId })
      if (rpcErr) throw rpcErr
      const r = data as { total: number; matched: number; fuzzy: number; none: number }
      setMatchMsg(`Matching complete: ${r.matched} matched · ${r.fuzzy} fuzzy · ${r.none} unmatched (${r.total} total)`)
      setHasMatchedOnce(true)
      const { data: lines } = await supabase.from('dcli_invoice_line_item').select('*').eq('invoice_id', invoiceId).order('created_at')
      setLineItems(lines || [])
    } catch (err: unknown) {
      setMatchError(err instanceof Error ? err.message : String(err))
    } finally { setMatching(false) }
  }

  // ── Run validation ─────────────────────────────────────────────────────
  async function runValidation() {
    if (!invoiceId) return
    setValidating(true); setValidateMsg(null); setValidateError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('validate_dcli_line_items', { p_invoice_id: invoiceId })
      if (rpcErr) throw rpcErr
      const r = data as { total: number; pass: number; fail: number; warn: number; skipped: number }
      setValidateMsg(`Validation complete: ${r.pass} pass · ${r.fail} fail · ${r.warn ?? 0} warn · ${r.skipped} skipped (${r.total} total)`)
      const { data: lines } = await supabase.from('dcli_invoice_line_item').select('*').eq('invoice_id', invoiceId).order('created_at')
      setLineItems(lines || [])
    } catch (err: unknown) {
      setValidateError(err instanceof Error ? err.message : String(err))
    } finally { setValidating(false) }
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!invoice) return <div className="p-6 text-destructive">Invoice not found.</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/vendors/dcli#invoices')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            ← Invoice Tracker
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold">Invoice {invoice.invoice_number ?? invoice.id.slice(0, 8)}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(invoice.portal_status)}`}>
            {invoice.portal_status || 'No Status'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runMatching} disabled={matching || validating} variant="outline" size="sm" className="gap-2">
            <RefreshCw size={14} className={matching ? 'animate-spin' : ''} />
            {matching ? 'Matching…' : 'Run Activity Matching'}
          </Button>
          <Button
            onClick={runValidation}
            disabled={!hasMatchedOnce || matching || validating}
            variant="outline"
            size="sm"
            className="gap-2"
            title={hasMatchedOnce ? 'Run day-variance + LD/SO validation' : 'Run Activity Matching first'}
          >
            <ShieldCheck size={14} className={validating ? 'animate-spin' : ''} />
            {validating ? 'Validating…' : 'Run Validation'}
          </Button>
        </div>
      </div>

      {error         && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
      {matchError    && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"><AlertCircle size={14} />Matching failed: {matchError}</div>}
      {validateError && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"><AlertCircle size={14} />Validation failed: {validateError}</div>}
      {matchMsg      && <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm"><CheckCircle2 size={14} />{matchMsg}</div>}
      {validateMsg   && <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm"><ShieldCheck size={14} />{validateMsg}</div>}

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
            <span className="text-xs text-muted-foreground">Double-click a cell to edit. Changes save on blur.</span>
          </div>
        </CardHeader>
        <CardContent>
          <DataGrid<DcliLineItem>
            rowData={lineItems}
            columnDefs={lineItemColumnDefs}
            onCellValueChanged={handleLineCellChanged}
          />
        </CardContent>
      </Card>

      {/* Event timeline */}
      {events.length > 0 && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-2">
              Activity Timeline
            </span>
            <div className="flex-1 border-t border-border" />
          </div>
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
        </>
      )}
    </div>
  )
}
