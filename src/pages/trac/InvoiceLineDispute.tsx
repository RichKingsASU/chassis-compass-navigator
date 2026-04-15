import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [line, setLine] = useState<LineItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [disputeType, setDisputeType] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      if (!lineId) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase.from('trac_invoice_data').select('*').eq('id', lineId).single()
        if (fetchErr) throw fetchErr
        setLine(data)
        setDisputeReason(data.dispute_reason || '')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load line')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lineId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lineId || !disputeType || !disputeReason) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: updateErr } = await supabase.from('trac_invoice_data').update({
        status: 'disputed',
        dispute_status: 'open',
        dispute_reason: disputeReason,
        dispute_type: disputeType,
        dispute_notes: notes,
        disputed_at: new Date().toISOString(),
      }).eq('id', lineId)
      if (updateErr) throw updateErr
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!line) return <div className="p-6"><p className="text-destructive">Line item not found.</p></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back</button>
        <h1 className="text-3xl font-bold">TRAC Dispute</h1>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {success ? (
        <Card>
          <CardContent className="pt-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">Dispute submitted successfully.</p>
            </div>
            <Button className="mt-4" onClick={() => navigate(-1)}>Back</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Line Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Chassis #:</span><span className="font-mono">{line.chassis_number}</span>
                <span className="text-muted-foreground">Amount:</span><span className="font-bold">{formatCurrency(line.amount)}</span>
                <span className="text-muted-foreground">Status:</span><span>{line.status}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Open Dispute</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Dispute Type</Label>
                  <Select value={disputeType} onValueChange={setDisputeType} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_error">Date Error</SelectItem>
                      <SelectItem value="rate_error">Rate Error</SelectItem>
                      <SelectItem value="days_mismatch">Days Mismatch</SelectItem>
                      <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                      <SelectItem value="chassis_not_used">Chassis Not Used</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the dispute..." rows={3} required />
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional context..." rows={2} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="destructive" disabled={submitting || !disputeType || !disputeReason}>
                    {submitting ? 'Submitting...' : 'Submit Dispute'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
