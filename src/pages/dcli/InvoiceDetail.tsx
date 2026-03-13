import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  status: string
  provider: string
  created_at: string
}

interface LineItem {
  id: string
  invoice_id: string
  chassis_number: string
  container_number: string
  pickup_date: string
  return_date: string
  days: number
  rate: number
  amount: number
  status: string
  dispute_reason: string
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

export default function DCLIInvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const [invRes, lineRes] = await Promise.all([
          supabase.from('dcli_invoice').select('*').eq('id', id).single(),
          supabase.from('dcli_invoice_data').select('*').eq('invoice_id', id),
        ])
        if (invRes.error) throw invRes.error
        setInvoice(invRes.data)
        setLineItems(lineRes.data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!invoice) return <div className="p-6"><p className="text-destructive">Invoice not found.</p></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vendors/dcli')} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back to DCLI</button>
        <h1 className="text-3xl font-bold">Invoice {invoice.invoice_number}</h1>
        <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Invoice Date</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{formatDate(invoice.invoice_date)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Due Date</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{formatDate(invoice.due_date)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Line Items</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{lineItems.length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis #</TableHead>
                <TableHead>Container #</TableHead>
                <TableHead>Pickup Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No line items found.</TableCell></TableRow>
              ) : lineItems.map(line => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">{line.chassis_number}</TableCell>
                  <TableCell className="font-mono text-sm">{line.container_number}</TableCell>
                  <TableCell>{formatDate(line.pickup_date)}</TableCell>
                  <TableCell>{formatDate(line.return_date)}</TableCell>
                  <TableCell>{line.days}</TableCell>
                  <TableCell>{formatCurrency(line.rate)}</TableCell>
                  <TableCell>{formatCurrency(line.amount)}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(line.status)}>{line.status || 'N/A'}</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    <Link to={`/dcli/line/${line.id}`}><Button variant="outline" size="sm">View</Button></Link>
                    <Link to={`/dcli/line/${line.id}/dispute`}><Button variant="destructive" size="sm">Dispute</Button></Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
