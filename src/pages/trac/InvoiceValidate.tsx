import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Play, ShieldAlert, CheckCircle2, AlertCircle, Loader2, BarChart3, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface ValidationLine {
  id: string
  chassis_number: string
  invoice_amount: number
  tms_amount: number
  variance: number
  status: string
  match_type: string
}

export default function TRACInvoiceValidate() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: lines = [], isLoading, error } = useQuery({
    queryKey: ['trac_invoice_data', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase.from('trac_invoice_data').select('*').eq('invoice_id', id)
      if (error) throw error
      return data as ValidationLine[]
    },
    enabled: !!id
  })

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      const { error } = await supabase.rpc('validate_trac_invoice', { invoice_id: id })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('TRAC Validation sequence completed')
      queryClient.invalidateQueries({ queryKey: ['trac_invoice_data', id] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Validation sequence failed')
    }
  })

  const summary = useMemo(() => {
    return {
      matched: lines.filter(l => l.match_type === 'exact').length,
      unmatched: lines.filter(l => !l.tms_amount).length,
      disputed: lines.filter(l => l.status === 'disputed').length,
      totalVariance: lines.reduce((sum, l) => sum + Math.abs(l.variance || 0), 0),
    }
  }, [lines])

  const getMatchBadge = (matchType: string) => {
    if (matchType === 'exact') return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[9px] uppercase tracking-tighter">EXACT MATCH</Badge>
    if (matchType === 'partial') return <Badge variant="secondary" className="font-bold text-[9px] uppercase tracking-tighter">PARTIAL</Badge>
    return <Badge variant="destructive" className="font-black text-[9px] uppercase tracking-tighter">NO CORRELATION</Badge>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={14} /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Validation Engine</h1>
        </div>
        {!isLoading && (
          <Button 
            size="lg" 
            className="gap-2 font-black shadow-xl shadow-primary/20 h-12"
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
          >
            {validateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
            Execute Audit Logic
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{error instanceof Error ? error.message : 'Synchronization failure'}</p>
        </div>
      )}

      {/* Logic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="border-none shadow-sm bg-emerald-500/[0.03]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Matched</p>
              <CheckCircle2 size={14} className="text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-black text-emerald-600">{summary.matched}</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-destructive/[0.03]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-destructive uppercase tracking-widest">Unmatched</p>
              <AlertCircle size={14} className="text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-black text-destructive">{summary.unmatched}</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-500/[0.03]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Disputed</p>
              <ShieldAlert size={14} className="text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-black text-orange-600">{summary.disputed}</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Exposure</p>
              <TrendingDown size={14} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-black">{formatCurrency(summary.totalVariance)}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" /> Logic Verification Stream
            </CardTitle>
            <Badge variant="outline" className="bg-background text-[10px] font-black uppercase tracking-tighter">
              {lines.length} ARTIFACTS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b">
                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <TableHead className="px-6 py-4">Asset ID</TableHead>
                  <TableHead className="px-6 py-4">Invoice Valuation</TableHead>
                  <TableHead className="px-6 py-4">TMS Assessment</TableHead>
                  <TableHead className="px-6 py-4">Variance Drift</TableHead>
                  <TableHead className="px-6 py-4 text-center">Correlation Confidence</TableHead>
                  <TableHead className="px-6 py-4 text-right">Workflow</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-6 py-4"><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-24 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center gap-3">
                        <Play size={32} className="opacity-20" />
                        <p className="text-sm">No data processed. Execute the audit logic to begin.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map(line => (
                    <TableRow key={line.id} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                      <TableCell className="px-6 py-4 font-mono font-black text-xs">{line.chassis_number}</TableCell>
                      <TableCell className="px-6 py-4 text-sm font-bold">{formatCurrency(line.invoice_amount)}</TableCell>
                      <TableCell className="px-6 py-4 text-sm font-medium text-muted-foreground">{formatCurrency(line.tms_amount)}</TableCell>
                      <TableCell className={`px-6 py-4 text-sm font-black ${Math.abs(line.variance || 0) > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {formatCurrency(line.variance)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        {getMatchBadge(line.match_type)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                          {line.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
