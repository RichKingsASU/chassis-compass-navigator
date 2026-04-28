import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { VendorEmptyState } from '@/components/vendor/VendorEmptyState'
import { VendorInvoicesTab, type VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'
import { useQuery } from '@tanstack/react-query'
import { 
  Building2, 
  Info, 
  ExternalLink, 
  ShieldAlert, 
  Activity, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Search
} from 'lucide-react'

const VENDOR_SLUG = 'ccm'

interface CcmActivity {
  id: number
  invoice: string | null
  invoice_category: string | null
  invoice_date: string | null
  due_date: string | null
  invoice_amount: number | null
  amount_paid: number | null
  amount_due: number | null
  invoice_status: string | null
  created_at: string
}

export default function CCMPage() {
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])

  const { data: dashboardRecords = [], isLoading: dashboardLoading, isError: dashboardError } = useQuery({
    queryKey: ['vendor_invoices', VENDOR_SLUG, invoiceRefreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select('*')
        .eq('vendor_slug', VENDOR_SLUG)
        .order('invoice_date', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data || []) as VendorInvoice[]
    }
  })

  const { data: activityRecords = [], isLoading: activityLoading, isError: activityError } = useQuery({
    queryKey: ['ccm_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ccm_activity')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(1000)
      if (error) throw error
      return (data || []) as CcmActivity[]
    }
  })

  const handleInvoicesLoaded = useCallback((rows: VendorInvoice[]) => {
    setInvoices(rows)
  }, [])

  const totalInvoices = dashboardRecords.length
  const totalBilled = dashboardRecords.reduce((sum, r) => sum + (Number(r.invoice_amount) || 0), 0)
  const openInvoices = dashboardRecords.filter(r => (r.invoice_status || '').toLowerCase() !== 'paid').length

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
        counts={{ invoices: invoices.length, activity: activityRecords.length }}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-xl bg-primary/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Artifacts</p>
                  <FileText size={14} className="text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {dashboardLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black">{totalInvoices.toLocaleString()}</p>}
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
                {dashboardLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-black text-emerald-600">{safeAmount(totalBilled)}</p>}
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
                {dashboardLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black text-amber-600">{openInvoices.toLocaleString()}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b py-4">
                <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tight uppercase">
                  <Info size={18} className="text-primary" /> Nexus Information
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
              {activityLoading ? (
                <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
              ) : activityRecords.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <Activity size={48} className="text-muted-foreground opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Zero Activity Detected</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 border-b">
                      <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <TableHead className="px-6 py-4">Artifact ID</TableHead>
                        <TableHead className="px-6 py-4">Classification</TableHead>
                        <TableHead className="px-6 py-4">Timeline</TableHead>
                        <TableHead className="px-6 py-4 text-right">Valuation</TableHead>
                        <TableHead className="px-6 py-4 text-right">Settled</TableHead>
                        <TableHead className="px-6 py-4 text-right">Balance</TableHead>
                        <TableHead className="px-6 py-4">Status</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {activityRecords.map(row => (
                        <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-b last:border-0 group">
                          <TableCell className="px-6 py-4 font-mono font-black text-xs text-primary">{row.invoice || 'N/A'}</TableCell>
                          <TableCell className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{row.invoice_category || '—'}</TableCell>
                          <TableCell className="px-6 py-4 text-xs font-bold">{safeDate(row.invoice_date)}</TableCell>
                          <TableCell className="px-6 py-4 text-right font-black text-sm">{safeAmount(row.invoice_amount)}</TableCell>
                          <TableCell className="px-6 py-4 text-right font-bold text-emerald-600">{safeAmount(row.amount_paid)}</TableCell>
                          <TableCell className="px-6 py-4 text-right font-bold text-amber-600">{safeAmount(row.amount_due)}</TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5">{row.invoice_status || 'UNKNOWN'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
