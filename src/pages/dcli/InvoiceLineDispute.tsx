import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type DcliLineItem, statusBadgeClass } from '@/types/invoice'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function DCLIInvoiceLineDispute() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState(false)

  const [disputeType, setDisputeType] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [notes, setNotes] = useState('')

  const { data: line, isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['dcli_invoice_line_item', lineId],
    queryFn: async () => {
      if (!lineId) return null
      const { data, error } = await supabase
        .from('dcli_invoice_line_item')
        .select('*')
        .eq('id', lineId)
        .single()
      if (error) throw error
      
      // Initialize form with existing data if available
      if (data.dispute_reason) setDisputeReason(data.dispute_reason)
      if (data.dispute_notes) setNotes(data.dispute_notes)
      
      return data as DcliLineItem
    },
    enabled: !!lineId
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!lineId || !line) return
      
      // Update line item
      const { error: updateErr } = await supabase
        .from('dcli_invoice_line_item')
        .update({
          portal_status: 'DISPUTE',
          dispute_reason: disputeReason,
          dispute_notes: notes,
        })
        .eq('id', lineId)
      if (updateErr) throw updateErr

      // Log event
      const { error: eventErr } = await supabase.from('dcli_invoice_events').insert({
        invoice_id: line.invoice_id,
        line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: line.portal_status,
        to_status: 'DISPUTE',
        note: `${disputeType}: ${disputeReason}`,
        metadata: { dispute_type: disputeType },
      })
      if (eventErr) throw eventErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcli_invoice_line_item', lineId] })
      setSuccess(true)
      toast.success('Dispute submitted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Submission failed: ${error.message}`)
    }
  })

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!lineId || !line) return
      
      const { error: updateErr } = await supabase
        .from('dcli_invoice_line_item')
        .update({
          portal_status: null,
          dispute_reason: null,
          dispute_notes: null,
        })
        .eq('id', lineId)
      if (updateErr) throw updateErr

      const { error: eventErr } = await supabase.from('dcli_invoice_events').insert({
        invoice_id: line.invoice_id,
        line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: 'DISPUTE',
        to_status: null,
        note: 'Dispute closed',
        metadata: {},
      })
      if (eventErr) throw eventErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcli_invoice_line_item', lineId] })
      toast.success('Dispute closed')
      navigate(-1)
    },
    onError: (error: Error) => {
      toast.error(`Failed to close dispute: ${error.message}`)
    }
  })

  const handleBack = () => navigate(-1)

  if (fetchError) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{fetchError instanceof Error ? fetchError.message : 'Failed to load line item'}</p>
        </div>
        <Button variant="outline" onClick={handleBack}>Go Back</Button>
      </div>
    )
  }

  if (!loading && !line) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-destructive font-medium">Line item not found.</p>
        <Button variant="outline" onClick={handleBack}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-muted-foreground">
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Dispute Resolution</h1>
      </div>

      {success ? (
        <Card className="border-green-200 bg-green-50/30 overflow-hidden">
          <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle2 className="text-green-600 h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900">Dispute Filed Successfully</h2>
              <p className="text-green-700 max-w-md mx-auto">
                The dispute for chassis <span className="font-mono font-bold">{line?.chassis}</span> has been registered in the audit trail and is now pending review.
              </p>
            </div>
            <Button size="lg" onClick={handleBack} className="bg-green-600 hover:bg-green-700">
              Return to Line Items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Line Item Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Chassis Number</span>
                      <span className="font-mono font-bold">{line?.chassis || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Associated Container</span>
                      <span className="font-mono">{line?.container || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Billing Duration</span>
                      <span className="font-medium">{line?.days_used || 0} Days</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Line Total</span>
                      <span className="font-bold text-primary">{formatCurrency(line?.line_total || 0)}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b pb-2">
                      <span className="text-muted-foreground">Date Range</span>
                      <div className="flex items-center gap-2 font-medium">
                        <span>{formatDate(line?.date_out)}</span>
                        <span className="text-muted-foreground text-xs">to</span>
                        <span>{formatDate(line?.date_in)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">System Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusBadgeClass(line?.portal_status)}`}>
                        {line?.portal_status || 'Unprocessed'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 items-start">
              <AlertCircle className="text-amber-600 h-5 w-5 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Audit Protocol</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Every dispute submission is logged with a timestamp and user ID. Disputes may delay payment processing for the specific line item.
                </p>
              </div>
            </div>
          </div>

          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle>{line?.dispute_reason ? 'Update Existing Dispute' : 'Open New Dispute Case'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-6">
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-24 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-16 w-full" /></div>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); submitMutation.mutate() }} 
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="disputeType" className="font-bold">Dispute Category</Label>
                      <Select value={disputeType} onValueChange={setDisputeType} required>
                        <SelectTrigger id="disputeType" className="h-12 border-2">
                          <SelectValue placeholder="Select high-level dispute type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_error">Intermodal Date Discrepancy</SelectItem>
                          <SelectItem value="rate_error">Contractual Rate Error</SelectItem>
                          <SelectItem value="days_mismatch">Calculated Days Inconsistency</SelectItem>
                          <SelectItem value="duplicate_charge">Duplicate Transaction ID</SelectItem>
                          <SelectItem value="chassis_not_used">Utilization Denial (Not Used)</SelectItem>
                          <SelectItem value="other">General Operational Dispute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disputeReason" className="font-bold">Technical Justification</Label>
                      <Textarea
                        id="disputeReason"
                        value={disputeReason}
                        onChange={e => setDisputeReason(e.target.value)}
                        placeholder="Provide the specific reason for this dispute..."
                        className="min-h-[120px] border-2 focus:ring-destructive"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-muted-foreground font-medium">Internal Auditor Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Internal context for team review..."
                        className="min-h-[80px] bg-muted/30 border-dashed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-6 border-t">
                    <Button 
                      type="submit" 
                      variant="destructive" 
                      size="lg"
                      disabled={submitMutation.isPending || !disputeType || !disputeReason}
                      className="px-10 font-bold"
                    >
                      {submitMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting...</>
                      ) : 'Submit Dispute Action'}
                    </Button>
                    
                    {line?.dispute_reason && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        onClick={() => closeMutation.mutate()} 
                        disabled={closeMutation.isPending}
                        className="px-8 border-2"
                      >
                        {closeMutation.isPending ? 'Closing...' : 'Close & Resolve Case'}
                      </Button>
                    )}
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="lg"
                      onClick={handleBack}
                      className="px-8"
                    >
                      Discard Changes
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
