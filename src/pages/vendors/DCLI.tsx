import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { safeDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import type { VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { statusBadgeClass } from '@/types/invoice'

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
  portal_status: string | null
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'closed': case 'completed': return 'default'
    case 'open': case 'active': return 'secondary'
    default: return 'outline'
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
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
            .select('id, invoice_number, invoice_date, due_date, account_code, total_amount, portal_status, created_at')
            .order('created_at', { ascending: false })
            .limit(50),
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
        }).slice(0, 10)
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
              <CardTitle>Recent Invoices</CardTitle>
              <p className="text-sm text-muted-foreground">Showing {dashboardInvoices.length} most recent</p>
            </CardHeader>
            <CardContent className="p-0">
              {dashboardLoading ? (
                <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : dashboardInvoices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No invoices found. Click + New Invoice to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Portal Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardInvoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {inv.invoice_number || inv.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">{safeDate(inv.invoice_date)}</TableCell>
                        <TableCell className="text-sm">{safeDate(inv.due_date)}</TableCell>
                        <TableCell className="text-sm">{inv.account_code || '—'}</TableCell>
                        <TableCell className="text-sm text-right">
                          {inv.total_amount != null ? formatCurrency(inv.total_amount) : '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(inv.portal_status)}`}>
                            {inv.portal_status || 'Not Set'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link to={`/vendors/dcli/invoices/${inv.id}/detail`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Link to="/vendors/dcli/invoices" className="text-sm text-primary hover:underline">
              View All Invoices →
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">DCLI Activity</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} records</p>
          </div>
          <input type="text" placeholder="Search chassis or reservation..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Reservation</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead>Days Out</TableHead>
                    <TableHead>Pick Up</TableHead>
                    <TableHead>Location In</TableHead>
                    <TableHead>Pool/Contract</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.chassis?.trim() || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.reservation_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.date_out)}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.date_in)}</TableCell>
                      <TableCell>{r.days_out ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.pick_up_location || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.location_in || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.pool_contract || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.motor_carrier_name || 'N/A'}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(r.request_status)}>{r.request_status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
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
