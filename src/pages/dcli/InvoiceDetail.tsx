import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
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
import { Badge } from '@/components/ui/badge'

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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  )
}

export default function DCLIInvoiceDetail() {
  const params = useParams<{ invoiceId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const invoiceNumber = decodeURIComponent(params.invoiceId ?? '')

  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({})

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: invoice, isLoading: invoiceLoading, error: invoiceError } = useQuery({
    queryKey: ['dcli_invoice_internal', invoiceNumber],
    queryFn: async () => {
      if (!invoiceNumber) return null
      const { data, error } = await supabase
        .from('dcli_invoice_internal')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .order('invoice_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as DcliInvoiceInternal
    },
    enabled: !!invoiceNumber
  })

  const { data: lineItems = [], isLoading: linesLoading, error: linesError } = useDcliLineItems(invoiceNumber)

  const chassisList = useMemo(() => 
    Array.from(new Set(lineItems.map(l => (l.chassis ?? '').trim()).filter(c => c.length > 0))),
    [lineItems]
  )

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['dcli_activity', chassisList],
    queryFn: async () => {
      if (chassisList.length === 0) return []
      const { data, error } = await supabase
        .from('dcli_activity')
        .select('*')
        .in('chassis', chassisList)
        .order('date_out', { ascending: false })
        .limit(1000)
      if (error) throw error
      return data as DcliActivityRow[]
    },
    enabled: chassisList.length > 0
  })

  // ── Mutations ───────────────────────────────────────────────────────────────

  const matchingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('match_dcli_line_items', {
        p_invoice_id: String(invoiceNumber),
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dcli_internal_line_item', invoiceNumber] })
      const r = data as { total?: number; matched?: number; fuzzy?: number; none?: number } | null
      toast.success(
        r ? `Match results: ${r.matched ?? 0} matched, ${r.fuzzy ?? 0} fuzzy, ${r.none ?? 0} unmatched` 
          : 'Activity matching complete'
      )
    },
    onError: (error: Error) => toast.error(`Matching failed: ${error.message}`)
  })

  const validationMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('validate_dcli_line_items', {
        p_invoice_id: String(invoiceNumber),
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dcli_internal_line_item', invoiceNumber] })
      const r = data as { total?: number; pass?: number; fail?: number; warn?: number; skipped?: number } | null
      toast.success(
        r ? `Validation results: ${r.pass ?? 0} pass, ${r.fail ?? 0} fail, ${r.warn ?? 0} warn`
          : 'Validation complete'
      )
    },
    onError: (error: Error) => toast.error(`Validation failed: ${error.message}`)
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ lineId, status }: { lineId: string, status: DcliLineItemStatus }) => {
      setRowSaving(prev => ({ ...prev, [lineId]: true }))
      const { error } = await supabase
        .from('dcli_internal_line_item')
        .update({ line_item_status: status })
        .eq('id', lineId)
      if (error) throw error
      return { lineId, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcli_internal_line_item', invoiceNumber] })
    },
    onError: (error: Error, variables) => {
      toast.error(`Update failed: ${error.message}`)
    },
    onSettled: (data) => {
      if (data) setRowSaving(prev => ({ ...prev, [data.lineId]: false }))
    }
  })

  // ── Derived State ──────────────────────────────────────────────────────────

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

  const exportableLines = useMemo(() =>
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

  if (!invoiceNumber) {
    return <div className="p-8 text-destructive">No invoice number provided.</div>
  }

  const headerError = invoiceError || linesError

  return (
    <div className="p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendors/dcli?tab=invoices')}
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={14} /> Back to Invoices
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-mono uppercase">INV-{invoiceNumber}</h1>
            <div className="flex gap-2">
              {invoice?.portal_status && (
                <Badge variant="secondary" className="px-3 py-0.5 font-bold uppercase tracking-wider text-[10px]">
                  {invoice.portal_status}
                </Badge>
              )}
              {invoice?.dispute_status === 'Disputed' && (
                <Badge variant="destructive" className="px-3 py-0.5 font-bold uppercase tracking-wider text-[10px]">
                  Disputed
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => matchingMutation.mutate()}
            disabled={matchingMutation.isPending || validationMutation.isPending || linesLoading}
            className="gap-2 font-semibold"
          >
            {matchingMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {matchingMutation.isPending ? 'Matching...' : 'Run Matching'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => validationMutation.mutate()}
            disabled={matchingMutation.isPending || validationMutation.isPending || linesLoading}
            className="gap-2 font-semibold"
          >
            {validationMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            {validationMutation.isPending ? 'Validating...' : 'Run Validation'}
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!isPaid || linesLoading || exportableLines.length === 0}
                  className="gap-2 font-semibold"
                >
                  <FileSpreadsheet size={14} />
                  Export to BC
                </Button>
              </div>
            </TooltipTrigger>
            {!isPaid && <TooltipContent>Invoice must be Paid to export</TooltipContent>}
          </Tooltip>
        </div>
      </div>

      {headerError && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
          <AlertCircle size={16} /> 
          <p className="font-medium">{headerError instanceof Error ? headerError.message : String(headerError)}</p>
        </div>
      )}

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Invoice Date</p>
            {invoiceLoading ? <Skeleton className="h-8 w-24" /> : (
              <p className="text-2xl font-bold font-mono">
                {formatShortDate(invoice?.billing_date ?? invoice?.invoice_date) || '—'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Due Date</p>
            {invoiceLoading ? <Skeleton className="h-8 w-24" /> : (
              <p className="text-2xl font-bold font-mono">{formatShortDate(invoice?.due_date) || '—'}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Invoice Total</p>
            {invoiceLoading ? <Skeleton className="h-8 w-32" /> : (
              <p className="text-2xl font-black text-primary">
                {formatUSD(invoice?.invoice_amount ?? totals.total) || '—'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Lines</p>
            {linesLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-2xl font-bold">{lineItems.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LineItemStatusBreakdown lineItems={lineItems} />
        <ActivityMatchSummary lineItems={lineItems} />
      </div>

      {/* Line Items Section */}
      <Card>
        <CardHeader className="border-b py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Detailed Line Items</CardTitle>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {lineItems.length} Records Loaded
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Chassis</th>
                  <th className="text-left px-4 py-3">Container</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">Period</th>
                  <th className="text-right px-4 py-3">Days</th>
                  <th className="text-right px-4 py-3">Rate</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">TMS Match</th>
                  <th className="text-right px-4 py-3">Var</th>
                  <th className="text-left px-4 py-3">Audit</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {linesLoading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={11} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td>
                    </tr>
                  ))
                ) : lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground italic">
                      No line items detected for this invoice.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((line) => {
                    const variance = deriveDayVariance(line)
                    const validationStatus = deriveValidationStatus(line)
                    const containerVal = line.container ?? line.container_in ?? '—'
                    return (
                      <tr key={line.id} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-black text-foreground">
                          {line.chassis ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{containerVal}</td>
                        <td className="px-4 py-3 text-[11px] whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{formatShortDate(line.date_out) || '—'}</span>
                            <span className="text-muted-foreground">{formatShortDate(line.date_in) || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{line.bill_days ?? '0'}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {line.rate != null ? formatUSD(line.rate) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-primary">
                          {line.total != null ? formatUSD(line.total) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <MatchBar line={line} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <VarianceCell value={variance} />
                        </td>
                        <td className="px-4 py-3">
                          <ValidationBadge status={validationStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Select
                              value={line.line_item_status ?? ''}
                              onValueChange={(val) =>
                                updateStatusMutation.mutate({ lineId: line.id, status: val as DcliLineItemStatus })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <SelectTrigger className="h-8 text-[11px] w-[130px] font-semibold">
                                <SelectValue placeholder="Status..." />
                              </SelectTrigger>
                              <SelectContent>
                                {LINE_ITEM_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {rowSaving[line.id] && (
                              <Loader2 size={14} className="animate-spin text-primary" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              navigate(
                                `/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/lines/${encodeURIComponent(line.id)}`
                              )
                            }
                          >
                            <Eye size={16} className="text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <DocumentsPanel invoiceNumber={invoiceNumber} />

      {/* External Activity Correlation */}
      {!activityLoading && activity.length > 0 && (
        <Card className="border-2 border-primary/10">
          <CardHeader className="bg-primary/5 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Matched Activity Context</CardTitle>
              <Badge variant="outline" className="bg-background">
                {activity.length} Correlated Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <tr className="border-b">
                    <th className="text-left px-4 py-3">Chassis</th>
                    <th className="text-left px-4 py-3">Container</th>
                    <th className="text-left px-4 py-3">Out Date</th>
                    <th className="text-left px-4 py-3">In Date</th>
                    <th className="text-right px-4 py-3">Days</th>
                    <th className="text-left px-4 py-3">Origin</th>
                    <th className="text-left px-4 py-3">Destination</th>
                    <th className="text-left px-4 py-3">Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.id} className="border-b last:border-b-0 hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-xs">{a.chassis ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{a.container ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] font-medium">{formatShortDate(a.date_out) || '—'}</td>
                      <td className="px-4 py-3 text-[11px] font-medium">{formatShortDate(a.date_in) || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold">{a.days_out ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">{a.pick_up_location ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">{a.location_in ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold">{a.pool_contract ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Dialogs */}
      <BCExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        vendorKey={VENDOR_KEY}
        invoiceId={invoiceNumber}
        activityTable={ACTIVITY_TABLE}
        lineItems={exportableLines}
        onExported={() => queryClient.invalidateQueries({ queryKey: ['dcli_internal_line_item', invoiceNumber] })}
      />

      <div className="flex justify-end pt-8">
        <Button variant="outline" size="lg" onClick={() => navigate('/vendors/dcli?tab=invoices')} className="px-10">
          Close View
        </Button>
      </div>
    </div>
  )
}
