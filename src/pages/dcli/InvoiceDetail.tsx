import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { formatShortDate, formatUSD } from '@/features/dcli/format'
import { DocumentsPanel } from '@/features/dcli/components/DocumentsPanel'
import { BCExportDialog } from '@/features/dcli/components/BCExportDialog'
import { LineItemStatusBreakdown } from '@/components/dcli/LineItemStatusBreakdown'
import { ActivityMatchSummary } from '@/components/dcli/ActivityMatchSummary'
import {
  LINE_ITEM_STATUSES,
  deriveDayVariance,
  deriveMatchBucket,
  deriveMatchScore,
  deriveValidationStatus,
} from '@/components/dcli/lineItemDerive'
import { useDcliLineItems } from '@/features/dcli/hooks/useDcliLineItems'
import type {
  DcliActivityRow,
  DcliInternalLineItem,
  DcliInvoiceInternal,
  DcliLineItemStatus,
  DcliValidationStatus,
} from '@/features/dcli/types'

const VENDOR_KEY = 'dcli'
const ACTIVITY_TABLE = 'dcli_internal_line_item'

function MatchBar({ line }: { line: DcliInternalLineItem }) {
  const score = deriveMatchScore(line.tms_match)
  const bucket = deriveMatchBucket(line)
  if (line.tms_match == null) {
    return (
      <div className="flex items-center gap-1.5 min-w-[90px]">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden" />
        <span className="text-xs text-muted-foreground">—</span>
      </div>
    )
  }
  const pct = score ?? 0
  const color =
    bucket === 'matched'
      ? 'bg-emerald-500'
      : bucket === 'fuzzy'
        ? 'bg-yellow-500'
        : 'bg-red-500'
  const text =
    bucket === 'matched'
      ? 'text-emerald-700 dark:text-emerald-400'
      : bucket === 'fuzzy'
        ? 'text-yellow-700 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'
  return (
    <div className="flex items-center gap-1.5 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${text}`}>{pct}%</span>
    </div>
  )
}

function VarianceCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>
  if (value === 0) return <span className="text-xs text-muted-foreground">—</span>
  const cls =
    value > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
  const sign = value > 0 ? '+' : ''
  return (
    <span className={`text-xs font-semibold tabular-nums ${cls}`}>
      {sign}
      {value}
    </span>
  )
}

const VALIDATION_BADGE: Record<DcliValidationStatus, { cls: string; label: string }> = {
  pass: {
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    label: 'Pass',
  },
  fail: {
    cls: 'bg-red-100 text-red-800 border-red-300',
    label: 'Fail',
  },
  warn: {
    cls: 'bg-amber-100 text-amber-800 border-amber-300',
    label: 'Warn',
  },
  skipped: {
    cls: 'bg-gray-100 text-gray-700 border-gray-300',
    label: 'Skipped',
  },
}

function ValidationBadge({ status }: { status: DcliValidationStatus }) {
  const { cls, label } = VALIDATION_BADGE[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

export default function DCLIInvoiceDetail() {
  const params = useParams<{ invoiceId?: string }>()
  const navigate = useNavigate()
  const invoiceNumber = decodeURIComponent(params.invoiceId ?? '')

  const [invoice, setInvoice] = useState<DcliInvoiceInternal | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [matching, setMatching] = useState(false)
  const [validating, setValidating] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({})

  const { lineItems, loading: linesLoading, error: linesError } = useDcliLineItems(
    invoiceNumber || null,
    refreshKey
  )

  const [activity, setActivity] = useState<DcliActivityRow[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  const chassisList = useMemo(
    () =>
      Array.from(
        new Set(
          lineItems
            .map((l) => (l.chassis ?? '').trim())
            .filter((c) => c.length > 0)
        )
      ),
    [lineItems]
  )

  // Load invoice header
  useEffect(() => {
    let cancelled = false
    if (!invoiceNumber) {
      setInvoiceLoading(false)
      return
    }
    async function load() {
      setInvoiceLoading(true)
      setInvoiceError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice_internal')
          .select('*')
          .eq('invoice_number', invoiceNumber)
          .order('invoice_date', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (fetchErr) throw fetchErr
        if (!cancelled) setInvoice((data ?? null) as DcliInvoiceInternal | null)
      } catch (err: unknown) {
        if (!cancelled) {
          setInvoiceError(err instanceof Error ? err.message : 'Failed to load invoice')
        }
      } finally {
        if (!cancelled) setInvoiceLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [invoiceNumber, refreshKey])

  // Load matched activity rows (only render section if any matched)
  useEffect(() => {
    let cancelled = false
    if (chassisList.length === 0) {
      setActivity([])
      return
    }
    async function load() {
      setActivityLoading(true)
      try {
        const { data } = await supabase
          .from('dcli_activity')
          .select('*')
          .in('chassis', chassisList)
          .order('date_out', { ascending: false })
          .limit(1000)
        if (!cancelled) setActivity((data ?? []) as DcliActivityRow[])
      } finally {
        if (!cancelled) setActivityLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [chassisList])

  const totals = useMemo(() => {
    let total = 0
    for (const l of lineItems) {
      if (typeof l.total === 'number') total += l.total
    }
    return { total }
  }, [lineItems])

  const isPaid = useMemo(() => {
    const s = (invoice?.portal_status ?? '').trim().toLowerCase()
    return s === 'paid'
  }, [invoice?.portal_status])

  const exportableLines = useMemo(
    () =>
      lineItems
        .filter((l) => l.du_number !== 'TOTAL' && !!l.id)
        .map((l) => ({
          id: String(l.id),
          chassis: l.chassis ?? null,
          date_in: l.date_in ?? null,
          total: typeof l.total === 'number' ? l.total : Number(l.total ?? 0) || null,
          so_num: l.so_num ?? null,
          bc_exported: l.bc_exported ?? null,
          bc_exported_at: l.bc_exported_at ?? null,
        })),
    [lineItems]
  )

  // ── Run Activity Matching (RPC) ──────────────────────────────────────────
  const handleRunActivityMatching = useCallback(async () => {
    if (!invoiceNumber) return
    if (lineItems.length === 0) {
      toast.error('No line items to match.')
      return
    }
    setMatching(true)
    try {
      const { data, error: rpcErr } = await supabase.rpc('match_dcli_line_items', {
        p_invoice_id: String(invoiceNumber),
      })
      if (rpcErr) throw new Error(rpcErr.message)
      const r = data as
        | { total?: number; matched?: number; fuzzy?: number; none?: number }
        | null
      if (r) {
        toast.success(
          `Matching complete — ${r.matched ?? 0} matched · ${r.fuzzy ?? 0} fuzzy · ${
            r.none ?? 0
          } unmatched (${r.total ?? 0} total)`
        )
      } else {
        toast.success('Activity matching complete')
      }
      setRefreshKey((k) => k + 1)
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : ((error as { message?: string })?.message ?? 'Unknown error')
      toast.error(`Activity matching failed: ${msg}`)
    } finally {
      setMatching(false)
    }
  }, [invoiceNumber, lineItems.length])

  // ── Run Validation (RPC) ─────────────────────────────────────────────────
  const handleRunValidation = useCallback(async () => {
    if (!invoiceNumber) return
    if (lineItems.length === 0) {
      toast.error('No line items to validate.')
      return
    }
    setValidating(true)
    try {
      const { data, error: rpcErr } = await supabase.rpc('validate_dcli_line_items', {
        p_invoice_id: String(invoiceNumber),
      })
      if (rpcErr) throw new Error(rpcErr.message)
      const r = data as
        | { total?: number; pass?: number; fail?: number; warn?: number; skipped?: number }
        | null
      if (r) {
        toast.success(
          `Validation complete — ${r.pass ?? 0} pass · ${r.fail ?? 0} fail · ${
            r.warn ?? 0
          } warn · ${r.skipped ?? 0} skipped (${r.total ?? 0} total)`
        )
      } else {
        toast.success('Validation complete')
      }
      setRefreshKey((k) => k + 1)
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : ((error as { message?: string })?.message ?? 'Unknown error')
      toast.error(`Validation failed: ${msg}`)
    } finally {
      setValidating(false)
    }
  }, [invoiceNumber, lineItems.length])

  // ── Inline status update ─────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (lineId: string, status: DcliLineItemStatus) => {
      setRowSaving((prev) => ({ ...prev, [lineId]: true }))
      try {
        const { error: updateErr } = await supabase
          .from('dcli_internal_line_item')
          .update({ line_item_status: status })
          .eq('id', lineId)
        if (updateErr) throw updateErr
        setRefreshKey((k) => k + 1)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setRowSaving((prev) => ({ ...prev, [lineId]: false }))
      }
    },
    []
  )

  if (!invoiceNumber) {
    return <div className="p-6 text-destructive">No invoice number provided.</div>
  }

  const headerError = invoiceError || linesError

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate('/vendors/dcli?tab=invoices')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Invoices
        </button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold font-mono">Invoice {invoiceNumber}</h1>
        {invoice?.portal_status ? (
          <span className="px-2 py-0.5 rounded-full text-xs border bg-muted text-foreground font-medium">
            {invoice.portal_status}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs border bg-muted text-muted-foreground">
            No Status
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
            onClick={handleRunActivityMatching}
            disabled={matching || validating || linesLoading}
            className="gap-2"
          >
            {matching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {matching ? 'Matching…' : 'Run Activity Matching'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunValidation}
            disabled={matching || validating || linesLoading}
            className="gap-2"
          >
            {validating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShieldCheck size={14} />
            )}
            {validating ? 'Validating…' : 'Run Validation'}
          </Button>
          {isPaid ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
              disabled={linesLoading || exportableLines.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet size={14} />
              Export to BC
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="outline" size="sm" disabled className="gap-2">
                    <FileSpreadsheet size={14} />
                    Export to BC
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Invoice must be Paid to export</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {headerError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle size={14} /> {headerError}
        </div>
      )}

      {/* Stat cards */}
      {invoiceLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Invoice Date</p>
              <p className="text-base font-bold">
                {formatShortDate(invoice?.billing_date ?? invoice?.invoice_date) || '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-base font-bold">{formatShortDate(invoice?.due_date) || '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-base font-bold">
                {formatUSD(invoice?.invoice_amount ?? totals.total) || '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Line Items</p>
              <p className="text-base font-bold">{lineItems.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two-column summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineItemStatusBreakdown lineItems={lineItems} />
        <ActivityMatchSummary lineItems={lineItems} />
      </div>

      {/* Line items table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <span className="text-xs text-muted-foreground">
              Set status inline or click View for full details
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs">
              <tr className="border-b">
                <th className="text-left px-3 py-2 font-medium">Chassis</th>
                <th className="text-left px-3 py-2 font-medium">Container</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Date Out</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Date In</th>
                <th className="text-right px-3 py-2 font-medium">Days</th>
                <th className="text-right px-3 py-2 font-medium">Rate</th>
                <th className="text-right px-3 py-2 font-medium">Total</th>
                <th className="text-left px-3 py-2 font-medium">Match</th>
                <th className="text-right px-3 py-2 font-medium">Variance</th>
                <th className="text-left px-3 py-2 font-medium">Validation</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {linesLoading ? (
                <tr>
                  <td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Loading line items…
                    </div>
                  </td>
                </tr>
              ) : lineItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">
                    No line items found.
                  </td>
                </tr>
              ) : (
                lineItems.map((line) => {
                  const variance = deriveDayVariance(line)
                  const validationStatus = deriveValidationStatus(line)
                  const containerVal = line.container ?? line.container_in ?? '—'
                  return (
                    <tr key={line.id} className="border-b last:border-b-0 hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono text-xs font-medium">
                        {line.chassis ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{containerVal}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {formatShortDate(line.date_out) || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {formatShortDate(line.date_in) || '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs">{line.bill_days ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        {line.rate != null ? formatUSD(line.rate) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">
                        {line.total != null ? formatUSD(line.total) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <MatchBar line={line} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <VarianceCell value={variance} />
                      </td>
                      <td className="px-3 py-2">
                        <ValidationBadge status={validationStatus} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={line.line_item_status ?? ''}
                            onValueChange={(val) =>
                              handleStatusChange(line.id, val as DcliLineItemStatus)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-[130px]">
                              <SelectValue placeholder="Set status…" />
                            </SelectTrigger>
                            <SelectContent>
                              {LINE_ITEM_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {rowSaving[line.id] && (
                            <Loader2 size={12} className="animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 gap-1"
                          onClick={() =>
                            navigate(
                              `/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/lines/${encodeURIComponent(line.id)}`
                            )
                          }
                        >
                          <Eye size={12} /> View
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
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
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs">
                  <tr className="border-b">
                    <th className="text-left px-3 py-2 font-medium">Chassis</th>
                    <th className="text-left px-3 py-2 font-medium">Container</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Date Out</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Date In</th>
                    <th className="text-right px-3 py-2 font-medium">Days Out</th>
                    <th className="text-left px-3 py-2 font-medium">Pick Up</th>
                    <th className="text-left px-3 py-2 font-medium">Location In</th>
                    <th className="text-left px-3 py-2 font-medium">Pool Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-mono text-xs">{a.chassis ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{a.container ?? '—'}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {formatShortDate(a.date_out) || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {formatShortDate(a.date_in) || '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs">{a.days_out ?? '—'}</td>
                      <td className="px-3 py-2 text-xs">{a.pick_up_location ?? '—'}</td>
                      <td className="px-3 py-2 text-xs">{a.location_in ?? '—'}</td>
                      <td className="px-3 py-2 text-xs">{a.pool_contract ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <BCExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        vendorKey={VENDOR_KEY}
        invoiceId={invoiceNumber}
        activityTable={ACTIVITY_TABLE}
        lineItems={exportableLines}
        onExported={() => setRefreshKey((k) => k + 1)}
      />

      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={() => navigate('/vendors/dcli?tab=invoices')}>
          Back to Invoices
        </Button>
      </div>
    </div>
  )
}
