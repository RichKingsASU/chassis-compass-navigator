import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InvoiceLine {
  id: string
  invoice_id: string
  chassis_number: string
  container_number: string
  vendor: string
  days: number
  amount: number
  status: string
  dispute_reason: string
  dispute_status: string
  dispute_type: string
}

export default function InvoiceLineDispute() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()
  const [line, setLine] = useState<InvoiceLine | null>(null)
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
        const { data, error: fetchErr } = await supabase
          .from('invoice_lines')
          .select('*')
          .eq('id', lineId)
          .single()
        if (fetchErr) throw fetchErr
        setLine(data)
        if (data.dispute_reason) setDisputeReason(data.dispute_reason)
        if (data.dispute_type) setDisputeType(data.dispute_type)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load line item')
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
      const { error: rpcErr } = await supabase.rpc('open_dispute', {
        line_id: lineId,
        dispute_type: disputeType,
        dispute_reason: disputeReason,
        notes,
      })
      if (rpcErr) {
        // Fallback: direct update if RPC not available
        const { error: updateErr } = await supabase.from('invoice_lines').update({
          status: 'disputed',
          dispute_status: 'open',
          dispute_type: disputeType,
          dispute_reason: disputeReason,
          dispute_notes: notes,
          disputed_at: new Date().toISOString(),
        }).eq('id', lineId)
        if (updateErr) throw updateErr
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCloseDispute() {
    if (!lineId) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('close_dispute', { line_id: lineId })
      if (rpcErr) {
        // Fallback: direct update if RPC not available
        const { error: updateErr } = await supabase.from('invoice_lines').update({
          status: 'pending',
          dispute_status: 'closed',
          closed_at: new Date().toISOString(),
        }).eq('id', lineId)
        if (updateErr) throw updateErr
      }
      navigate(-1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to close dispute')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!line) return <div className="p-6"><p className="text-destructive">Line item not found.</p></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          &larr; Back
        </button>
        <h1 className="text-3xl font-bold">Dispute Invoice Line</h1>
        {line.dispute_status && (
          <Badge variant="destructive">{line.dispute_status}</Badge>
        )}
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {success ? (
        <Card>
          <CardContent className="pt-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium text-lg">Dispute submitted successfully.</p>
              <p className="text-green-700 text-sm mt-1">
                The dispute has been recorded and is now open for review.
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => navigate(-1)}>Back to Line Item</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Line Item Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Chassis #</p>
                  <p className="font-mono font-medium">{line.chassis_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Container #</p>
                  <p className="font-mono">{line.container_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendor</p>
                  <p>{line.vendor || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Days</p>
                  <p>{line.days ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold">
                    {line.amount != null ? `$${Number(line.amount).toFixed(2)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline">{line.status}</Badge>
                </div>
                {line.dispute_status && (
                  <div>
                    <p className="text-muted-foreground">Dispute Status</p>
                    <Badge variant="destructive">{line.dispute_status}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {line.dispute_status === 'open' ? 'Update Dispute' : 'Open Dispute'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="disputeType">Dispute Type</Label>
                  <Select value={disputeType} onValueChange={setDisputeType} required>
                    <SelectTrigger id="disputeType">
                      <SelectValue placeholder="Select dispute type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_error">Date Error</SelectItem>
                      <SelectItem value="rate_error">Rate Error</SelectItem>
                      <SelectItem value="days_mismatch">Days Mismatch</SelectItem>
                      <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                      <SelectItem value="chassis_not_used">Chassis Not Used</SelectItem>
                      <SelectItem value="amount_discrepancy">Amount Discrepancy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disputeReason">Reason</Label>
                  <Textarea
                    id="disputeReason"
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    placeholder="Describe the dispute reason in detail..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any supporting context or evidence..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={submitting || !disputeType || !disputeReason}
                  >
                    {submitting ? 'Submitting...' : 'Submit Dispute'}
                  </Button>
                  {line.dispute_status === 'open' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDispute}
                      disabled={submitting}
                    >
                      Close Dispute
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
