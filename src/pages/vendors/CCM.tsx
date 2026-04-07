import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { VendorEmptyState } from '@/components/vendor/VendorEmptyState'
import { VendorInvoicesTab, type VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'

const VENDOR_SLUG = 'ccm'

interface CcmActivity {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  billing_period: string
  bill_from_party: string
  current_usage: number
  invoice_total: number
  [key: string]: unknown
}

export default function CCMPage() {
  const [records, setRecords] = useState<CcmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<VendorTabKey>('dashboard')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0)
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('ccm_invoice_data')
          .select('*')
          .order('invoice_date', { ascending: false })
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

  const handleInvoicesLoaded = useCallback((rows: VendorInvoice[]) => {
    setInvoices(rows)
  }, [])

  const totalRecords = records.length
  const totalAmount = records.reduce((sum, i) => sum + (Number(i.invoice_total) || 0), 0)
  const totalUsage = records.reduce((sum, i) => sum + (Number(i.current_usage) || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CCM</h1>
        <p className="text-muted-foreground">Consolidated Chassis Management — Vendor Dashboard</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewInvoice={() => setInvoiceDialogOpen(true)}
        counts={{ invoices: invoices.length, activity: totalRecords }}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Activity Records</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{totalRecords}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{safeAmount(totalAmount)}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Current Usage</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{totalUsage.toLocaleString()}</p>}</CardContent>
            </Card>
          </div>

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
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : records.length === 0 ? (
            <VendorEmptyState title="Activity" />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Billing Period</TableHead>
                    <TableHead>Bill From</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Invoice Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{safeDate(inv.invoice_date)}</TableCell>
                      <TableCell className="text-sm">{safeDate(inv.due_date)}</TableCell>
                      <TableCell className="text-sm">{inv.billing_period || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{inv.bill_from_party || 'N/A'}</TableCell>
                      <TableCell>{inv.current_usage ?? 'N/A'}</TableCell>
                      <TableCell className="font-medium">{safeAmount(inv.invoice_total)}</TableCell>
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
