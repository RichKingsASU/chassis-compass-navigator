import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type DcliInvoice, INVOICE_STATUSES, statusBadgeClass } from '@/types/invoice'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DollarSign, PieChart, TrendingUp, Wallet, AlertCircle } from 'lucide-react'

export default function DCLIFinancials() {
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['dcli_invoice'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_invoice')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as DcliInvoice[]
    }
  })

  const { totalAmount, paidAmount, outstandingAmount } = useMemo(() => {
    const total = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
    const paid = invoices.filter(i => i.portal_status === 'PAID').reduce((sum, i) => sum + (i.total_amount || 0), 0)
    return { totalAmount: total, paidAmount: paid, outstandingAmount: total - paid }
  }, [invoices])

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Oversight</h1>
          <p className="text-muted-foreground mt-1">Aggregated financial performance and accounts payable breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-4 font-bold uppercase tracking-widest text-[10px] bg-muted/50">
            DCLI Vendor Account
          </Badge>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{error instanceof Error ? error.message : 'Financial synchronization failed'}</p>
        </div>
      )}

      {/* Financial Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm bg-muted/30 overflow-hidden relative group">
          <div className="absolute right-[-10%] top-[-20%] opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={160} strokeWidth={3} />
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Liability</p>
              <DollarSign size={14} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-4xl font-black tracking-tighter">{formatCurrency(totalAmount)}</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-emerald-500/5 overflow-hidden relative group">
          <div className="absolute right-[-10%] top-[-20%] opacity-5 group-hover:opacity-10 transition-opacity text-emerald-600">
            <Wallet size={160} strokeWidth={3} />
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Settled Capital</p>
              <Wallet size={14} className="text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-4xl font-black tracking-tighter text-emerald-600">{formatCurrency(paidAmount)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-orange-500/5 overflow-hidden relative group">
          <div className="absolute right-[-10%] top-[-20%] opacity-5 group-hover:opacity-10 transition-opacity text-orange-600">
            <PieChart size={160} strokeWidth={3} />
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Outstanding Balance</p>
              <PieChart size={14} className="text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-4xl font-black tracking-tighter text-orange-600">{formatCurrency(outstandingAmount)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Distribution by Workflow Status</CardTitle>
            <Badge variant="outline" className="bg-background text-[10px] font-black uppercase tracking-tighter">
              REAL-TIME LEDGER
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <TableHead className="px-8 py-4">Workflow Node</TableHead>
                <TableHead className="px-8 py-4 text-center">Batch Count</TableHead>
                <TableHead className="px-8 py-4 text-right">Aggregated Valuation</TableHead>
                <TableHead className="px-8 py-4 text-right">Exposure %</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="px-8 py-4"><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                INVOICE_STATUSES.map(status => {
                  const statusInvoices = invoices.filter(i => i.portal_status === status)
                  if (statusInvoices.length === 0) return null
                  const statusTotal = statusInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
                  const percentage = totalAmount > 0 ? (statusTotal / totalAmount) * 100 : 0
                  
                  return (
                    <TableRow key={status} className="hover:bg-muted/30 transition-colors border-b last:border-0 group">
                      <TableCell className="px-8 py-6">
                        <Badge className={`${statusBadgeClass(status)} font-bold text-[10px] uppercase tracking-wider py-1 px-4`}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-center font-bold text-lg">
                        {statusInvoices.length}
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <p className="font-black text-lg tracking-tight">{formatCurrency(statusTotal)}</p>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-black text-muted-foreground">{percentage.toFixed(1)}%</span>
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
