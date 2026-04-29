import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

interface LineItem {
  id: string
  invoice_id: string
  chassis_number: string
  amount: number
  status: string
  dispute_status: string
  dispute_reason: string
}

export default function TRACInvoiceLineDispute() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [disputeType, setDisputeType] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [notes, setNotes] = useState('')

  const { data: line, isLoading, error } = useQuery({
    queryKey: ['trac_invoice_data_line', lineId],
    queryFn: async () => {
      if (!lineId) return null
      const { data, error } = await supabase.from('trac_invoice_data').select('*').eq('id', lineId).single()
      if (error) throw error
      if (data.dispute_reason) setDisputeReason(data.dispute_reason)
      return data as LineItem
    },
    enabled: !!lineId
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!lineId || !disputeType || !disputeReason) throw new Error('Missing required fields')
      const { error } = await supabase.from('trac_invoice_data').update({
        status: 'disputed',
        dispute_status: 'open',
        dispute_reason: disputeReason,
        dispute_type: disputeType,
        dispute_notes: notes,
        disputed_at: new Date().toISOString(),
      }).eq('id', lineId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Dispute submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['trac_invoice_data_line', lineId] })
      navigate(-1)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Dispute submission failed')
    }
  })

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{error instanceof Error ? error.message : 'Synchronization error'}</p>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold tracking-tight">Escalation Protocol</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-destructive/5 border-b py-4 border-destructive/10">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <ShieldAlert size={18} /> Dispute Declaration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate() }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dispute Classification</Label>
                    <Select value={disputeType} onValueChange={setDisputeType} required>
                      <SelectTrigger className="h-12 font-bold border-2">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date_error" className="font-bold text-xs uppercase tracking-wider">Date Error</SelectItem>
                        <SelectItem value="rate_error" className="font-bold text-xs uppercase tracking-wider">Rate Error</SelectItem>
                        <SelectItem value="days_mismatch" className="font-bold text-xs uppercase tracking-wider">Days Mismatch</SelectItem>
                        <SelectItem value="duplicate_charge" className="font-bold text-xs uppercase tracking-wider">Duplicate Charge</SelectItem>
                        <SelectItem value="chassis_not_used" className="font-bold text-xs uppercase tracking-wider">Chassis Not Used</SelectItem>
                        <SelectItem value="other" className="font-bold text-xs uppercase tracking-wider">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Reason Statement</Label>
                  <Textarea 
                    value={disputeReason} 
                    onChange={e => setDisputeReason(e.target.value)} 
                    placeholder="Provide a clear, concise reason for the audit failure..." 
                    className="border-2 font-medium min-h-[120px]" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secondary Context / Evidence</Label>
                  <Textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Additional context for the TRAC portal submission..." 
                    className="border-2 font-medium min-h-[100px]" 
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button 
                    type="submit" 
                    variant="destructive" 
                    size="lg"
                    className="px-8 font-black shadow-xl shadow-destructive/20 h-12 gap-2"
                    disabled={submitMutation.isPending || !disputeType || !disputeReason}
                  >
                    {submitMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} strokeWidth={3} />}
                    Submit Formal Dispute
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    className="px-8 font-bold h-12"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info size={18} className="text-primary" /> Target Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : line && (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Asset Reference</p>
                    <p className="text-xl font-black font-mono">{line.chassis_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Line Valuation</p>
                    <p className="text-2xl font-black text-primary">{formatCurrency(line.amount)}</p>
                  </div>
                  <div className="pt-4 border-t border-muted-foreground/10 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Workflow Status</p>
                    <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider py-1 px-3">
                      {line.status}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="p-6 bg-amber-500/5 rounded-2xl border-2 border-amber-500/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">Audit Policy</span>
            </div>
            <p className="text-[11px] font-medium text-amber-800/80 leading-relaxed">
              Disputing a line item will trigger a manual review cycle and freeze the payment status for this record until TRAC reconciliation is complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
