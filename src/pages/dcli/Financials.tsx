import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type DcliInvoice, INVOICE_STATUSES, statusBadgeClass } from '@/types/invoice'

export default function DCLIFinancials() {
  const [invoices, setInvoices] = useState<DcliInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice')
          .select('*')
          .order('created_at', { ascending: false })
        if (fetchErr) throw fetchErr
        setInvoices(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const paidAmount = invoices.filter(i => i.portal_status === 'PAID').reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const outstandingAmount = totalAmount - paidAmount

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DCLI Financials</h1>
        <p className="text-muted-foreground">Financial overview and invoice breakdown</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {loading ? (
        <p className="text-muted-foreground">Loading financial data...</p>
      ) : (
        <>
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
            <CardHeader><CardTitle>Invoice Breakdown by Portal Status</CardTitle></CardHeader>
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
                  {INVOICE_STATUSES.map(status => {
                    const statusInvoices = invoices.filter(i => i.portal_status === status)
                    if (statusInvoices.length === 0) return null
                    const statusTotal = statusInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
                    return (
                      <TableRow key={status}>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}>
                            {status}
                          </span>
                        </TableCell>
                        <TableCell>{statusInvoices.length}</TableCell>
                        <TableCell>{formatCurrency(statusTotal)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
