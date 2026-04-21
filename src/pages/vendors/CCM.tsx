import { useState, useEffect, useCallback } from 'react'
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

type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T[] }

export default function CCMPage() {
  const [dashboardState, setDashboardState] = useState<FetchState<VendorInvoice>>({ status: 'loading' })
  const [activityState, setActivityState] = useState<FetchState<CcmActivity>>({ status: 'loading' })
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])

  const loadDashboard = useCallback(async () => {
    setDashboardState({ status: 'loading' })
    const { data, error } = await supabase
      .from('vendor_invoices')
      .select('*')
      .eq('vendor_slug', VENDOR_SLUG)
      .order('invoice_date', { ascending: false })
      .limit(500)
    if (error) {
      setDashboardState({ status: 'error', message: error.message })
      return
    }
    setDashboardState({ status: 'ready', data: (data || []) as VendorInvoice[] })
  }, [])

  const loadActivity = useCallback(async () => {
    setActivityState({ status: 'loading' })
    const { data, error } = await supabase
      .from('ccm_activity')
      .select('*')
      .order('invoice_date', { ascending: false })
      .limit(1000)
    if (error) {
      setActivityState({ status: 'error', message: error.message })
      return
    }
    setActivityState({ status: 'ready', data: (data || []) as CcmActivity[] })
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard, invoiceRefreshKey])
  useEffect(() => { loadActivity() }, [loadActivity])

  const handleInvoicesLoaded = useCallback((rows: VendorInvoice[]) => {
    setInvoices(rows)
  }, [])

  const dashboardRecords = dashboardState.status === 'ready' ? dashboardState.data : []
  const activityRecords = activityState.status === 'ready' ? activityState.data : []

  const totalInvoices = dashboardRecords.length
  const totalBilled = dashboardRecords.reduce((sum, r) => sum + (Number(r.invoice_amount) || 0), 0)
  const openInvoices = dashboardRecords.filter(r => (r.invoice_status || '').toLowerCase() !== 'paid').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CCM</h1>
        <p className="text-muted-foreground">Consolidated Chassis Management — Vendor Dashboard</p>
      </div>

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewInvoice={() => setInvoiceDialogOpen(true)}
        counts={{ invoices: invoices.length, activity: activityRecords.length }}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashboardState.status === 'loading' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
                  <CardContent><Skeleton className="h-9 w-24" /></CardContent>
                </Card>
              ))}
            </div>
          )}

          {dashboardState.status === 'error' && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-lg font-medium">Unable to load CCM data</p>
                <p className="text-sm text-muted-foreground">{dashboardState.message}</p>
                <Button variant="outline" onClick={loadDashboard}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {dashboardState.status === 'ready' && dashboardRecords.length === 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-muted-foreground">—</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-muted-foreground">—</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Invoices</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-muted-foreground">—</p></CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-8 text-center space-y-3">
                  <p className="text-lg font-medium">No CCM invoices yet</p>
                  <p className="text-sm text-muted-foreground">Add the first invoice to start tracking CCM activity.</p>
                  <Button onClick={() => setInvoiceDialogOpen(true)}>+ New Invoice</Button>
                </CardContent>
              </Card>
            </>
          )}

          {dashboardState.status === 'ready' && dashboardRecords.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{totalInvoices}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{safeAmount(totalBilled)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Invoices</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{openInvoices}</p></CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Company:</span> Consolidated Chassis Management (CCM)</p>
                <p><span className="font-medium">Website:</span> <a href="https://www.ccmpool.com" className="text-primary underline" target="_blank" rel="noreferrer">www.ccmpool.com</a></p>
                <p><span className="font-medium">Phone:</span> 1-877-226-6224</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Important Notices</CardTitle></CardHeader>
              <CardContent>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Dispute Policy</p>
                  <p className="text-sm text-yellow-700">All billing disputes must be submitted within 45 days.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <VendorInvoicesTab
          vendorSlug={VENDOR_SLUG}
          refreshKey={invoiceRefreshKey}
          onNewInvoice={() => setInvoiceDialogOpen(true)}
          onDataLoaded={handleInvoicesLoaded}
        />
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">CCM Activity</h2>

          {activityState.status === 'loading' && (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          )}

          {activityState.status === 'error' && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-lg font-medium">Unable to load CCM activity</p>
                <p className="text-sm text-muted-foreground">{activityState.message}</p>
                <Button variant="outline" onClick={loadActivity}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {activityState.status === 'ready' && activityRecords.length === 0 && (
            <VendorEmptyState title="Activity" message="No CCM activity records yet." />
          )}

          {activityState.status === 'ready' && activityRecords.length > 0 && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityRecords.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.invoice || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{row.invoice_category || '—'}</TableCell>
                      <TableCell className="text-sm">{safeDate(row.invoice_date)}</TableCell>
                      <TableCell className="text-sm">{safeDate(row.due_date)}</TableCell>
                      <TableCell className="text-sm text-right">{safeAmount(row.invoice_amount)}</TableCell>
                      <TableCell className="text-sm text-right">{safeAmount(row.amount_paid)}</TableCell>
                      <TableCell className="text-sm text-right">{safeAmount(row.amount_due)}</TableCell>
                      <TableCell><Badge variant="outline">{row.invoice_status || 'Unknown'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

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
