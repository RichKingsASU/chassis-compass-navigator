import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface TracInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  total_amount: number
  status: string
  source_file: string
  created_at: string
}

interface LineItem {
  id: string
  chassis_number: string
  container_number: string
  amount: number
  status: string
}

export default function TRACInvoiceReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<TracInvoice | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const [invRes, lineRes] = await Promise.all([
          supabase.from('trac_invoice').select('*').eq('id', id).single(),
          supabase.from('trac_invoice_data').select('*').eq('invoice_id', id),
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

  async function approveInvoice() {
    if (!id) return
    try {
      const { error: updateErr } = await supabase.from('trac_invoice').update({ status: 'approved' }).eq('id', id)
      if (updateErr) throw updateErr
      navigate('/vendors/trac')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve invoice')
    }
  }

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!invoice) return <div className="p-6"><p className="text-destructive">Invoice not found.</p></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vendors/trac')} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back</button>
        <h1 className="text-3xl font-bold">Review TRAC Invoice</h1>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Invoice #</p><p className="font-medium">{invoice.invoice_number || 'N/A'}</p></div>
            <div><p className="text-muted-foreground">Invoice Date</p><p>{formatDate(invoice.invoice_date)}</p></div>
            <div><p className="text-muted-foreground">Total Amount</p><p className="font-bold">{formatCurrency(invoice.total_amount)}</p></div>
            <div><p className="text-muted-foreground">Status</p><Badge variant="outline">{invoice.status}</Badge></div>
            <div><p className="text-muted-foreground">Line Items</p><p>{lineItems.length}</p></div>
            <div><p className="text-muted-foreground">Created</p><p>{formatDate(invoice.created_at)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Line Items Preview</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis #</TableHead>
                <TableHead>Container #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No line items.</TableCell></TableRow>
              ) : lineItems.slice(0, 10).map(line => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono">{line.chassis_number}</TableCell>
                  <TableCell className="font-mono">{line.container_number}</TableCell>
                  <TableCell>{formatCurrency(line.amount)}</TableCell>
                  <TableCell><Badge variant="outline">{line.status || 'N/A'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {lineItems.length > 10 && <p className="text-sm text-muted-foreground text-center mt-2">Showing 10 of {lineItems.length} items</p>}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={approveInvoice}>Approve Invoice</Button>
        <Button variant="destructive">Reject</Button>
        <Button variant="outline" onClick={() => navigate('/vendors/trac')}>Cancel</Button>
      </div>
    </div>
  )
}
