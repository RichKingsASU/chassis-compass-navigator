import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, XCircle, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
  const queryClient = useQueryClient()

  const { data: invoice, isLoading: invLoading, error: invError } = useQuery({
    queryKey: ['trac_invoice', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('trac_invoice').select('*').eq('id', id).single()
      if (error) throw error
      return data as TracInvoice
    },
    enabled: !!id
  })

  const { data: lineItems = [], isLoading: lineLoading } = useQuery({
    queryKey: ['trac_invoice_data', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase.from('trac_invoice_data').select('*').eq('invoice_id', id)
      if (error) throw error
      return data as LineItem[]
    },
    enabled: !!id
  })

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      const { error } = await supabase.from('trac_invoice').update({ status: 'approved' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('TRAC Invoice approved successfully')
      queryClient.invalidateQueries({ queryKey: ['trac_invoice', id] })
      navigate('/vendors/trac')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Approval failed')
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      const { error } = await supabase.from('trac_invoice').update({ status: 'rejected' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('TRAC Invoice rejected')
      queryClient.invalidateQueries({ queryKey: ['trac_invoice', id] })
      navigate('/vendors/trac')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Rejection failed')
    }
  })

  const isLoading = invLoading || lineLoading

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendors/trac')}
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={14} /> Back to TRAC
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Audit Console</h1>
        </div>
        {!isLoading && invoice && (
          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={3} />}
              Approve Payload
            </Button>
            <Button 
              size="lg" 
              variant="destructive" 
              className="gap-2 font-bold shadow-lg shadow-destructive/20"
              onClick={() => rejectMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} strokeWidth={3} />}
              Reject
            </Button>
          </div>
        )}
      </div>

      {(invError) && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{invError instanceof Error ? invError.message : 'Synchronization error'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Data Manifest
                </CardTitle>
                <Badge variant="outline" className="bg-background font-black text-[10px] uppercase tracking-tighter">
                  {lineItems.length} RECORDS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50 border-b">
                  <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <TableHead className="px-6 py-4">Chassis</TableHead>
                    <TableHead className="px-6 py-4">Container</TableHead>
                    <TableHead className="px-6 py-4">Valuation</TableHead>
                    <TableHead className="px-6 py-4 text-right">Operational Status</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4} className="px-6 py-4"><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic">No line items detected.</TableCell>
                    </TableRow>
                  ) : (
                    lineItems.slice(0, 50).map(line => (
                      <TableRow key={line.id} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                        <TableCell className="px-6 py-4 font-mono font-black text-xs">{line.chassis_number}</TableCell>
                        <TableCell className="px-6 py-4 font-mono text-[11px] text-muted-foreground">{line.container_number}</TableCell>
                        <TableCell className="px-6 py-4 font-bold">{formatCurrency(line.amount)}</TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                            {line.status || 'STAGED'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {lineItems.length > 50 && (
                <div className="p-4 bg-muted/20 text-center border-t">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Showing first 50 of {lineItems.length} entries. Use detail view for full audit.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-lg">Header Context</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : invoice && (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TRAC Ref #</p>
                    <p className="text-xl font-black font-mono">{invoice.invoice_number || 'PENDING'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valuation</p>
                    <p className="text-2xl font-black text-primary">{formatCurrency(invoice.total_amount)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted-foreground/10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Billing Date</p>
                      <p className="text-sm font-bold flex items-center gap-1"><Clock size={12} /> {formatDate(invoice.invoice_date)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lifecycle</p>
                      <Badge className="font-bold text-[10px] uppercase tracking-wider py-0.5 px-3">
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-muted-foreground/10 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ingestion Origin</p>
                    <p className="text-[11px] font-medium text-muted-foreground truncate">{invoice.source_file}</p>
                  </div>
                  <div className="pt-4 border-t border-muted-foreground/10 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">System Timestamp</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{formatDate(invoice.created_at)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
