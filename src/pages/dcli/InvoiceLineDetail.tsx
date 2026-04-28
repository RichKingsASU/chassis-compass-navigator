import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatShortDate, formatUSD } from '@/features/dcli/format'
import { LineItemDocumentsPanel } from '@/features/dcli/components/LineItemDocumentsPanel'
import {
  LINE_ITEM_STATUSES,
  deriveAmountVariance,
  deriveDayVariance,
  deriveMatchScore,
} from '@/components/dcli/lineItemDerive'
import type {
  DcliInternalLineItem,
  DcliLineItemStatus,
  DcliTmsMatchSnapshot,
} from '@/features/dcli/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function Field({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  highlight?: boolean
}) {
  const display =
    value == null || value === '' || value === '—' ? (
      <span className="text-muted-foreground italic">Pending</span>
    ) : (
      value
    )
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''} ${highlight ? 'text-primary' : ''}`}>{display}</p>
    </div>
  )
}

function MatchIcon({ matched }: { matched: boolean | null }) {
  if (matched === null) return <span className="text-muted-foreground">—</span>
  return matched ? (
    <CheckCircle2 className="text-emerald-500 h-4 w-4 mx-auto" />
  ) : (
    <XCircle className="text-red-500 h-4 w-4 mx-auto" />
  )
}

function MatchScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground border-dashed">
        Not Evaluated
      </Badge>
    )
  }
  if (score >= 100) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold">
        100% Correlation
      </Badge>
    )
  }
  if (score >= 75) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 font-bold">
        High Probability — {score}%
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="font-bold">
      Discrepancy — {score}%
    </Badge>
  )
}

function compareStrings(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return a.trim().toUpperCase() === b.trim().toUpperCase()
}

function compareNumbers(
  a: number | null | undefined,
  b: number | null | undefined,
  tolerance = 0.01
): boolean {
  if (typeof a !== 'number' || typeof b !== 'number') return false
  return Math.abs(a - b) <= tolerance
}

function compareDates(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false
  const da = new Date(a)
  const db = new Date(b)
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false
  return Math.abs(da.getTime() - db.getTime()) < 86400000
}

export default function DCLIInvoiceLineDetail() {
  const params = useParams<{ invoiceId?: string; lineId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const invoiceNumber = decodeURIComponent(params.invoiceId ?? '')
  const lineId = decodeURIComponent(params.lineId ?? '')

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: line, isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['dcli_internal_line_item', lineId],
    queryFn: async () => {
      if (!lineId) return null
      const { data, error } = await supabase
        .from('dcli_internal_line_item')
        .select('*')
        .eq('id', lineId)
        .maybeSingle()
      if (error) throw error
      return data as DcliInternalLineItem
    },
    enabled: !!lineId
  })

  // ── Mutations ───────────────────────────────────────────────────────────────

  const updateStatusMutation = useMutation({
    mutationFn: async (status: DcliLineItemStatus) => {
      if (!lineId) return
      const { error } = await supabase
        .from('dcli_internal_line_item')
        .update({ line_item_status: status })
        .eq('id', lineId)
      if (error) throw error
      return status
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['dcli_internal_line_item', lineId] })
      toast.success(`Status updated to ${status}`)
    },
    onError: (error: Error) => toast.error(`Status update failed: ${error.message}`)
  })

  const backToInvoice = () => {
    if (invoiceNumber) {
      navigate(`/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/detail`)
    } else {
      navigate('/vendors/dcli?tab=invoices')
    }
  }

  if (fetchError) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{fetchError instanceof Error ? fetchError.message : 'Failed to load line item'}</p>
        </div>
        <Button variant="outline" onClick={backToInvoice}>Back to Invoice</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading line item…</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[420px] w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      </div>
    )
  }

  if (!line) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-destructive font-medium text-lg text-center py-20">Line item record not found in system.</p>
        <div className="flex justify-center">
          <Button variant="outline" onClick={backToInvoice}>Back to Invoice</Button>
        </div>
      </div>
    )
  }

  const tms: DcliTmsMatchSnapshot | null = line.tms_match ?? null
  const matchScore = deriveMatchScore(tms)
  const dayVariance = deriveDayVariance(line)
  const amountVariance = deriveAmountVariance(line)
  const tmsDays = tms
    ? typeof tms.days === 'number'
      ? tms.days
      : typeof tms.days_out === 'number'
        ? tms.days_out
        : null
    : null

  return (
    <div className="p-8 space-y-8">
      {/* Header section */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={backToInvoice}
          className="gap-2 -ml-2 text-muted-foreground"
        >
          <ArrowLeft size={14} /> Invoice {invoiceNumber || '—'}
        </Button>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Line Detail: <span className="font-mono text-primary">{line?.chassis ?? '—'}</span>
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-0.5 font-bold uppercase tracking-wider text-[10px] bg-muted/50">
              Audit ID: {line?.id.split('-')[0]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/5">
            <CardTitle className="text-base uppercase tracking-widest font-bold text-muted-foreground">Captured Charge Data</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            {loading ? (
              <div className="grid grid-cols-2 gap-8">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                <Field label="Chassis" value={line?.chassis} mono />
                <Field label="Container Reference" value={line?.container ?? line?.container_in} mono />
                <Field label="Intermodal Out" value={formatShortDate(line?.date_out)} />
                <Field label="Intermodal In" value={formatShortDate(line?.date_in)} />
                <Field label="Billed Duration" value={`${line?.bill_days || 0} Days`} highlight />
                <Field label="Applicable Rate" value={line?.rate != null ? formatUSD(line?.rate) : null} />
                <Field label="Calculated Total" value={line?.total != null ? formatUSD(line?.total) : null} highlight />
                <Field label="Contract Vehicle" value={line?.pool_contract} />
                <div className="col-span-2 grid grid-cols-2 gap-8 border-t pt-8">
                  <Field label="Origin Location" value={line?.pick_up_location} />
                  <Field label="Destination" value={line?.return_location} />
                </div>
                <div className="col-span-2 border-t pt-8">
                  <Field 
                    label="Service Order Matching" 
                    value={
                      line?.so_num ? (
                        <span className="font-mono text-primary font-bold">{line.so_num}</span>
                      ) : (
                        <span className="text-amber-600 italic text-xs flex items-center gap-1">
                          <AlertCircle size={10} /> Unmatched - Run sync diagnostic
                        </span>
                      )
                    } 
                  />
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accounting Status</p>
                <div className="flex items-center gap-3">
                  <Select
                    value={line?.line_item_status ?? ''}
                    onValueChange={(val) => updateStatusMutation.mutate(val as DcliLineItemStatus)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="h-10 text-sm w-[180px] font-bold border-2">
                      <SelectValue placeholder="Set status…" />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_ITEM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="font-medium">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updateStatusMutation.isPending && (
                    <Loader2 size={16} className="animate-spin text-primary" />
                  )}
                </div>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ERP Integration</p>
                {line?.bc_exported ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 px-4 py-1">
                    Exported {line.bc_exported_at ? formatShortDate(line.bc_exported_at) : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-4 py-1 text-muted-foreground border-dashed">
                    Not Synced to BC
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader className="border-b bg-primary/5">
            <CardTitle className="text-base uppercase tracking-widest font-bold text-primary flex items-center justify-between">
              TMS Correlation Audit
              <MatchScoreBadge score={matchScore} />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            {!tms && !loading ? (
              <div className="p-12 flex flex-col items-center text-center space-y-4 bg-muted/20 rounded-xl border-2 border-dashed">
                <AlertCircle size={32} className="text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-bold">Missing Activity Match</p>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    No corresponding activity record found in TMS. Run the global matching engine to correlate data.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border-2 shadow-sm bg-background">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b">
                      <tr>
                        <th className="text-left p-3">Entity Field</th>
                        <th className="text-left p-3">Vendor</th>
                        <th className="text-left p-3">TMS Core</th>
                        <th className="text-center p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium">
                      <tr>
                        <td className="p-3 text-muted-foreground">Chassis ID</td>
                        <td className="p-3 font-mono">{line?.chassis ?? '—'}</td>
                        <td className="p-3 font-mono text-muted-foreground">{tms?.chassis ?? '—'}</td>
                        <td className="p-3 text-center">
                          <MatchIcon matched={compareStrings(line?.chassis, tms?.chassis)} />
                        </td>
                      </tr>
                      <tr className="bg-muted/5">
                        <td className="p-3 text-muted-foreground">Start Date</td>
                        <td className="p-3 font-mono">{formatShortDate(line?.date_out) || '—'}</td>
                        <td className="p-3 font-mono text-muted-foreground">{formatShortDate(tms?.date_out) || '—'}</td>
                        <td className="p-3 text-center">
                          <MatchIcon matched={compareDates(line?.date_out, tms?.date_out)} />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-muted-foreground">End Date</td>
                        <td className="p-3 font-mono">{formatShortDate(line?.date_in) || '—'}</td>
                        <td className="p-3 font-mono text-muted-foreground">{formatShortDate(tms?.date_in) || '—'}</td>
                        <td className="p-3 text-center">
                          <MatchIcon matched={compareDates(line?.date_in, tms?.date_in)} />
                        </td>
                      </tr>
                      <tr className="bg-muted/5">
                        <td className="p-3 text-muted-foreground">Duration</td>
                        <td className="p-3 font-mono">{line?.bill_days ?? '—'}</td>
                        <td className="p-3 font-mono text-muted-foreground">{tmsDays ?? '—'}</td>
                        <td className="p-3 text-center">
                          <MatchIcon matched={tmsDays != null && line?.bill_days != null ? compareNumbers(line.bill_days, tmsDays, 1) : null} />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-muted-foreground">Unit Rate</td>
                        <td className="p-3 font-mono">{line?.rate != null ? formatUSD(line.rate) : '—'}</td>
                        <td className="p-3 font-mono text-muted-foreground">{typeof tms?.rate === 'number' ? formatUSD(tms.rate) : '—'}</td>
                        <td className="p-3 text-center">
                          <MatchIcon matched={typeof tms?.rate === 'number' && typeof line?.rate === 'number' ? compareNumbers(line.rate, tms.rate) : null} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="p-4 bg-muted/30 rounded-lg space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Temporal Drift</p>
                    <p className={`text-xl font-black font-mono ${dayVariance && dayVariance !== 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {dayVariance == null ? '—' : dayVariance === 0 ? 'Synchronized' : `${dayVariance > 0 ? '+' : ''}${dayVariance} Days`}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Financial Gap</p>
                    <p className={`text-xl font-black font-mono ${amountVariance && amountVariance !== 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {amountVariance == null ? '—' : amountVariance === 0 ? '$0.00' : `${amountVariance > 0 ? '+' : '-'}${formatUSD(Math.abs(amountVariance))}`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <LineItemDocumentsPanel invoiceNumber={invoiceNumber} lineItemId={line?.id || ''} />

      <div className="flex justify-end pt-8 border-t">
        <Button variant="outline" size="lg" onClick={backToInvoice} className="px-10">
          Close Analysis
        </Button>
      </div>
    </div>
  )
}
