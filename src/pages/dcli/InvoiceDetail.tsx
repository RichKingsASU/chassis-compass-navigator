import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataGrid } from '@/components/ui/DataGrid'
import type { ColDef } from 'ag-grid-community'
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

export default function DCLIInvoiceDetail() {
  const params = useParams<{ invoiceId?: string; invoiceNumber?: string }>()
  const navigate = useNavigate()
  const rawParam = params.invoiceNumber ?? params.invoiceId ?? ''
  const invoiceNumber = decodeURIComponent(rawParam)

  const [invoice, setInvoice] = useState<DcliInvoiceInternal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { lineItems, loading: linesLoading, error: linesError } = useDcliLineItems(invoiceNumber)

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
    let billDays = 0
    let total = 0
    let tax = 0
    let fees = 0
    for (const l of lineItems) {
      if (typeof l.bill_days === 'number') billDays += l.bill_days
      if (typeof l.total === 'number') total += l.total
      if (typeof l.tax_amount === 'number') tax += l.tax_amount
      if (typeof l.total_fees === 'number') fees += l.total_fees
    }
    return { billDays, total, tax, fees }
  }, [lineItems])

  const lineItemColumnDefs = useMemo<ColDef<DcliInternalLineItem>[]>(
    () => [
      { headerName: 'Line (DU#)', field: 'du_number', width: 110, cellClass: 'font-mono' },
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
    ],
    []
  )

  const pinnedBottomRow = useMemo<Partial<DcliInternalLineItem>[]>(
    () => [
      {
        du_number: 'TOTAL',
        chassis: '',
        bill_days: totals.billDays,
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
            <span className="text-xs text-muted-foreground">{lineItems.length} rows</span>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Activity (matched chassis)</CardTitle>
            <span className="text-xs text-muted-foreground">
              {chassisList.length === 0
                ? 'No chassis to match'
                : `${activity.length} rows · ${chassisList.length} chassis`}
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

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/vendors/dcli#invoices')}>
          Back to Invoices
        </Button>
      </div>
    </div>
  )
}
