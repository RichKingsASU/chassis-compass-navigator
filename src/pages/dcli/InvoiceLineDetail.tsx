import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

function Field({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  const display =
    value == null || value === '' || value === '—' ? (
      <span className="text-muted-foreground">—</span>
    ) : (
      value
    )
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{display}</p>
    </div>
  )
}

function MatchIcon({ matched }: { matched: boolean | null }) {
  if (matched === null) return <span className="text-muted-foreground">—</span>
  return matched ? (
    <span className="text-emerald-600 font-bold">✓</span>
  ) : (
    <span className="text-red-500 font-bold">✗</span>
  )
}

function MatchScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-300">
        Not Scored
      </span>
    )
  }
  if (score >= 100) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-300">
        100% Match
      </span>
    )
  }
  if (score >= 75) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border bg-amber-100 text-amber-800 border-amber-300">
        Partial Match — {score}%
      </span>
    )
  }
  if (score >= 50) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border bg-orange-100 text-orange-800 border-orange-300">
        Low Match — {score}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-800 border-red-300">
      No Match — {score}%
    </span>
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
  const invoiceNumber = decodeURIComponent(params.invoiceId ?? '')
  const lineId = decodeURIComponent(params.lineId ?? '')

  const [line, setLine] = useState<DcliInternalLineItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    if (!lineId) {
      setLoading(false)
      return
    }
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_internal_line_item')
          .select('*')
          .eq('id', lineId)
          .maybeSingle()
        if (fetchErr) throw fetchErr
        if (!cancelled) setLine((data ?? null) as DcliInternalLineItem | null)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load line item')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lineId, refreshKey])

  const handleStatusChange = useCallback(
    async (status: DcliLineItemStatus) => {
      if (!lineId) return
      setStatusSaving(true)
      try {
        const { error: updateErr } = await supabase
          .from('dcli_internal_line_item')
          .update({ line_item_status: status })
          .eq('id', lineId)
        if (updateErr) throw updateErr
        setRefreshKey((k) => k + 1)
        toast.success(`Status updated to "${status}"`)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setStatusSaving(false)
      }
    },
    [lineId]
  )

  const backToInvoice = () => {
    if (invoiceNumber) {
      navigate(`/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/detail`)
    } else {
      navigate('/vendors/dcli?tab=invoices')
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <Skeleton className="h-6 w-64" />
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-52" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
        <Button variant="outline" onClick={backToInvoice}>
          Back to Invoice
        </Button>
      </div>
    )
  }

  if (!line) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Line item not found in <code>dcli_internal_line_item</code>.
          </p>
        </Card>
        <Button variant="outline" onClick={backToInvoice}>
          Back to Invoice
        </Button>
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
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={backToInvoice}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Invoice {invoiceNumber || '—'}
        </button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold">
          Line Item — <span className="font-mono">{line.chassis ?? '—'}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Charge Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Chassis" value={line.chassis} mono />
              <Field label="Container" value={line.container ?? line.container_in} mono />
              <Field label="Date Out" value={formatShortDate(line.date_out)} />
              <Field label="Date In" value={formatShortDate(line.date_in)} />
              <Field label="Bill Days" value={line.bill_days} />
              <Field label="Rate" value={line.rate != null ? formatUSD(line.rate) : null} />
              <Field
                label="Total"
                value={line.total != null ? formatUSD(line.total) : null}
              />
              <Field label="Pool Contract" value={line.pool_contract} />
              <Field label="Pick Up Location" value={line.pick_up_location} />
              <Field label="Return Location" value={line.return_location} />
              <Field
                label="SO #"
                value={
                  line.so_num ? (
                    <span className="font-mono">{line.so_num}</span>
                  ) : (
                    <span className="text-amber-700 italic text-xs">
                      Not yet matched — run Run Activity Matching
                    </span>
                  )
                }
              />
              <div>
                <p className="text-xs text-muted-foreground">BC Export</p>
                {line.bc_exported ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-800 border-emerald-300">
                    Exported{line.bc_exported_at ? ` ${formatShortDate(line.bc_exported_at)}` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-300">
                    Not exported
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center gap-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <Select
                value={line.line_item_status ?? ''}
                onValueChange={(val) => handleStatusChange(val as DcliLineItemStatus)}
              >
                <SelectTrigger className="h-8 text-xs w-[160px]">
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
              {statusSaving && (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">TMS Match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!tms ? (
              <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
                No TMS match found. Run Activity Matching from the invoice page.
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border text-xs">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium text-muted-foreground">Field</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">
                          Vendor Value
                        </th>
                        <th className="text-left p-2 font-medium text-muted-foreground">
                          TMS Value
                        </th>
                        <th className="text-center p-2 font-medium text-muted-foreground">
                          Match?
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-2 font-medium text-muted-foreground">Chassis</td>
                        <td className="p-2 font-mono">{line.chassis ?? '—'}</td>
                        <td className="p-2 font-mono text-muted-foreground">
                          {tms.chassis ?? '—'}
                        </td>
                        <td className="p-2 text-center">
                          <MatchIcon matched={compareStrings(line.chassis, tms.chassis)} />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-muted-foreground">Date Out</td>
                        <td className="p-2 font-mono">{formatShortDate(line.date_out) || '—'}</td>
                        <td className="p-2 font-mono text-muted-foreground">
                          {formatShortDate(tms.date_out) || '—'}
                        </td>
                        <td className="p-2 text-center">
                          <MatchIcon matched={compareDates(line.date_out, tms.date_out)} />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-muted-foreground">Date In</td>
                        <td className="p-2 font-mono">{formatShortDate(line.date_in) || '—'}</td>
                        <td className="p-2 font-mono text-muted-foreground">
                          {formatShortDate(tms.date_in) || '—'}
                        </td>
                        <td className="p-2 text-center">
                          <MatchIcon matched={compareDates(line.date_in, tms.date_in)} />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-muted-foreground">Days</td>
                        <td className="p-2 font-mono">{line.bill_days ?? '—'}</td>
                        <td className="p-2 font-mono text-muted-foreground">{tmsDays ?? '—'}</td>
                        <td className="p-2 text-center">
                          <MatchIcon
                            matched={
                              tmsDays != null && line.bill_days != null
                                ? compareNumbers(line.bill_days, tmsDays, 1)
                                : null
                            }
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-muted-foreground">Rate</td>
                        <td className="p-2 font-mono">
                          {line.rate != null ? formatUSD(line.rate) : '—'}
                        </td>
                        <td className="p-2 font-mono text-muted-foreground">
                          {typeof tms.rate === 'number' ? formatUSD(tms.rate) : '—'}
                        </td>
                        <td className="p-2 text-center">
                          <MatchIcon
                            matched={
                              typeof tms.rate === 'number' && typeof line.rate === 'number'
                                ? compareNumbers(line.rate, tms.rate)
                                : null
                            }
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-muted-foreground">Total</td>
                        <td className="p-2 font-mono">
                          {line.total != null ? formatUSD(line.total) : '—'}
                        </td>
                        <td className="p-2 font-mono text-muted-foreground">
                          {typeof tms.total === 'number' ? formatUSD(tms.total) : '—'}
                        </td>
                        <td className="p-2 text-center">
                          <MatchIcon
                            matched={
                              typeof tms.total === 'number' && typeof line.total === 'number'
                                ? compareNumbers(line.total, tms.total)
                                : null
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <MatchScoreBadge score={matchScore} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Day Variance</p>
                    <p className="text-sm font-mono">
                      {dayVariance == null
                        ? '—'
                        : dayVariance === 0
                          ? '0 days'
                          : `${dayVariance > 0 ? '+' : ''}${dayVariance} days`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Variance</p>
                    <p className="text-sm font-mono">
                      {amountVariance == null
                        ? '—'
                        : amountVariance === 0
                          ? '$0.00'
                          : `${amountVariance > 0 ? '+' : '-'}${formatUSD(Math.abs(amountVariance))}`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <LineItemDocumentsPanel invoiceNumber={invoiceNumber} lineItemId={line.id} />

      <div className="flex justify-end">
        <Button variant="outline" onClick={backToInvoice}>
          Back to Invoice
        </Button>
      </div>
    </div>
  )
}
