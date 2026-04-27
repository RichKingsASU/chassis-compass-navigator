import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RefreshCw, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataGrid } from '@/components/ui/DataGrid'
import type { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community'
import { useDcliLineItems } from '@/features/dcli/hooks/useDcliLineItems'
import { useDcliActivity } from '@/features/dcli/hooks/useDcliActivity'
import { DocumentsPanel } from '@/features/dcli/components/DocumentsPanel'
import { formatShortDate, formatUSD } from '@/features/dcli/format'
import type {
  DcliInternalLineItem,
  DcliInvoiceInternal,
  DcliActivityRow,
} from '@/features/dcli/types'

function statusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-muted text-muted-foreground border-border'
  const s = status.trim()
  if (s === 'Open') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (s === 'Closed') return 'bg-gray-100 text-gray-700 border-gray-200'
  if (s === 'Credit') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (s === 'Disputed') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-muted text-muted-foreground border-border'
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
  const tmsChassis = String(tms['chassis'] ?? tms['chassis_number'] ?? '')
    .trim()
    .toUpperCase()
  const lineChassis = (line.chassis ?? '').trim().toUpperCase()
  if (!tmsChassis || tmsChassis !== lineChassis) {
    return { label: 'No match', badgeClass: 'bg-red-100 text-red-800 border-red-200' }
  }
  const lineAmt = typeof line.total === 'number' ? line.total : Number(line.total ?? NaN)
  const tmsAmtRaw =
    tms['amount'] ?? tms['total'] ?? tms['charge_amount'] ?? tms['cust_rate_charge']
  const tmsAmt = tmsAmtRaw == null ? NaN : Number(tmsAmtRaw)
  if (!Number.isFinite(lineAmt) || !Number.isFinite(tmsAmt)) {
    return { label: 'Unscored', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' }
  }
  const diff = Math.abs(lineAmt - tmsAmt)
  if (diff <= 0.01) {
    return { label: '100%', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  }
  const denom = Math.max(Math.abs(lineAmt), 0.01)
  const pct = diff / denom
  if (pct <= 0.1) {
    return { label: '75%', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' }
  }
  return { label: '50%', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' }
}

export default function DCLIInvoiceDetail() {
  const params = useParams<{ invoiceId?: string; invoiceNumber?: string }>()
  const navigate = useNavigate()
  const rawParam = params.invoiceNumber ?? params.invoiceId ?? ''
  const invoiceNumber = decodeURIComponent(rawParam)

  const [invoice, setInvoice] = useState<DcliInvoiceInternal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const { lineItems, loading: linesLoading, error: linesError } = useDcliLineItems(
    invoiceNumber,
    refreshKey
  )

  const chassisList = useMemo(
    () =>
      Array.from(
        new Set(
          lineItems
            .map((l) => (l.chassis ?? '').trim())
            .filter((c): c is string => c.length > 0)
        )
      ),
    [lineItems]
  )

  const { activity, loading: activityLoading } = useDcliActivity({
    chassisList: chassisList.length > 0 ? chassisList : undefined,
  })

  useEffect(() => {
    let cancelled = false
    if (!invoiceNumber) return
    async function loadInvoice() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice_internal')
          .select(
            'id, invoice_number, invoice_date, billing_date, due_date, invoice_amount, invoice_balance, total_payments, dispute_pending, dispute_approved, portal_status, dispute_status, invoice_type'
          )
          .eq('invoice_number', invoiceNumber)
          .limit(1)
          .maybeSingle()
        if (fetchErr) throw fetchErr
        if (!cancelled) setInvoice((data ?? null) as DcliInvoiceInternal | null)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load invoice')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadInvoice()
    return () => {
      cancelled = true
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

      let matched = 0
      let mismatched = 0
      let unmatched = 0
      for (const l of lineItems) {
        const k = (l.chassis ?? '').trim().toUpperCase()
        const records = k ? actByChassis.get(k) : undefined
        if (!records || records.length === 0) {
          unmatched++
          continue
        }
        const sumDays = records.reduce((s, r) => s + (Number(r.days_out) || 0), 0)
        const lineDays = Number(l.bill_days ?? 0)
        if (Math.abs(sumDays - lineDays) <= 1) matched++
        else mismatched++
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
        `Validation ${status.toUpperCase()} — ${matched} matched · ${mismatched} mismatched · ${unmatched} unmatched`
      )
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
        </div>
      </div>

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
        <CardContent>
          {linesError && (
            <div className="text-sm text-destructive mb-2">{linesError}</div>
          )}
          <DataGrid<DcliInternalLineItem>
            rowData={lineItems}
            columnDefs={lineItemColumnDefs}
            loading={linesLoading}
            height={520}
            gridProps={{
              pinnedBottomRowData: lineItems.length > 0 ? (pinnedBottomRow as DcliInternalLineItem[]) : undefined,
            }}
          />
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
