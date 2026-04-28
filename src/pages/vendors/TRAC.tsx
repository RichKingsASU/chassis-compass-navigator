import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { VendorEmptyState } from '@/components/vendor/VendorEmptyState'
import { VendorInvoicesTab, type VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'
import { Ship, Info, ExternalLink, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const VENDOR_SLUG = 'trac'

export default function TRACPage() {
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])
  
  const handleInvoicesLoaded = useCallback((rows: VendorInvoice[]) => setInvoices(rows), [])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-primary rounded-3xl text-primary-foreground shadow-2xl shadow-primary/20">
          <Ship size={32} strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">TRAC HUB</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">TRAC Intermodal Intelligence Terminal</p>
        </div>
      </div>

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewInvoice={() => setInvoiceDialogOpen(true)}
        counts={{ invoices: invoices.length }}
      />

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tight uppercase">
                <Info size={18} className="text-primary" /> Nexus Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Legal Entity</p>
                <p className="text-xl font-black">TRAC Intermodal</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operational Portal</p>
                <a 
                  href="https://www.tracintermodal.com" 
                  className="text-xl font-black text-primary hover:underline flex items-center gap-2" 
                  target="_blank" 
                  rel="noreferrer"
                >
                  tracintermodal.com
                  <ExternalLink size={16} strokeWidth={3} />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-primary/[0.03]">
            <CardHeader className="bg-primary/10 border-b py-4">
              <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tight uppercase">
                <ShieldAlert size={18} className="text-primary" /> Tactical Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm font-bold leading-relaxed uppercase tracking-tight text-muted-foreground">
                Monitoring active chassis deployments and financial synchronization across the TRAC intermodal network. Ensure all validation steps are completed before committing to the general ledger.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="animate-in fade-in duration-500">
          <VendorInvoicesTab
            vendorSlug={VENDOR_SLUG}
            refreshKey={invoiceRefreshKey}
            onNewInvoice={() => setInvoiceDialogOpen(true)}
            onDataLoaded={handleInvoicesLoaded}
          />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="animate-in fade-in duration-500">
          <VendorEmptyState title="Operational Logs" />
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="animate-in fade-in duration-500">
          <VendorFinancialsTab invoices={invoices} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="animate-in fade-in duration-500">
          <VendorDocumentsTab />
        </div>
      )}

      <NewInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        vendorSlug={VENDOR_SLUG}
        onCreated={() => setInvoiceRefreshKey(k => k + 1)}
      />
    </div>
  )
}
