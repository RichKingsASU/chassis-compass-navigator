import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import type { VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { DataGrid } from '@/components/ui/DataGrid'
import type { ColDef, CellValueChangedEvent, ICellRendererParams } from 'ag-grid-community'

const VENDOR_SLUG = 'dcli'

interface DcliRecord {
  id: string
  chassis: string
  reservation_number: string
  date_out: string
  date_in: string
  days_out: number
  pick_up_location: string
  location_in: string
  pool_contract: string
  container: string
  ss_scac: string
  request_status: string
  motor_carrier_name: string
  market: string
  region: string
  [key: string]: unknown
}

interface DashboardInvoice {
  id: string
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  account_code: string | null
  total_amount: number | null
  amount_paid: number | null
  amount_due: number | null
  portal_status: string | null
  created_at: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function currencyFormatter(params: { value: unknown }): string {
  const v = params.value
  if (v == null || v === '') return ''
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return ''
  return formatCurrency(n)
}

function invoiceStatusColorClass(status: string | null | undefined): string {
  if (!status) return 'text-gray-600'
  const s = status.toUpperCase()
  if (s === 'PAID') return 'text-green-700 font-medium'
  if (s.includes('DISPUTE')) return 'text-red-700 font-medium'
  if (s === 'PENDING' || s === 'SCHEDULED' || s.startsWith('NEED TO') || s.startsWith('EMAILED')) {
    return 'text-yellow-700 font-medium'
  }
  return 'text-gray-600'
}

export default function DCLIPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<DcliRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [search, setSearch] = useState('')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])

  // DCLI-specific dashboard aggregates (from dcli_invoice / dcli_invoice_line_item / dcli_activity)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [uniqueChassis, setUniqueChassis] = useState(0)
  const [statusCount, setStatusCount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [activityCount, setActivityCount] = useState(0)
  const [dashboardInvoices, setDashboardInvoices] = useState<DashboardInvoice[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_activity')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Load vendor_invoices for the Financials tab (shared schema across vendors)
  useEffect(() => {
    async function loadVendorInvoices() {
      const { data } = await supabase
        .from('vendor_invoices')
        .select('*')
        .eq('vendor_slug', VENDOR_SLUG)
        .order('invoice_date', { ascending: false })
      setInvoices((data || []) as VendorInvoice[])
    }
    loadVendorInvoices()
  }, [invoiceRefreshKey])

  // Load dcli_invoice / line_item / activity aggregates for dashboard KPIs and tab badges
  useEffect(() => {
    async function loadDcliDashboard() {
      setDashboardLoading(true)
      try {
        const [
          invoiceCountRes,
          chassisRes,
          statusRes,
          amountRes,
          activityCountRes,
          recentInvoicesRes,
        ] = await Promise.all([
          supabase.from('dcli_invoice').select('*', { count: 'exact', head: true }),
          supabase.from('dcli_invoice_line_item').select('chassis'),
          supabase.from('dcli_invoice').select('portal_status'),
          supabase.from('dcli_invoice').select('total_amount'),
          supabase.from('dcli_activity').select('*', { count: 'exact', head: true }),
          supabase
            .from('dcli_invoice')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500),
        ])

        setInvoiceCount(invoiceCountRes.count ?? 0)

        const chassisRows = (chassisRes.data || []) as Array<{ chassis: string | null }>
        setUniqueChassis(
          new Set(chassisRows.map(r => r.chassis?.trim()).filter((c): c is string => !!c)).size
        )

        const statusRows = (statusRes.data || []) as Array<{ portal_status: string | null }>
        setStatusCount(
          new Set(statusRows.map(r => r.portal_status).filter((s): s is string => !!s)).size
        )

        const amountRows = (amountRes.data || []) as Array<{ total_amount: number | null }>
        setTotalAmount(amountRows.reduce((sum, r) => sum + (r.total_amount ?? 0), 0))

        setActivityCount(activityCountRes.count ?? 0)

        const rawInvoices = (recentInvoicesRes.data || []) as DashboardInvoice[]
        const seen = new Set<string>()
        const deduped = rawInvoices.filter(inv => {
          const key = inv.invoice_number ?? inv.id
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setDashboardInvoices(deduped)
      } catch (err: unknown) {
        console.error('Failed to load DCLI dashboard data', err)
      } finally {
        setDashboardLoading(false)
      }
    }
    loadDcliDashboard()
  }, [invoiceRefreshKey])

  // Sync activeTab with URL hash
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (['dashboard', 'invoices', 'activity', 'financials', 'documents'].includes(hash)) {
        setActiveTab(hash as VendorTabKey)
      }
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const handleTabChange = (value: VendorTabKey) => {
    setActiveTab(value)
    if (value === 'dashboard') {
      history.replaceState(null, '', window.location.pathname)
    } else {
      history.replaceState(null, '', `${window.location.pathname}#${value}`)
    }
  }

  const filtered = search
    ? records.filter(r => {
        const q = search.toUpperCase().trim()
        return r.chassis?.trim().toUpperCase().includes(q) || r.reservation_number?.toUpperCase().includes(q)
      })
    : records

  const invoiceColumnDefs = useMemo<ColDef<DashboardInvoice>[]>(() => [
    { headerName: 'Invoice #', field: 'invoice_number', width: 160, cellClass: 'font-mono' },
    { headerName: 'Invoice Date', field: 'invoice_date', width: 140 },
    { headerName: 'Due Date', field: 'due_date', width: 140 },
    {
      headerName: 'Invoice Amount',
      field: 'total_amount',
      type: 'numericColumn',
      width: 150,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: 'Amount Paid',
      field: 'amount_paid',
      type: 'numericColumn',
      width: 140,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: 'Amount Due',
      field: 'amount_due',
      type: 'numericColumn',
      width: 140,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: 'Status',
      field: 'portal_status',
      width: 160,
      cellRenderer: (params: ICellRendererParams<DashboardInvoice, string | null>) => (
        <span className={invoiceStatusColorClass(params.value)}>{params.value || 'Not Set'}</span>
      ),
    },
  ], [])

  const activityColumnDefs = useMemo<ColDef<DcliRecord>[]>(() => [
    { headerName: 'Chassis', field: 'chassis', pinned: 'left', width: 140, cellClass: 'font-mono' },
    { headerName: 'Pick Up Location', field: 'pick_up_location', width: 200 },
    { headerName: 'Location In', field: 'location_in', width: 200 },
    { headerName: 'Date Out', field: 'date_out', width: 150 },
    { headerName: 'Date In', field: 'date_in', width: 150 },
    { headerName: 'Days Out', field: 'days_out', type: 'numericColumn', width: 90 },
    { headerName: 'Asset Type', field: 'asset_type', width: 130 },
    { headerName: 'Reservation', field: 'reservation_number', width: 140 },
    { headerName: 'Container', field: 'container', width: 140 },
    { headerName: 'SS SCAC', field: 'ss_scac', width: 90 },
    {
      headerName: 'Request Status',
      field: 'request_status',
      width: 150,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['', 'APPROVED', 'PENDING', 'REJECTED'] },
    },
    {
      headerName: 'Remarks',
      field: 'remarks',
      width: 260,
      editable: true,
      cellEditor: 'agLargeTextCellEditor',
    },
  ], [])

  const handleActivityCellChanged = async (event: CellValueChangedEvent<DcliRecord>) => {
    const field = event.colDef.field
    if (!field) return
    const rowId = event.data?.id
    if (!rowId) return
    const newValue = event.newValue
    const { error: updateErr } = await supabase
      .from('dcli_activity')
      .update({ [field]: newValue })
      .eq('id', rowId)
    if (updateErr) {
      toast.error(`Failed to save ${field}: ${updateErr.message}`)
      if (event.node) event.node.setDataValue(field, event.oldValue)
    } else {
      toast.success('Saved')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DCLI</h1>
        <p className="text-muted-foreground">Direct ChassisLink Inc. — Vendor Dashboard</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewInvoice={() => navigate('/vendors/dcli/invoices/new')}
        counts={{ invoices: invoiceCount, activity: activityCount }}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle></CardHeader>
              <CardContent>{dashboardLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{invoiceCount}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
              <CardContent>{dashboardLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{uniqueChassis}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Statuses</CardTitle></CardHeader>
              <CardContent>{dashboardLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{statusCount}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Amount Due</CardTitle></CardHeader>
              <CardContent>{dashboardLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>}</CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Company:</span> Direct ChassisLink Inc. (DCLI)</p>
                <p><span className="font-medium">Website:</span> <a href="https://www.dcli.com" className="text-primary underline" target="_blank" rel="noreferrer">www.dcli.com</a></p>
                <p><span className="font-medium">Phone:</span> 1-800-227-3254</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Important Notices</CardTitle></CardHeader>
              <CardContent>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Dispute Deadline</p>
                  <p className="text-sm text-yellow-700">All disputes must be filed within 30 days of invoice date.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <p className="text-sm text-muted-foreground">{dashboardInvoices.length} records</p>
            </CardHeader>
            <CardContent>
              <DataGrid<DashboardInvoice>
                rowData={dashboardInvoices}
                columnDefs={invoiceColumnDefs}
                loading={dashboardLoading}
                gridProps={{
                  onRowClicked: (e) => {
                    if (e.data?.id) navigate(`/vendors/dcli/invoices/${e.data.id}/detail`)
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">DCLI Activity</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} records</p>
          </div>
          <input
            type="text"
            placeholder="Search chassis or reservation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          <DataGrid<DcliRecord>
            rowData={filtered}
            columnDefs={activityColumnDefs}
            loading={loading}
            onCellValueChanged={handleActivityCellChanged}
          />
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="space-y-4">
          <VendorFinancialsTab invoices={invoices} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
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
