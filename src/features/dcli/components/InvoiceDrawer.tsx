import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { Button } from '@/components/ui/button'
import { DataGrid } from '@/components/ui/DataGrid'
import { useDcliLineItems } from '../hooks/useDcliLineItems'
import type { DcliInternalLineItem, DcliInvoiceInternal } from '../types'
import { formatShortDate, formatUSD } from '../format'
import { DocumentsPanel } from './DocumentsPanel'

interface InvoiceDrawerProps {
  open: boolean
  invoice: DcliInvoiceInternal | null
  onClose: () => void
}

function statusBadge(status: string | null | undefined): string {
  if (!status) return 'bg-muted text-muted-foreground border-border'
  const s = status.trim()
  if (s === 'Open') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (s === 'Closed') return 'bg-gray-100 text-gray-700 border-gray-200'
  if (s === 'Credit') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (s === 'Disputed') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-muted text-muted-foreground border-border'
}

export function InvoiceDrawer({ open, invoice, onClose }: InvoiceDrawerProps) {
  const navigate = useNavigate()
  const invoiceNumber = invoice?.invoice_number ?? null
  const { lineItems, loading, error } = useDcliLineItems(open ? invoiceNumber : null)

  const columnDefs = useMemo<ColDef<DcliInternalLineItem>[]>(
    () => [
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
    ],
    []
  )

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[60%] max-w-[1200px] bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between gap-3 p-5 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold font-mono">
                {invoice?.invoice_number ?? '—'}
              </h2>
              {invoice?.invoice_type && (
                <span className="px-2 py-0.5 rounded-full text-xs border bg-muted text-muted-foreground">
                  {invoice.invoice_type}
                </span>
              )}
              {invoice?.portal_status && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs border font-medium ${statusBadge(
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
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Billing Date</p>
                <p className="font-medium">
                  {formatShortDate(invoice?.billing_date ?? invoice?.invoice_date) || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Due Date</p>
                <p className="font-medium">{formatShortDate(invoice?.due_date) || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Invoice Amount</p>
                <p className="font-medium">{formatUSD(invoice?.invoice_amount) || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Balance</p>
                <p className="font-medium">{formatUSD(invoice?.invoice_balance) || '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {invoiceNumber && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate(`/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/detail`)
                  onClose()
                }}
              >
                Open detail
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close drawer">
              <X size={18} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Line Items</h3>
              <p className="text-xs text-muted-foreground">{lineItems.length} rows</p>
            </div>
            {error && (
              <div className="text-sm text-destructive mb-2">{error}</div>
            )}
            <DataGrid<DcliInternalLineItem>
              rowData={lineItems}
              columnDefs={columnDefs}
              loading={loading}
              height={420}
            />
          </section>

          <DocumentsPanel invoiceNumber={invoiceNumber} title="Invoice Documents" />
        </div>
      </aside>
    </>
  )
}
