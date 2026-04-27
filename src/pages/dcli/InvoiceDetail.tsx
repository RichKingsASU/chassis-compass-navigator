import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RefreshCw, Eye, Loader2, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

import { formatDate, formatCurrency } from '@/utils/dateUtils'
import {
  type DcliInvoice, type DcliLineItem, type InvoiceEvent, type ValidationFinding, type ValidationStatus,
  INVOICE_STATUSES, statusBadgeClass, eventLabel, eventIcon,
} from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertCircle, CheckCircle2, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react'

// ── Confidence bar ─────────────────────────────────────────────────────────
// Accepts either a 0–1 (RPC output) or 0–100 (legacy) score.
function ConfidenceBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>
  const pct = Math.round(score <= 1 ? score * 100 : score)
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  const text  = pct >= 75 ? 'text-emerald-700 dark:text-emerald-400'
              : pct >= 40 ? 'text-yellow-700 dark:text-yellow-400'
              :             'text-red-600 dark:text-red-400'
  return (
    <div className="flex items-center gap-1.5 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${text}`}>{pct}%</span>
    </div>
  )
}

interface MatchScore {
  label: string
  badgeClass: string
}

function computeMatchScore(line: DcliInternalLineItem): MatchScore {
  const tms = (line as { tms_match?: unknown }).tms_match as
    | Record<string, unknown>
    | null
    | undefined
  if (tms == null || (typeof tms === 'object' && Object.keys(tms).length === 0)) {
    return { label: 'Unscored', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' }
  }

  if (unsetCount > 0) groups['Not Set'] = { count: unsetCount, amount: unsetAmount }

  const totalAmount = lineItems.reduce((s, l) => s + (l.line_total ?? 0), 0)

  // Match summary (match_confidence is numeric 0–1 from the RPC)
  const isMatched   = (l: DcliLineItem) => l.match_type === 'activity'
  const isFuzzy     = (l: DcliLineItem) => l.match_type === 'tms'
  const isUnmatched = (l: DcliLineItem) => l.match_type === 'none'
  const isNotRun    = (l: DcliLineItem) => l.match_type == null && l.matched_at == null

  const matched   = lineItems.filter(isMatched).length
  const fuzzy     = lineItems.filter(isFuzzy).length
  const unmatched = lineItems.filter(isUnmatched).length
  const notRun    = lineItems.filter(isNotRun).length

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

// ── Variance cell ──────────────────────────────────────────────────────────
function VarianceCell({ variance }: { variance: number | null }) {
  if (variance == null) return <span className="text-xs text-muted-foreground">—</span>
  const cls =
    variance === 0 ? 'text-emerald-700 dark:text-emerald-400'
    : variance > 0 ? 'text-red-700 dark:text-red-400'
    :                'text-yellow-700 dark:text-yellow-400'
  const sign = variance > 0 ? '+' : ''
  return <span className={`text-xs font-semibold tabular-nums ${cls}`}>{sign}{variance}</span>
}

// ── Validation badge + popover ─────────────────────────────────────────────
const VALIDATION_BADGE_CLS: Record<ValidationStatus, string> = {
  pass:    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  fail:    'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
  warn:    'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  skipped: 'bg-muted text-muted-foreground border-border',
}

function ValidationCell({ status, findings }: { status: ValidationStatus | null; findings: ValidationFinding[] | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  const badge = (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer ${VALIDATION_BADGE_CLS[status]}`}>
      {label}
    </span>
  )
  const list = findings ?? []
  if (list.length === 0) return badge
  return (
    <Popover>
      <PopoverTrigger asChild><button type="button">{badge}</button></PopoverTrigger>
      <PopoverContent className="w-80 text-xs space-y-2" align="start">
        <p className="font-semibold">Validation findings</p>
        <ul className="space-y-2">
          {list.map((f, i) => (
            <li key={i} className="border-b last:border-0 pb-2 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold">{f.code}</span>
                <span className={`text-[10px] uppercase font-semibold ${
                  f.severity === 'fail' ? 'text-red-600 dark:text-red-400'
                  : f.severity === 'warn' ? 'text-yellow-700 dark:text-yellow-400'
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
  const params = useParams<{ invoiceId?: string; invoiceNumber?: string }>()
  const navigate = useNavigate()
  const rawParam = params.invoiceNumber ?? params.invoiceId ?? ''
  const invoiceNumber = decodeURIComponent(rawParam)


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
  // Per-row inline status: lineId -> selected status value
  const [rowStatus,      setRowStatus]      = useState<Record<string, string>>({})
  const [rowSaving,      setRowSaving]      = useState<Record<string, boolean>>({})

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
      // Enable validation button if matching has been run at least once on this invoice
      setHasMatchedOnce(lines.some(l => l.matched_at != null || l.match_type != null))
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
  }, [invoiceNumber])

  const totals = useMemo(() => {
    let total = 0
    let tax = 0
    let fees = 0
    for (const l of lineItems) {
      if (typeof l.total === 'number') total += l.total
      if (typeof l.tax_amount === 'number') tax += l.tax_amount
      if (typeof l.total_fees === 'number') fees += l.total_fees
    }
    return { total, tax, fees }
  }, [lineItems])

  const handleValidateInvoice = useCallback(async () => {
    if (!invoice?.id || lineItems.length === 0) {
      toast.error('Nothing to validate — no line items loaded.')
      return
    }
    setValidating(true)
    try {
      const trimmedChassis = chassisList.map((c) => c.trim()).filter(Boolean)
      const { data: actRows, error: actErr } = await supabase
        .from('dcli_activity')
        .select('chassis, days_out, date_out, date_in')
        .in('chassis', trimmedChassis.length > 0 ? trimmedChassis : ['__none__'])
      if (actErr) throw actErr

      const actByChassis = new Map<string, { days_out: number | null }[]>()
      for (const r of (actRows ?? []) as { chassis: string | null; days_out: number | null }[]) {
        const k = (r.chassis ?? '').trim().toUpperCase()
        if (!k) continue
        const arr = actByChassis.get(k) ?? []
        arr.push({ days_out: r.days_out })
        actByChassis.set(k, arr)
      }

      // Pull SO numbers from mg_data (base table, never the mg_tms view).
      const soByChassis = new Map<string, string>()
      if (trimmedChassis.length > 0) {
        const { data: mgRows, error: mgErr } = await supabase
          .from('mg_data')
          .select('chassis_number, so_num, delivery_actual_date')
          .in('chassis_number', trimmedChassis)
          .order('delivery_actual_date', { ascending: false })
        if (mgErr && !/relation .*mg_data/i.test(mgErr.message)) {
          throw mgErr
        }
        for (const r of (mgRows ?? []) as {
          chassis_number: string | null
          so_num: string | null
        }[]) {
          const k = (r.chassis_number ?? '').trim().toUpperCase()
          if (!k || !r.so_num) continue
          if (!soByChassis.has(k)) soByChassis.set(k, r.so_num)
        }
      }

      let matched = 0
      let mismatched = 0
      let unmatched = 0
      let soUpdated = 0
      for (const l of lineItems) {
        const k = (l.chassis ?? '').trim().toUpperCase()
        const records = k ? actByChassis.get(k) : undefined
        if (!records || records.length === 0) {
          unmatched++
        } else {
          const sumDays = records.reduce((s, r) => s + (Number(r.days_out) || 0), 0)
          const lineDays = Number(l.bill_days ?? 0)
          if (Math.abs(sumDays - lineDays) <= 1) matched++
          else mismatched++
        }

        const tmsSo = k ? soByChassis.get(k) : undefined
        if (tmsSo && tmsSo !== l.so_num) {
          const { error: soErr } = await supabase
            .from('dcli_internal_line_item')
            .update({ so_num: tmsSo })
            .eq('id', l.id)
          if (!soErr) {
            soUpdated++
          } else if (/column .*so_num/i.test(soErr.message)) {
            // Column not yet migrated — silently skip.
            break
          }
        }
      }

      const status =
        unmatched === lineItems.length
          ? 'fail'
          : mismatched === 0 && unmatched === 0
            ? 'pass'
            : 'warn'

      const { error: updErr } = await supabase
        .from('dcli_invoice_internal')
        .update({ validation_status: status })
        .eq('id', invoice.id)
      if (updErr && !/column .*validation_status/i.test(updErr.message)) {
        throw updErr
      }

      toast.success(
        `Validation ${status.toUpperCase()} — ${matched} matched · ${mismatched} mismatched · ${unmatched} unmatched${
          soUpdated > 0 ? ` · ${soUpdated} SO# populated` : ''
        }`
      )
      if (soUpdated > 0) setRefreshKey((k) => k + 1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setValidating(false)
    }
  }, [invoice?.id, lineItems, chassisList])

  const handleSyncTms = useCallback(async () => {
    if (lineItems.length === 0) {
      toast.error('No line items to sync.')
      return
    }
    setSyncing(true)
    try {
      const trimmedChassis = chassisList.map((c) => c.trim()).filter(Boolean)
      if (trimmedChassis.length === 0) {
        toast.error('No chassis numbers on this invoice.')
        return
      }
      const { data: tmsRows, error: tmsErr } = await supabase
        .from('mg_tms')
        .select('*')
        .in('chassis_number', trimmedChassis)
      if (tmsErr) throw tmsErr

      const byChassis = new Map<string, Record<string, unknown>>()
      for (const r of (tmsRows ?? []) as Record<string, unknown>[]) {
        const k = String(r.chassis_number ?? '').trim().toUpperCase()
        if (!k) continue
        const existing = byChassis.get(k)
        const cur = String(r.create_date ?? '')
        const prev = existing ? String(existing.create_date ?? '') : ''
        if (!existing || cur > prev) byChassis.set(k, r)
      }

      let updated = 0
      let skippedCol = false
      for (const l of lineItems) {
        const k = (l.chassis ?? '').trim().toUpperCase()
        const match = k ? byChassis.get(k) : undefined
        const payload: Record<string, unknown> = match
          ? {
              chassis: match.chassis_number ?? l.chassis,
              load_id: match.load_id ?? null,
              create_date: match.create_date ?? null,
              pickup_actual_date: match.pickup_actual_date ?? null,
              delivery_actual_date: match.delivery_actual_date ?? null,
              cust_rate_charge: match.cust_rate_charge ?? null,
              amount: match.cust_rate_charge ?? null,
            }
          : {}
        const { error: updErr } = await supabase
          .from('dcli_internal_line_item')
          .update({ tms_match: payload })
          .eq('id', l.id)
        if (updErr) {
          if (/column .*tms_match/i.test(updErr.message)) {
            skippedCol = true
            break
          }
          continue
        }
        updated++
      }

      if (skippedCol) {
        toast.error(
          'Could not write tms_match — column missing on dcli_internal_line_item. Run the flagged migration in Supabase SQL editor.'
        )
      } else {
        toast.success(`TMS sync complete — updated ${updated} of ${lineItems.length} lines`)
        setRefreshKey((k) => k + 1)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'TMS sync failed')
    } finally {
      setSyncing(false)
    }
  }, [lineItems, chassisList])

  const isPaid = useMemo(() => {
    const s = (invoice?.portal_status ?? '').trim().toLowerCase()
    return s === 'paid'
  }, [invoice?.portal_status])

  const exportableLines = useMemo(
    () =>
      lineItems
        .filter(
          (l) => (l as Partial<DcliInternalLineItem>).du_number !== 'TOTAL' && !!l.id
        )
        .map((l) => ({
          id: String(l.id),
          chassis: l.chassis ?? null,
          date_in: l.date_in ?? null,
          total: typeof l.total === 'number' ? l.total : Number(l.total ?? 0) || null,
          so_num: (l.so_num as string | null | undefined) ?? null,
          bc_exported: (l.bc_exported as boolean | null | undefined) ?? null,
          bc_exported_at: (l.bc_exported_at as string | null | undefined) ?? null,
        })),
    [lineItems]
  )

  const lineItemColumnDefs = useMemo<ColDef<DcliInternalLineItem>[]>(
    () => [
      {
        headerName: 'Line #',
        width: 90,
        cellClass: 'font-mono',
        valueGetter: (p: ValueGetterParams<DcliInternalLineItem>) => {
          const data = p.data
          if (!data) return ''
          if ((data as Partial<DcliInternalLineItem>).du_number === 'TOTAL') return 'TOTAL'
          if (data.du_number && String(data.du_number).trim() !== '') return data.du_number
          const idx = typeof p.node?.rowIndex === 'number' ? p.node.rowIndex + 1 : null
          return idx ?? data.id ?? ''
        },
      },
      { headerName: 'Chassis', field: 'chassis', width: 130, cellClass: 'font-mono' },
      { headerName: 'Date Out', field: 'date_out', width: 120, valueFormatter: (p) => formatShortDate(p.value) },
      { headerName: 'Date In', field: 'date_in', width: 120, valueFormatter: (p) => formatShortDate(p.value) },
      { headerName: 'Bill Days', field: 'bill_days', type: 'numericColumn', width: 100 },
      { headerName: 'Rate', field: 'rate', type: 'numericColumn', width: 110, valueFormatter: (p) => formatUSD(p.value) },
      { headerName: 'Total', field: 'total', type: 'numericColumn', width: 120, valueFormatter: (p) => formatUSD(p.value) },
      { headerName: 'Pool Contract', field: 'pool_contract', width: 130 },
      { headerName: 'Pick Up Location', field: 'pick_up_location', width: 200 },
      { headerName: 'Return Location', field: 'return_location', width: 200 },
      { headerName: 'Ocean Carrier SCAC', field: 'ocean_carrier_scac', width: 150 },
      { headerName: 'Haulage Type', field: 'haulage_type', width: 130 },
      { headerName: 'Charge Description', field: 'charge_description', width: 220 },
      { headerName: 'Container In', field: 'container_in', width: 140, cellClass: 'font-mono' },
      { headerName: 'Tax Amount', field: 'tax_amount', type: 'numericColumn', width: 120, valueFormatter: (p) => formatUSD(p.value) },
      { headerName: 'Total Fees', field: 'total_fees', type: 'numericColumn', width: 120, valueFormatter: (p) => formatUSD(p.value) },
      { headerName: 'SO #', field: 'so_num', width: 120, cellClass: 'font-mono' },
      {
        headerName: 'BC',
        width: 110,
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<DcliInternalLineItem>) => {
          if (!p.data) return null
          if ((p.data as Partial<DcliInternalLineItem>).du_number === 'TOTAL') return null
          const exported = p.data.bc_exported
          if (!exported) return null
          const at = p.data.bc_exported_at
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-blue-50 text-blue-800 border-blue-200">
              Exported{at ? ` ${formatShortDate(at)}` : ''}
            </span>
          )
        },
      },
      {
        headerName: 'Match',
        width: 110,
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<DcliInternalLineItem>) => {
          if (!p.data) return null
          if ((p.data as Partial<DcliInternalLineItem>).du_number === 'TOTAL') return null
          const score = computeMatchScore(p.data)
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${score.badgeClass}`}
            >
              {score.label}
            </span>
          )
        },
      },
      {
        headerName: '',
        width: 90,
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: (p: ICellRendererParams<DcliInternalLineItem>) => {
          if (!p.data) return null
          if ((p.data as Partial<DcliInternalLineItem>).du_number === 'TOTAL') return null
          const lineId = p.data.id
          if (!lineId) return null
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 gap-1"
              onClick={(e) => {
                e.stopPropagation()
                navigate(
                  `/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/lines/${encodeURIComponent(
                    lineId
                  )}`
                )
              }}
            >
              <Eye size={12} /> View
            </Button>
          )
        },
      },
    ],
    [navigate, invoiceNumber]
  )

  const pinnedBottomRow = useMemo<Partial<DcliInternalLineItem>[]>(
    () => [
      {
        du_number: 'TOTAL',
        chassis: '',
        bill_days: null,
        total: totals.total,
        tax_amount: totals.tax,
        total_fees: totals.fees,
      } as Partial<DcliInternalLineItem>,
    ],
    [totals]
  )

  const activityColumnDefs = useMemo<ColDef<DcliActivityRow>[]>(
    () => [
      { headerName: 'Chassis', field: 'chassis', width: 140, cellClass: 'font-mono' },
      { headerName: 'Date Out', field: 'date_out', width: 130, valueFormatter: (p) => formatShortDate(p.value) },
      { headerName: 'Date In', field: 'date_in', width: 130, valueFormatter: (p) => formatShortDate(p.value) },
      { headerName: 'Days Out', field: 'days_out', type: 'numericColumn', width: 100 },
      { headerName: 'Pick Up Location', field: 'pick_up_location', width: 200 },
      { headerName: 'Location In', field: 'location_in', width: 200 },
      { headerName: 'Pool Contract', field: 'pool_contract', width: 130 },
      { headerName: 'Reservation', field: 'reservation', width: 150 },
      { headerName: 'Container', field: 'container', width: 140, cellClass: 'font-mono' },
    ],
    []
  )

  if (!invoiceNumber) {
    return <div className="p-6 text-destructive">No invoice number provided.</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate('/vendors/dcli#invoices')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Invoices
        </button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold font-mono">{invoiceNumber}</h1>
        {invoice?.invoice_type && (
          <span className="px-2 py-0.5 rounded-full text-xs border bg-muted text-muted-foreground">
            {invoice.invoice_type}
          </span>
        )}
        {invoice?.portal_status && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs border font-medium ${statusBadgeClass(
              invoice.portal_status
            )}`}
          >
            {invoice.portal_status}
          </span>
        )}
        {invoice?.dispute_status === 'Disputed' && (
          <span className="px-2 py-0.5 rounded-full text-xs border font-medium bg-red-100 text-red-800 border-red-200">
            Disputed
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidateInvoice}
            disabled={validating || linesLoading}
          >
            {validating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Validate Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncTms}
            disabled={syncing || linesLoading}
          >
            {syncing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync TMS Data
          </Button>
          {isPaid ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
              disabled={linesLoading || exportableLines.length === 0}
            >
              <FileSpreadsheet size={14} />
              Export to BC
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="outline" size="sm" disabled>
                    <FileSpreadsheet size={14} />
                    Export to BC
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Invoice must be Paid to export</TooltipContent>
            </Tooltip>
          )}
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

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !invoice ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No invoice header found in <code>dcli_invoice_internal</code> for{' '}
            <span className="font-mono">{invoiceNumber}</span>. Showing line items only.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="py-0">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Billing Date</p>
                <p className="text-base font-bold">
                  {formatShortDate(invoice.billing_date ?? invoice.invoice_date) || '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-base font-bold">{formatShortDate(invoice.due_date) || '—'}</p>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Invoice Type</p>
                <p className="text-base font-bold truncate" title={invoice.invoice_type ?? ''}>
                  {invoice.invoice_type ?? '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Line Items</p>
                <p className="text-base font-bold">{lineItems.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Invoice Amount</p>
                <p className="text-lg font-bold">{formatUSD(invoice.invoice_amount) || '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-lg font-bold">{formatUSD(invoice.invoice_balance) || '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Payments</p>
                <p className="text-lg font-bold">{formatUSD(invoice.total_payments) || '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Dispute Pending</p>
                <p className="text-lg font-bold">{formatUSD(invoice.dispute_pending) || '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Dispute Approved</p>
                <p className="text-lg font-bold">{formatUSD(invoice.dispute_approved) || '—'}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <span className="text-xs text-muted-foreground">
              {lineItems.length} line items · {chassisList.length} chassis
            </span>
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
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Validation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No line items found.</TableCell></TableRow>
                ) : lineItems.map(line => {
                  const rowData = line.row_data as Record<string, unknown> | null
                  const containerVal =
                    line.container
                    ?? (rowData?.['Container On-Hire'] as string | undefined)
                    ?? (rowData?.['Container'] as string | undefined)
                    ?? '—'
                  return (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono text-xs font-medium">{line.chassis ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{containerVal}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDate(line.date_out)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDate(line.date_in)}</TableCell>
                    <TableCell className="text-right text-xs">{line.days_used ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs">{line.daily_rate != null ? formatCurrency(line.daily_rate) : '—'}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{line.line_total != null ? formatCurrency(line.line_total) : '—'}</TableCell>
                    <TableCell><ConfidenceBar score={line.match_confidence} /></TableCell>
                    <TableCell className="text-right"><VarianceCell variance={line.day_variance} /></TableCell>
                    <TableCell><ValidationCell status={line.validation_status} findings={line.validation_findings} /></TableCell>
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
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DocumentsPanel invoiceNumber={invoiceNumber} />

      {!activityLoading && activity.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Activity (matched chassis)</CardTitle>
              <span className="text-xs text-muted-foreground">
                {activity.length} rows · {chassisList.length} chassis
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <DataGrid<DcliActivityRow>
              rowData={activity}
              columnDefs={activityColumnDefs}
              loading={activityLoading}
              height={420}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/vendors/dcli#invoices')}>
          Back to Invoices
        </Button>
      </div>
    </div>
  )
}

