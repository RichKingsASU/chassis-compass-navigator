import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { InvoiceDrawer } from '@/features/dcli/components/InvoiceDrawer'
import { DcliDocumentsTab } from '@/features/dcli/components/DcliDocumentsTab'
import { formatShortDate, formatUSD } from '@/features/dcli/format'
import type { DcliInvoiceInternal, DcliActivityRow } from '@/features/dcli/types'

const VENDOR_SLUG = 'dcli'

type InvoiceStatusFilter = 'all' | 'Open' | 'Closed' | 'Credit' | 'unset'
type PoolContractFilter = 'all' | 'GACP' | 'DCLI' | 'EVER' | 'blank'

function currencyFormatter(params: { value: unknown }): string {
  return formatUSD(params.value)
}

function dateFormatter(params: { value: unknown }): string {
  return formatShortDate(params.value)
}

function invoiceStatusColorClass(status: string | null | undefined): string {
  if (!status) return 'text-gray-600'
  const s = status.trim()
  if (s === 'Open') return 'text-amber-600 font-medium'
  if (s === 'Closed') return 'text-gray-600 font-medium'
  if (s === 'Credit') return 'text-blue-700 font-medium'
  return 'text-gray-600'
}

export default function DCLIPage() {
  const navigate = useNavigate()
  const [activity, setActivity] = useState<DcliActivityRow[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [search, setSearch] = useState('')
  const [poolContractFilter, setPoolContractFilter] = useState<PoolContractFilter>('all')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])

  // Dashboard KPIs from dcli_invoice_internal
  const [totalBilled, setTotalBilled] = useState(0)
  const [openBalance, setOpenBalance] = useState(0)
  const [disputedCount, setDisputedCount] = useState(0)
  const [activityCount, setActivityCount] = useState(0)
  const [kpiLoading, setKpiLoading] = useState(true)

  const { invoices: dashboardInvoices, loading: invoicesLoading } = useDcliInvoices(invoiceRefreshKey)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerInvoice, setDrawerInvoice] = useState<DcliInvoiceInternal | null>(null)

  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceStatusFilter>('all')
  const invoicesGridApiRef = useRef<GridApi<DcliInvoiceInternal> | null>(null)

  // Load dcli_activity rows for the Activity tab
  useEffect(() => {
    let cancelled = false
    async function load() {
      setActivityLoading(true)
      setActivityError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_activity')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(2000)
        if (fetchErr) throw fetchErr
        if (!cancelled) setActivity((data ?? []) as DcliActivityRow[])
      } catch (err: unknown) {
        if (!cancelled) {
          setActivityError(err instanceof Error ? err.message : 'Failed to load activity')
        }
      } finally {
        if (!cancelled) setActivityLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
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

  // Load aggregate KPIs from dcli_invoice_internal + dcli_activity
  useEffect(() => {
    let cancelled = false
    async function loadKpis() {
      setKpiLoading(true)
      try {
        const [amountRes, disputeRes, activityRes] = await Promise.all([
          supabase
            .from('dcli_invoice_internal')
            .select('invoice_amount, invoice_balance, portal_status'),
          supabase.from('dcli_invoice_internal').select('dispute_status'),
          supabase.from('dcli_activity').select('*', { count: 'exact', head: true }),
        ])

        if (cancelled) return

        const amountRows = (amountRes.data || []) as Array<{
          invoice_amount: number | null
          invoice_balance: number | null
          portal_status: string | null
        }>
        setTotalBilled(amountRows.reduce((s, r) => s + (r.invoice_amount ?? 0), 0))
        setOpenBalance(
          amountRows
            .filter((r) => r.portal_status === 'Open')
            .reduce((s, r) => s + (r.invoice_balance ?? 0), 0)
        )

        const disputeRows = (disputeRes.data || []) as Array<{ dispute_status: string | null }>
        setDisputedCount(disputeRows.filter((r) => r.dispute_status === 'Disputed').length)

        setActivityCount(activityRes.count ?? 0)
      } catch (err: unknown) {
        console.error('Failed to load DCLI KPIs', err)
      } finally {
        if (!cancelled) setKpiLoading(false)
      }
    }
    loadKpis()
    return () => {
      cancelled = true
    }
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
        if (poolContractFilter === 'blank') {
          if (pc) return false
        } else if (pc !== poolContractFilter) return false
      }
      return true
    })
  }, [activity, search, poolContractFilter])

  const invoiceColumnDefs = useMemo<ColDef<DcliInvoiceInternal>[]>(
    () => [
      {
        headerName: 'Invoice #',
        field: 'invoice_number',
        width: 160,
        cellClass: 'font-mono',
        getQuickFilterText: (p) => p.value ?? '',
      },
      {
        headerName: 'Billing Date',
        field: 'billing_date',
        width: 140,
        valueFormatter: dateFormatter,
        valueGetter: (p) => p.data?.billing_date ?? p.data?.invoice_date ?? null,
        getQuickFilterText: () => '',
      },
      {
        headerName: 'Due Date',
        field: 'due_date',
        width: 140,
        valueFormatter: dateFormatter,
        getQuickFilterText: () => '',
      },
      {
        headerName: 'Invoice Type',
        field: 'invoice_type',
        width: 180,
        tooltipField: 'invoice_type',
        getQuickFilterText: (p) => p.value ?? '',
      },
      {
        headerName: 'Invoice Amount',
        field: 'invoice_amount',
        type: 'numericColumn',
        width: 150,
        valueFormatter: currencyFormatter,
        getQuickFilterText: () => '',
      },
      {
        headerName: 'Balance',
        field: 'invoice_balance',
        type: 'numericColumn',
        width: 140,
        valueFormatter: currencyFormatter,
        getQuickFilterText: () => '',
      },
      {
        headerName: 'Payments',
        field: 'total_payments',
        type: 'numericColumn',
        width: 140,
        valueFormatter: currencyFormatter,
        getQuickFilterText: () => '',
      },
      {
        headerName: 'Portal Status',
        field: 'portal_status',
        width: 160,
        cellRenderer: (params: ICellRendererParams<DcliInvoiceInternal, string | null>) => (
          <span className={invoiceStatusColorClass(params.value)}>
            {params.value || 'Not Set'}
          </span>
        ),
        getQuickFilterText: (p) => p.value ?? '',
      },
      {
        headerName: 'Dispute Status',
        field: 'dispute_status',
        width: 150,
        cellRenderer: (params: ICellRendererParams<DcliInvoiceInternal, string | null>) => {
          const v = params.value
          if (v !== 'Disputed') return null
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              Disputed
            </span>
          )
        },
        getQuickFilterText: (p) => p.value ?? '',
      },
      {
        headerName: 'Action',
        colId: 'actions',
        width: 100,
        sortable: false,
        filter: false,
        resizable: false,
        getQuickFilterText: () => '',
        cellRenderer: (params: ICellRendererParams<DcliInvoiceInternal>) => {
          const invoiceNumber = params.data?.invoice_number
          if (!invoiceNumber) return null
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/detail`)
              }}
              className="px-3 py-1 text-xs border rounded hover:bg-accent"
            >
              View
            </button>
          )
        },
      },
    ],
    [navigate]
  )

  useEffect(() => {
    invoicesGridApiRef.current?.setGridOption('quickFilterText', invoiceSearch)
  }, [invoiceSearch])

  useEffect(() => {
    const api = invoicesGridApiRef.current
    if (!api) return
    if (invoiceStatusFilter === 'all') {
      api.setFilterModel(null)
    } else if (invoiceStatusFilter === 'unset') {
      api.setFilterModel({
        portal_status: { filterType: 'text', type: 'blank' },
      })
    } else {
      api.setFilterModel({
        portal_status: { filterType: 'text', type: 'equals', filter: invoiceStatusFilter },
      })
    }
  }, [invoiceStatusFilter])

  const handleInvoicesGridReady = (e: GridReadyEvent<DcliInvoiceInternal>) => {
    invoicesGridApiRef.current = e.api
    if (invoiceSearch) e.api.setGridOption('quickFilterText', invoiceSearch)
    if (invoiceStatusFilter !== 'all') {
      if (invoiceStatusFilter === 'unset') {
        e.api.setFilterModel({ portal_status: { filterType: 'text', type: 'blank' } })
      } else {
        e.api.setFilterModel({
          portal_status: { filterType: 'text', type: 'equals', filter: invoiceStatusFilter },
        })
      }
    }
  }

  const invoiceStatusCounts = useMemo(
    () => ({
      all: dashboardInvoices.length,
      open: dashboardInvoices.filter((i) => i.portal_status === 'Open').length,
      closed: dashboardInvoices.filter((i) => i.portal_status === 'Closed').length,
      credit: dashboardInvoices.filter((i) => i.portal_status === 'Credit').length,
      unset: dashboardInvoices.filter((i) => !i.portal_status).length,
    }),
    [dashboardInvoices]
  )

  const activityColumnDefs = useMemo<ColDef<DcliActivityRow>[]>(
    () => [
      { headerName: 'Chassis', field: 'chassis', pinned: 'left', width: 140, cellClass: 'font-mono' },
      { headerName: 'Container', field: 'container', width: 140, cellClass: 'font-mono' },
      { headerName: 'Pool Contract', field: 'pool_contract', width: 140 },
      { headerName: 'Haulage Type', field: 'haulage_type', width: 130 },
      { headerName: 'Ocean Carrier SCAC', field: 'ss_scac', width: 150 },
      { headerName: 'Reservation', field: 'reservation', width: 140 },
      { headerName: 'Reservation Status', field: 'reservation_status', width: 160 },
      { headerName: 'Pick Up Location', field: 'pick_up_location', width: 200 },
      { headerName: 'Location In', field: 'location_in', width: 200 },
      { headerName: 'Date Out', field: 'date_out', width: 130, valueFormatter: dateFormatter },
      { headerName: 'Date In', field: 'date_in', width: 130, valueFormatter: dateFormatter },
      { headerName: 'Days Out', field: 'days_out', type: 'numericColumn', width: 100 },
      { headerName: 'Asset Type', field: 'asset_type', width: 130 },
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
    ],
    []
  )

  const handleActivityCellChanged = async (event: CellValueChangedEvent<DcliActivityRow>) => {
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

      {activityError && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          {activityError}
        </div>
      )}

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewInvoice={() => navigate('/vendors/dcli/invoices/new')}
        counts={{ invoices: dashboardInvoices.length, activity: activityCount }}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{dashboardInvoices.length.toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Billed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <Skeleton className="h-9 w-32" />
                ) : (
                  <p className="text-3xl font-bold">{formatUSD(totalBilled)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <Skeleton className="h-9 w-32" />
                ) : (
                  <p className="text-3xl font-bold">{formatUSD(openBalance)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Disputed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{disputedCount.toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <span className="font-medium">Company:</span> Direct ChassisLink Inc. (DCLI)
                </p>
                <p>
                  <span className="font-medium">Website:</span>{' '}
                  <a
                    href="https://www.dcli.com"
                    className="text-primary underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    www.dcli.com
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span> 1-800-227-3254
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Important Notices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Dispute Deadline</p>
                  <p className="text-sm text-yellow-700">
                    All disputes must be filed within 30 days of invoice date.
                  </p>
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
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'all', label: `All (${invoiceStatusCounts.all})` },
                    { key: 'Open', label: `Open (${invoiceStatusCounts.open})` },
                    { key: 'Closed', label: `Closed (${invoiceStatusCounts.closed})` },
                    { key: 'Credit', label: `Credit (${invoiceStatusCounts.credit})` },
                    { key: 'unset', label: `No Status (${invoiceStatusCounts.unset})` },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setInvoiceStatusFilter(pill.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      invoiceStatusFilter === pill.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search invoice #, type, status..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full max-w-sm px-3 py-2 border rounded-md text-sm"
              />
              <DataGrid<DcliInvoiceInternal>
                rowData={dashboardInvoices}
                columnDefs={invoiceColumnDefs}
                loading={invoicesLoading}
                onRowClicked={(e) => {
                  if (e.data?.invoice_number) {
                    setDrawerInvoice(e.data)
                    setDrawerOpen(true)
                  }
                }}
                rowStyle={{ cursor: 'pointer' }}
                gridProps={{
                  onGridReady: handleInvoicesGridReady,
                  includeHiddenColumnsInQuickFilter: true,
                }}
              />
            </CardContent>
          </Card>
          <InvoiceDrawer
            open={drawerOpen}
            invoice={drawerInvoice}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">DCLI Activity</h2>
            <p className="text-sm text-muted-foreground">{filteredActivity.length} records</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search chassis or reservation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[260px] px-3 py-2 border rounded-md text-sm"
            />
            <select
              value={poolContractFilter}
              onChange={(e) => setPoolContractFilter(e.target.value as PoolContractFilter)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
              aria-label="Filter by pool contract"
            >
              <option value="all">All pool contracts</option>
              <option value="GACP">GACP</option>
              <option value="DCLI">DCLI</option>
              <option value="EVER">EVER</option>
              <option value="blank">Blank</option>
            </select>
          </div>
          <DataGrid<DcliActivityRow>
            rowData={filteredActivity}
            columnDefs={activityColumnDefs}
            loading={activityLoading}
            onCellValueChanged={handleActivityCellChanged}
          />
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="space-y-4">
          <VendorFinancialsTab invoices={invoices} />
        </div>
      )}

      {activeTab === 'documents' && <DcliDocumentsTab />}

      <NewInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        vendorSlug={VENDOR_SLUG}
        onCreated={() => setInvoiceRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
