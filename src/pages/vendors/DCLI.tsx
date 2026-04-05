import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DcliRecord {
  id: string
  chassis: string
  reservation: string
  date_out: string
  date_in: string
  days_out: number
  pick_up_location: string
  pool_contract: string
  portal_status: string
  amount: number
  [key: string]: unknown
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'closed': return 'default'
    case 'open': return 'secondary'
    case 'not set': return 'outline'
    default: return 'outline'
  }
}

export default function DCLIPage() {
  const [records, setRecords] = useState<DcliRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
      } catch (err) {
        console.error('[DCLI] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalRecords = records.length
  const openCount = records.filter(r => r.portal_status === 'Open').length
  const closedCount = records.filter(r => r.portal_status === 'Closed').length
  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const paidAmount = records.filter(r => r.portal_status === 'Closed').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const outstandingAmount = totalAmount - paidAmount

  const filteredRecords = statusFilter === 'all' ? records : records.filter(r => r.portal_status?.toLowerCase() === statusFilter)

  // Group by portal_status for breakdown
  const statusGroups = records.reduce<Record<string, { count: number; total: number }>>((acc, r) => {
    const s = r.portal_status || 'Not Set'
    if (!acc[s]) acc[s] = { count: 0, total: 0 }
    acc[s].count++
    acc[s].total += Number(r.amount) || 0
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DCLI</h1>
          <p className="text-muted-foreground">Direct ChassisLink Inc. — Vendor Dashboard</p>
        </div>
        <Link to="/vendors/dcli/invoices/new">
          <Button>+ Upload Invoice</Button>
        </Link>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Tracker</TabsTrigger>
          <TabsTrigger value="financial">Financial Pulse</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{totalRecords}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-yellow-600">{openCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-green-600">{closedCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Company:</span> Direct ChassisLink Inc. (DCLI)</p>
                <p><span className="font-medium">Website:</span> <a href="https://www.dcli.com" className="text-primary underline" target="_blank" rel="noreferrer">www.dcli.com</a></p>
                <p><span className="font-medium">Billing Support:</span> billing@dcli.com</p>
                <p><span className="font-medium">Phone:</span> 1-800-227-3254</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Important Notices</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Invoice Submission Deadline</p>
                  <p className="text-sm text-yellow-700">All disputes must be filed within 30 days of invoice date.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Activity Records</h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="not set">Not Set</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
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
                    <TableHead>Pick Up Location</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : filteredRecords.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{(r.chassis || '').trim()}</TableCell>
                      <TableCell className="text-sm">{r.reservation || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_out)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_in)}</TableCell>
                      <TableCell className="text-sm">{r.days_out ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.pick_up_location || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(Number(r.amount))}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(r.portal_status)}>{r.portal_status || 'Not Set'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <h2 className="text-xl font-semibold">Financial Pulse</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Amount Paid</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-green-600">{formatCurrency(paidAmount)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-red-600">{formatCurrency(outstandingAmount)}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Breakdown by Status</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(statusGroups).map(([status, { count, total }]) => (
                    <TableRow key={status}>
                      <TableCell><Badge variant={getStatusVariant(status)}>{status}</Badge></TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>{formatCurrency(total)}</TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(statusGroups).length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
