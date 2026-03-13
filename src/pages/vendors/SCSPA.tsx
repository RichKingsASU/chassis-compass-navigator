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

interface ScspaInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  status: string
  created_at: string
}

interface ScspaActivity {
  id: string
  description: string
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'paid': return 'default'
    case 'pending': return 'secondary'
    case 'disputed': return 'destructive'
    case 'overdue': return 'destructive'
    default: return 'outline'
  }
}

export default function SCSPAPage() {
  const [invoices, setInvoices] = useState<ScspaInvoice[]>([])
  const [activities, setActivities] = useState<ScspaActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [invRes, actRes] = await Promise.all([
          supabase.from('scspa_invoice').select('*').order('created_at', { ascending: false }),
          supabase.from('scspa_activity').select('*').order('created_at', { ascending: false }).limit(20),
        ])
        if (invRes.error) throw invRes.error
        if (actRes.error) throw actRes.error
        setInvoices(invRes.data || [])
        setActivities(actRes.data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalInvoices = invoices.length
  const pendingInvoices = invoices.filter(i => i.status?.toLowerCase() === 'pending').length
  const disputedInvoices = invoices.filter(i => i.status?.toLowerCase() === 'disputed').length
  const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const paidAmount = invoices.filter(i => i.status?.toLowerCase() === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const outstandingAmount = totalAmount - paidAmount
  const filteredInvoices = statusFilter === 'all' ? invoices : invoices.filter(i => i.status?.toLowerCase() === statusFilter)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SCSPA</h1>
          <p className="text-muted-foreground">South Carolina State Ports Authority — Vendor Dashboard</p>
        </div>
        <Link to="/scspa/new-invoice">
          <Button>+ New Invoice</Button>
        </Link>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Tracker</TabsTrigger>
          <TabsTrigger value="financial">Financial Pulse</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{totalInvoices}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-yellow-600">{pendingInvoices}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Disputed</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-red-600">{disputedInvoices}</p></CardContent>
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
                <p><span className="font-medium">Company:</span> South Carolina State Ports Authority (SCSPA)</p>
                <p><span className="font-medium">Website:</span> <a href="https://www.scspa.com" className="text-primary underline" target="_blank" rel="noreferrer">www.scspa.com</a></p>
                <p><span className="font-medium">Billing Support:</span> billing@scspa.com</p>
                <p><span className="font-medium">Phone:</span> 1-843-577-8121</p>
                <p><span className="font-medium">Provider Code:</span> SCSPA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Important Notices</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Port Operations</p>
                  <p className="text-sm text-yellow-700">SCSPA handles chassis operations at Charleston port terminals.</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-800">Quick Resources</p>
                  <ul className="text-sm text-blue-700 list-disc list-inside mt-1 space-y-1">
                    <li><a href="#" className="underline">Port Tariff Schedule</a></li>
                    <li><a href="#" className="underline">Terminal Guidelines</a></li>
                    <li><a href="#" className="underline">Dispute Process</a></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">Loading...</p>
                : activities.length === 0 ? <p className="text-muted-foreground">No recent activity.</p>
                : (
                  <ul className="space-y-2">
                    {activities.slice(0, 5).map(a => (
                      <li key={a.id} className="flex justify-between text-sm border-b pb-2">
                        <span>{a.description}</span>
                        <span className="text-muted-foreground">{formatDate(a.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Invoices</h2>
            <div className="flex gap-3 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Link to="/scspa/new-invoice"><Button size="sm">+ New Invoice</Button></Link>
            </div>
          </div>
          {loading ? <p className="text-muted-foreground">Loading invoices...</p> : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0
                    ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No invoices found.</TableCell></TableRow>
                    : filteredInvoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number || inv.id}</TableCell>
                        <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                        <TableCell>{formatDate(inv.due_date)}</TableCell>
                        <TableCell>{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(inv.status)}>{inv.status || 'Unknown'}</Badge></TableCell>
                        <TableCell>
                          <Link to={`/scspa/invoice/${inv.id}`}><Button variant="outline" size="sm">View</Button></Link>
                        </TableCell>
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
            <CardHeader><CardTitle>Invoice Breakdown by Status</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead><TableHead>Count</TableHead><TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['paid', 'pending', 'disputed', 'overdue'].map(status => {
                    const si = invoices.filter(i => i.status?.toLowerCase() === status)
                    const st = si.reduce((sum, i) => sum + (i.total_amount || 0), 0)
                    return (
                      <TableRow key={status}>
                        <TableCell><Badge variant={getStatusVariant(status)}>{status}</Badge></TableCell>
                        <TableCell>{si.length}</TableCell>
                        <TableCell>{formatCurrency(st)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
