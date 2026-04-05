import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Package } from 'lucide-react'

interface LoadDetailDrawerProps {
  open: boolean
  onClose: () => void
  row: Record<string, unknown> | null
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">
        {value || 'N/A'}
      </span>
    </div>
  )
}

export default function LoadDetailDrawer({ open, onClose, row }: LoadDetailDrawerProps) {
  if (!row) return null

  const str = (key: string) => (row[key] as string) || ''
  const num = (key: string) => Number(row[key]) || null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <SheetTitle className="font-mono">{str('ld_num') || 'Load Detail'}</SheetTitle>
            {str('status') && <Badge variant="outline">{str('status')}</Badge>}
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Load Identifiers */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Load Information</h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <Field label="LD #" value={<span className="font-mono">{str('ld_num')}</span>} />
              <Field label="SO #" value={<span className="font-mono">{str('so_num')}</span>} />
              <Field label="Status" value={str('status') ? <Badge variant="outline">{str('status')}</Badge> : null} />
              <Field label="Container #" value={<span className="font-mono">{str('container_number')}</span>} />
              <Field label="Chassis #" value={<span className="font-mono">{str('chassis_number')}</span>} />
              <Field label="Customer" value={str('owner') || str('customer_name')} />
              <Field label="Account Mgr" value={str('acct_mgr_name')} />
            </div>
          </div>

          {/* Carrier */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Carrier</h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <Field label="Carrier" value={str('carrier_name')} />
              <Field label="SCAC" value={<span className="font-mono">{str('carrier_scac')}</span>} />
            </div>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Locations</h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <Field label="Pickup Location" value={str('pickup_loc_name')} />
              <Field label="Drop Location" value={str('drop_loc_name')} />
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Dates</h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <Field label="Created" value={formatDate(str('createdate'))} />
              <Field label="Pickup Date" value={formatDate(str('pickup_actual_date'))} />
              <Field label="Drop Date" value={formatDate(str('drop_actual_date'))} />
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Financials</h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <Field label="Cust Rate" value={<span className="font-mono">{formatCurrency(num('customer_rate_amount'))}</span>} />
              <Field label="Cust Invoice" value={<span className="font-mono">{formatCurrency(num('customer_inv_amount'))}</span>} />
              <Field label="Carrier Rate" value={<span className="font-mono">{formatCurrency(num('carrier_rate_amount'))}</span>} />
              <Field label="Carrier Invoice" value={<span className="font-mono">{formatCurrency(num('carrier_inv_amount'))}</span>} />
              <Field label="Margin" value={<span className="font-mono">{formatCurrency(num('margin_rate'))}</span>} />
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Shipping</h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <Field label="SSL" value={str('steamshipline')} />
              <Field label="MBL" value={<span className="font-mono">{str('mbl')}</span>} />
              <Field label="Vessel ETA" value={formatDate(str('vessel_eta'))} />
              <Field label="Unbilled Flag" value={str('unbilledflag') ? <Badge variant="destructive">{str('unbilledflag')}</Badge> : 'No'} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
