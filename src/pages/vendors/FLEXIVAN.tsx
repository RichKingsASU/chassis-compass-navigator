import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { VendorEmptyState } from '@/components/vendor/VendorEmptyState'
import { VendorInvoicesTab, type VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'

const VENDOR_SLUG = 'flexivan'

export default function FLEXIVANPage() {
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])
  const handleInvoicesLoaded = useCallback((rows: VendorInvoice[]) => setInvoices(rows), [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">FLEXIVAN</h1>
        <p className="text-muted-foreground">Flexi-Van Leasing — Vendor Dashboard</p>
      </div>

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewInvoice={() => setInvoiceDialogOpen(true)}
        counts={{ invoices: invoices.length }}
      />

      {activeTab === 'dashboard' && (
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Company:</span> Flexi-Van Leasing</p>
            <p><span className="font-medium">Website:</span> <a href="https://www.flexivan.com" className="text-primary underline" target="_blank" rel="noreferrer">www.flexivan.com</a></p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'invoices' && (
        <VendorInvoicesTab
          vendorSlug={VENDOR_SLUG}
          refreshKey={invoiceRefreshKey}
          onNewInvoice={() => setInvoiceDialogOpen(true)}
          onDataLoaded={handleInvoicesLoaded}
        />
      )}
      {activeTab === 'activity' && <VendorEmptyState title="Activity" />}
      {activeTab === 'financials' && <VendorFinancialsTab invoices={invoices} />}
      {activeTab === 'documents' && <VendorDocumentsTab />}

      <NewInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        vendorSlug={VENDOR_SLUG}
        onCreated={() => setInvoiceRefreshKey(k => k + 1)}
      />
    </div>
  )
}
