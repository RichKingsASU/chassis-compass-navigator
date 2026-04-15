import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { NewInvoiceDialog } from '@/components/vendor/NewInvoiceDialog'
import { VendorTabNav, type VendorTabKey } from '@/components/vendor/VendorTabNav'
import { VendorInvoicesTab, type VendorInvoice } from '@/components/vendor/VendorInvoicesTab'
import { VendorFinancialsTab } from '@/components/vendor/VendorFinancialsTab'
import { VendorDocumentsTab } from '@/components/vendor/VendorDocumentsTab'
import { VendorEmptyState } from '@/components/vendor/VendorEmptyState'

const VENDOR_SLUG = 'scspa'

interface ScspaRecord {
  id: string
  chassis_number: string
  chassis: string
  pick_up_location: string
  location_in: string
  days_out: number
  date_out: string
  date_in: string
  pool_contract: string
  container: string
  ss_scac: string
  amount: number
  portal_status: string
  [key: string]: unknown
}

export default function SCSPAPage() {
  const [records, setRecords] = useState<ScspaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
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
          .from('scspa_activity')
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

  const handleInvoicesLoaded = useCallback((rows: VendorInvoice[]) => {
    setInvoices(rows)
  }, [])

  const totalRecords = records.length
  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const closedAmount = records.filter(r => r.portal_status?.toLowerCase() === 'closed').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const openAmount = totalAmount - closedAmount

  const filtered = search
    ? records.filter(r => {
        const q = search.toUpperCase().trim()
        const cn = (r.chassis_number || r.chassis || '')
        return cn.trim().toUpperCase().includes(q)
      })
    : records

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SCSPA</h1>
        <p className="text-muted-foreground">South Carolina State Ports Authority — Vendor Dashboard</p>
      </div>

      {error && records.length > 0 && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <VendorTabNav
        vendorSlug={VENDOR_SLUG}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewInvoice={() => setInvoiceDialogOpen(true)}
        counts={{ invoices: invoices.length, activity: totalRecords }}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{totalRecords}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{safeAmount(totalAmount)}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Amount Paid</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold text-green-600">{safeAmount(closedAmount)}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold text-red-600">{safeAmount(openAmount)}</p>}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-medium">Company:</span> South Carolina State Ports Authority (SCSPA)</p>
              <p><span className="font-medium">Website:</span> <a href="https://www.scspa.com" className="text-primary underline" target="_blank" rel="noreferrer">www.scspa.com</a></p>
              <p><span className="font-medium">Phone:</span> 1-843-577-8121</p>
            </CardContent>
          </Card>
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">SCSPA Activity</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} records</p>
          </div>
          <input type="text" placeholder="Search chassis number..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : records.length === 0 ? (
            <VendorEmptyState title="Activity" />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Pick Up Location</TableHead>
                    <TableHead>Location In</TableHead>
                    <TableHead>Days Out</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead>Pool/Contract</TableHead>
                    <TableHead>Container</TableHead>
                    <TableHead>SS/SCAC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{(r.chassis_number || r.chassis || '')?.trim()}</TableCell>
                      <TableCell className="text-sm">{r.pick_up_location || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.location_in || 'N/A'}</TableCell>
                      <TableCell>{r.days_out ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.date_out)}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.date_in)}</TableCell>
                      <TableCell className="text-sm">{r.pool_contract || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.container || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.ss_scac || 'N/A'}</TableCell>
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
