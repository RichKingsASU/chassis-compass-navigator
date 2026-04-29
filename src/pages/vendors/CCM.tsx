import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { VendorInvoicesTab, type VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'
import { DataGrid } from '@/components/ui/DataGrid'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { useCcmActivity } from '@/features/ccm/hooks/useCcmActivity'
import { useVendorKpis } from '@/hooks/useVendorKpis'
import type { CcmActivityRow } from '@/features/ccm/types'
import { 
  Building2, 
  Info, 
  ExternalLink, 
  ShieldAlert, 
  Activity, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Search,
  Box
} from 'lucide-react'

const VENDOR_SLUG = 'ccm'
const ACTIVITY_TABLE = 'ccm_activity'

export default function CCMPage() {
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])

  const { data: kpis, isLoading: kpisLoading } = useVendorKpis(VENDOR_SLUG, ACTIVITY_TABLE, invoiceRefreshKey)
  const { data: activity = [], isLoading: activityLoading } = useCcmActivity()

  const handleInvoicesLoaded = useCallback((rows: VendorInvoice[]) => {
    setInvoices(rows)
  }, [])

  const activityColumnDefs = useMemo<ColDef<CcmActivityRow>[]>(() => [
    { 
      headerName: 'Artifact ID', 
      field: 'invoice', 
      pinned: 'left', 
      width: 160, 
      cellClass: 'font-mono font-black text-primary' 
    },
    { headerName: 'Classification', field: 'invoice_category', width: 160, cellClass: 'text-[10px] font-black uppercase tracking-tighter text-muted-foreground' },
    { headerName: 'Timeline', field: 'invoice_date', width: 140, valueFormatter: (p) => safeDate(p.value) },
    { headerName: 'Due Date', field: 'due_date', width: 140, valueFormatter: (p) => safeDate(p.value) },
    { 
      headerName: 'Valuation', 
      field: 'invoice_amount', 
      type: 'numericColumn', 
      width: 140, 
      valueFormatter: (p) => safeAmount(p.value),
      cellClass: 'font-black'
    },
    { 
      headerName: 'Settled', 
      field: 'amount_paid', 
      type: 'numericColumn', 
      width: 140, 
      valueFormatter: (p) => safeAmount(p.value),
      cellClass: 'font-bold text-emerald-600'
    },
    { 
      headerName: 'Balance', 
      field: 'amount_due', 
      type: 'numericColumn', 
      width: 140, 
      valueFormatter: (p) => safeAmount(p.value),
      cellClass: 'font-bold text-amber-600'
    },
    { 
      headerName: 'Status', 
      field: 'invoice_status', 
      width: 140,
      cellRenderer: (params: ICellRendererParams) => (
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
          {params.value || 'UNKNOWN'}
        </Badge>
      )
    },
  ], [])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-primary rounded-3xl text-primary-foreground shadow-2xl shadow-primary/20">
          <Building2 size={32} strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">CCM HUB</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Consolidated Chassis Intelligence</p>
        </div>
      </div>

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewInvoice={() => setInvoiceDialogOpen(true)}
        counts={{ invoices: invoices.length, activity: activity.length }}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="border-none shadow-xl bg-primary/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Artifacts</p>
                  <FileText size={14} className="text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black">{kpis?.totalInvoices.toLocaleString()}</p>}
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl bg-emerald-500/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Total Valuation</p>
                  <DollarSign size={14} className="text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-black text-emerald-600">{safeAmount(kpis?.totalBilled)}</p>}
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl bg-amber-500/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Open Audits</p>
                  <ShieldAlert size={14} className="text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black text-amber-600">{kpis?.openAudits.toLocaleString()}</p>}
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl bg-purple-500/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Activity Nodes</p>
                  <Activity size={14} className="text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                {kpisLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black text-purple-600">{kpis?.activityCount.toLocaleString()}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b py-4">
                <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tight uppercase">
                  <Box size={18} className="text-primary" /> Nexus Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Legal Entity</p>
                  <p className="text-xl font-black">Consolidated Chassis Management</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operational Portal</p>
                  <a href="https://www.ccmpool.com" className="text-xl font-black text-primary hover:underline flex items-center gap-2" target="_blank" rel="noreferrer">
                    ccmpool.com
                    <ExternalLink size={16} strokeWidth={3} />
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl bg-amber-500/[0.03]">
              <CardHeader className="bg-amber-500/10 border-b py-4">
                <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tight uppercase text-amber-700">
                  <ShieldAlert size={18} /> Dispute Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                  All billing disputes must be submitted within 45 days of the original invoice generation timestamp.
                </p>
              </CardContent>
            </Card>
          </div>
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
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-6">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-primary" />
                <CardTitle className="text-xl font-black uppercase tracking-tight">Operational Logs</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataGrid<CcmActivityRow> 
                rowData={activity} 
                columnDefs={activityColumnDefs} 
                loading={activityLoading} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'financials' && <div className="animate-in fade-in duration-500"><VendorFinancialsTab invoices={invoices} /></div>}
      {activeTab === 'documents' && <div className="animate-in fade-in duration-500"><VendorDocumentsTab /></div>}

      <NewInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        vendorSlug={VENDOR_SLUG}
        onCreated={() => setInvoiceRefreshKey(k => k + 1)}
      />
    </div>
  )
}
