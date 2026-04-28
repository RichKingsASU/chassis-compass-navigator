import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import type { VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { DataGrid } from '@/components/ui/DataGrid'
import type {
  ColDef,
  CellValueChangedEvent,
  ICellRendererParams,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community'
import { useDcliInvoices } from '@/features/dcli/hooks/useDcliInvoices'
import { DcliDocumentsTab } from '@/features/dcli/components/DcliDocumentsTab'
import { formatShortDate, formatUSD } from '@/features/dcli/format'
import type { DcliInvoiceInternal, DcliActivityRow } from '@/features/dcli/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Activity, 
  FileText, 
  Search,
  Box,
  Truck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const VENDOR_SLUG = 'dcli'

type InvoiceStatusFilter = 'all' | 'Open' | 'Closed' | 'Credit' | 'unset'
type PoolContractFilter = 'all' | 'GACP' | 'DCLI' | 'EVER' | 'blank'

function currencyFormatter(params: { value: unknown }): string {
  return formatUSD(params.value)
}

function dateFormatter(params: { value: unknown }): string {
  return formatShortDate(params.value)
}

function statusBadge(status: string | null | undefined) {
  if (!status) return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-30">NOT_SET</Badge>
  const s = status.trim()
  if (s === 'Open') return <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-black text-[10px] uppercase">OPEN_AUDIT</Badge>
  if (s === 'Closed') return <Badge className="bg-gray-100 text-gray-800 border-gray-200 font-black text-[10px] uppercase tracking-widest">CLOSED</Badge>
  if (s === 'Credit') return <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-black text-[10px] uppercase tracking-widest">CREDIT</Badge>
  return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{s}</Badge>
}

const VALID_TABS: VendorTabKey[] = ['dashboard', 'invoices', 'activity', 'financials', 'documents']

function isValidTab(value: string | null): value is VendorTabKey {
  return value !== null && (VALID_TABS as string[]).includes(value)
}

export default function DCLIPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = ((): VendorTabKey => {
    const queryTab = searchParams.get('tab')
    if (isValidTab(queryTab)) return queryTab
    return 'dashboard'
  })()
  const [activeTab, setActiveTab] = useState<VendorTabKey>(initialTab)
  const [search, setSearch] = useState('')
  const [poolContractFilter, setPoolContractFilter] = useState<PoolContractFilter>('all')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)

  // Fetch Activity Data
  const { data: activity = [], isLoading: activityLoading, error: activityErrorObj } = useQuery({
    queryKey: ['dcli_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_activity')
        .select('*')
        .order('date_out', { ascending: false })
        .limit(2000)
      if (error) throw error
      return (data ?? []) as DcliActivityRow[]
    }
  })

  // Fetch Vendor Invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['vendor_invoices', VENDOR_SLUG, invoiceRefreshKey],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendor_invoices')
        .select('*')
        .eq('vendor_slug', VENDOR_SLUG)
        .order('invoice_date', { ascending: false })
      return (data || []) as VendorInvoice[]
    }
  })

  // Fetch KPIs
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['dcli_kpis', invoiceRefreshKey],
    queryFn: async () => {
      const [amountRes, disputeRes, activityRes] = await Promise.all([
        supabase.from('dcli_invoice_internal').select('invoice_amount, invoice_balance, portal_status'),
        supabase.from('dcli_invoice_internal').select('dispute_status'),
        supabase.from('dcli_activity').select('*', { count: 'exact', head: true }),
      ])

      const amountRows = (amountRes.data || []) as Array<{
        invoice_amount: number | null
        invoice_balance: number | null
        portal_status: string | null
      }>
      const totalBilled = amountRows.reduce((s, r) => s + (r.invoice_amount ?? 0), 0)
      const openBalance = amountRows
        .filter((r) => r.portal_status === 'Open')
        .reduce((s, r) => s + (r.invoice_balance ?? 0), 0)

      const disputeRows = (disputeRes.data || []) as Array<{ dispute_status: string | null }>
      const disputedCount = disputeRows.filter((r) => r.dispute_status === 'Disputed').length
      const activityCount = activityRes.count ?? 0

      return { totalBilled, openBalance, disputedCount, activityCount }
    }
  })

  const { totalBilled = 0, openBalance = 0, disputedCount = 0, activityCount = 0 } = kpis || {}
  const { invoices: dashboardInvoices, loading: invoicesLoading } = useDcliInvoices(invoiceRefreshKey)

  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceStatusFilter>('all')
  const invoicesGridApiRef = useRef<GridApi<DcliInvoiceInternal> | null>(null)

  useEffect(() => {
    const queryTab = searchParams.get('tab')
    if (isValidTab(queryTab)) setActiveTab(queryTab)
  }, [searchParams])

  const handleTabChange = (value: VendorTabKey) => {
    setActiveTab(value)
    const next = new URLSearchParams(searchParams)
    if (value === 'dashboard') next.delete('tab')
    else next.set('tab', value)
    setSearchParams(next, { replace: true })
  }

  const filteredActivity = useMemo(() => {
    const q = search.toUpperCase().trim()
    return activity.filter((r) => {
      if (q) {
        const chassis = r.chassis?.trim().toUpperCase() ?? ''
        const reservation = r.reservation?.toUpperCase() ?? ''
        if (!chassis.includes(q) && !reservation.includes(q)) return false
      }
      if (poolContractFilter !== 'all') {
        const pc = (r.pool_contract ?? '').trim()
        if (poolContractFilter === 'blank') { if (pc) return false } 
        else if (pc !== poolContractFilter) return false
      }
      return true
    })
  }, [activity, search, poolContractFilter])

  const invoiceColumnDefs = useMemo<ColDef<DcliInvoiceInternal>[]>(
    () => [
      { headerName: 'Invoice #', field: 'invoice_number', width: 160, cellClass: 'font-mono font-black' },
      { headerName: 'Billing Date', field: 'billing_date', width: 140, valueFormatter: dateFormatter, valueGetter: (p) => p.data?.billing_date ?? p.data?.invoice_date ?? null },
      { headerName: 'Due Date', field: 'due_date', width: 140, valueFormatter: dateFormatter },
      { headerName: 'Amount', field: 'invoice_amount', type: 'numericColumn', width: 140, valueFormatter: currencyFormatter, cellClass: 'font-black' },
      { headerName: 'Balance', field: 'invoice_balance', type: 'numericColumn', width: 140, valueFormatter: currencyFormatter, cellClass: 'font-bold text-amber-600' },
      { headerName: 'Status', field: 'portal_status', width: 160, cellRenderer: (params: ICellRendererParams) => statusBadge(params.value) },
      {
        headerName: 'Action',
        colId: 'actions',
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<DcliInvoiceInternal>) => (
          <Button variant="ghost" size="sm" className="h-8 px-4 font-black text-[10px] uppercase tracking-widest hover:bg-primary/10" onClick={() => navigate(`/vendors/dcli/invoices/${encodeURIComponent(params.data?.invoice_number || '')}/detail`)}>
            Review
          </Button>
        )
      },
    ],
    [navigate]
  )

  const handleInvoicesGridReady = (e: GridReadyEvent<DcliInvoiceInternal>) => {
    invoicesGridApiRef.current = e.api
    if (invoiceSearch) e.api.setGridOption('quickFilterText', invoiceSearch)
  }

  const handleActivityCellChanged = async (event: CellValueChangedEvent<DcliActivityRow>) => {
    const field = event.colDef.field
    if (!field || !event.data?.id) return
    const { error: updateErr } = await supabase.from('dcli_activity').update({ [field]: event.newValue }).eq('id', event.data.id)
    if (updateErr) {
      toast.error(`Failed to save: ${updateErr.message}`)
      event.node?.setDataValue(field, event.oldValue)
    } else {
      toast.success('Synchronization successful')
      queryClient.invalidateQueries({ queryKey: ['dcli_activity'] })
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary rounded-3xl text-primary-foreground shadow-2xl shadow-primary/20">
            <Truck size={32} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">DCLI HUB</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Direct ChassisLink Management Node</p>
          </div>
        </div>
      </div>

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewInvoice={() => navigate('/vendors/dcli/invoices/new')}
        counts={{ invoices: dashboardInvoices.length, activity: activityCount }}
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
                {invoicesLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black">{dashboardInvoices.length.toLocaleString()}</p>}
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
                {kpiLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-black text-emerald-600">{formatUSD(totalBilled)}</p>}
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl bg-amber-500/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Pending Liability</p>
                  <TrendingUp size={14} className="text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                {kpiLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-black text-amber-600">{formatUSD(openBalance)}</p>}
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl bg-destructive/[0.02]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-destructive uppercase tracking-widest">Dispute Count</p>
                  <ShieldCheck size={14} className="text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                {kpiLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black text-destructive">{disputedCount.toLocaleString()}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b py-4">
                <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tight uppercase"><Box size={18} className="text-primary" /> Logistics Context</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Primary Carrier SCAC</p>
                  <p className="text-xl font-black font-mono">DCLI</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Support Protocol</p>
                  <p className="text-xl font-bold">1-800-227-3254</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl bg-amber-500/[0.03]">
              <CardHeader className="bg-amber-500/10 border-b py-4">
                <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tight uppercase text-amber-700"><AlertCircle size={18} /> Audit Policy</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                  Dispute Reconciliation must occur within a 30-day chronological window from the billing timestamp.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-primary" />
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Invoice Stream</CardTitle>
                </div>
                <div className="relative w-full md:w-96">
                  <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input placeholder="Filter by ID, status, or type..." className="pl-10 h-11 border-2 font-bold rounded-xl" value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 border-b bg-muted/10 flex flex-wrap gap-2">
                {([
                  { key: 'all', label: 'All Artifacts' },
                  { key: 'Open', label: 'Open Audits' },
                  { key: 'Closed', label: 'Resolved' },
                  { key: 'Credit', label: 'Credits' },
                  { key: 'unset', label: 'Unclassified' }
                ] as const).map(pill => (
                  <Button key={pill.key} variant={invoiceStatusFilter === pill.key ? 'default' : 'outline'} size="sm" className="text-[10px] font-black uppercase tracking-widest h-8 px-6 rounded-full" onClick={() => setInvoiceStatusFilter(pill.key)}>
                    {pill.label}
                  </Button>
                ))}
              </div>
              <DataGrid<DcliInvoiceInternal> rowData={dashboardInvoices} columnDefs={invoiceColumnDefs} loading={invoicesLoading} gridProps={{ onGridReady: handleInvoicesGridReady, includeHiddenColumnsInQuickFilter: true }} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-primary" />
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Tactical Operations</CardTitle>
                </div>
                <div className="flex gap-4">
                  <div className="relative w-72">
                    <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input placeholder="Asset/Reservation..." className="pl-10 h-11 border-2 font-bold rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Select value={poolContractFilter} onValueChange={v => setPoolContractFilter(v as PoolContractFilter)}>
                    <SelectTrigger className="w-56 h-11 font-bold border-2 rounded-xl"><SelectValue placeholder="Contract" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold text-[10px] uppercase">All Pools</SelectItem>
                      <SelectItem value="GACP" className="font-bold text-[10px] uppercase tracking-widest">GACP</SelectItem>
                      <SelectItem value="DCLI" className="font-bold text-[10px] uppercase tracking-widest">DCLI</SelectItem>
                      <SelectItem value="EVER" className="font-bold text-[10px] uppercase tracking-widest">EVER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataGrid<DcliActivityRow> rowData={filteredActivity} columnDefs={activityColumnDefs} loading={activityLoading} onCellValueChanged={handleActivityCellChanged} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="animate-in fade-in duration-500">
          <VendorFinancialsTab invoices={invoices} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="animate-in fade-in duration-500">
          <DcliDocumentsTab />
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
