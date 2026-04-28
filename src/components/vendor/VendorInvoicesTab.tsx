import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { 
  FileText, 
  ArrowUpDown, 
  Plus, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Tag, 
  ExternalLink,
  Search
} from 'lucide-react'
import { safeDate } from '@/lib/formatters'
import { formatCurrency } from '@/utils/dateUtils'

export interface VendorInvoice {
  id: number
  vendor_slug: string
  invoice_number: string
  invoice_date: string
  due_date: string
  invoice_amount: number
  invoice_category: string | null
  invoice_status: string | null
  notes: string | null
  created_at: string
}

export interface VendorInvoicesTabProps {
  vendorSlug: string
  refreshKey?: number
  onNewInvoice: () => void
  onDataLoaded?: (invoices: VendorInvoice[]) => void
}

const statusVariants: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  disputed: 'bg-destructive/10 text-destructive border-destructive/20',
  paid: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function VendorInvoicesTab({ vendorSlug, refreshKey = 0, onNewInvoice, onDataLoaded }: VendorInvoicesTabProps) {
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['vendor_invoices', vendorSlug, refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select('*')
        .eq('vendor_slug', vendorSlug.toLowerCase())
        .order('invoice_date', { ascending: false })
      if (error) throw error
      const rows = (data || []) as VendorInvoice[]
      onDataLoaded?.(rows)
      return rows
    },
  })

  if (error) {
    return (
      <div className="flex items-center gap-3 p-6 bg-destructive/10 text-destructive border-2 border-destructive/20 rounded-2xl">
        <AlertCircle size={20} />
        <p className="font-bold text-sm uppercase tracking-widest">Logic Failure: {error instanceof Error ? error.message : 'Database sync error'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="border-none shadow-xl bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="p-6 bg-background rounded-full shadow-inner opacity-20">
              <FileText size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black tracking-tight">Zero Artifacts Detected</p>
              <p className="text-sm text-muted-foreground max-w-[300px]">No invoice data has been synchronized for the {vendorSlug.toUpperCase()} node.</p>
            </div>
            <Button size="lg" className="gap-2 font-black shadow-xl shadow-primary/20" onClick={onNewInvoice}>
              <Plus size={18} strokeWidth={3} />
              Initialize Onboarding
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Invoice Ledger
              </CardTitle>
              <Badge variant="outline" className="bg-background text-[10px] font-black uppercase tracking-widest px-3 py-1">
                {invoices.length} RECORDS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 border-b">
                  <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <TableHead className="px-6 py-4">Reference ID</TableHead>
                    <TableHead className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} /> Timeline
                      </div>
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign size={12} /> Valuation
                      </div>
                    </TableHead>
                    <TableHead className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Tag size={12} /> Category
                      </div>
                    </TableHead>
                    <TableHead className="px-6 py-4">Workflow Status</TableHead>
                    <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors border-b last:border-0 group">
                      <TableCell className="px-6 py-4 font-mono font-black text-xs text-primary group-hover:underline cursor-pointer">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold">{safeDate(inv.invoice_date)}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Due: {safeDate(inv.due_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-black text-sm">
                        {formatCurrency(inv.invoice_amount)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">
                          {inv.invoice_category || 'UNCLASSIFIED'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge className={`font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 border shadow-sm ${statusVariants[(inv.invoice_status || 'pending').toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                          {inv.invoice_status || 'PENDING'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-all" title="Review Invoice">
                          <ExternalLink size={14} strokeWidth={3} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
