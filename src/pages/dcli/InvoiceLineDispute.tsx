import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type DcliLineItem, statusBadgeClass } from '@/types/invoice'

export default function DCLIInvoiceLineDispute() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()
  const [line, setLine] = useState<DcliLineItem | null>(null)
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
        const { data, error: fetchErr } = await supabase.from('dcli_invoice_line_item').select('*').eq('id', lineId).single()
        if (fetchErr) throw fetchErr
        setLine(data)
        setDisputeReason(data.dispute_reason || '')
        setNotes(data.dispute_notes || '')
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
    if (!lineId || !disputeType || !disputeReason || !line) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: updateErr } = await supabase.from('dcli_invoice_line_item').update({
        portal_status: 'DISPUTE',
        dispute_reason: disputeReason,
        dispute_notes: notes,
      }).eq('id', lineId)
      if (updateErr) throw updateErr

      // Log event
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: line.invoice_id,
        line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: line.portal_status,
        to_status: 'DISPUTE',
        note: `${disputeType}: ${disputeReason}`,
        metadata: { dispute_type: disputeType },
      })

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCloseDispute() {
    if (!lineId || !line) return
    setSubmitting(true)
    try {
      const { error: updateErr } = await supabase.from('dcli_invoice_line_item').update({
        portal_status: null,
        dispute_reason: null,
        dispute_notes: null,
      }).eq('id', lineId)
      if (updateErr) throw updateErr

      await supabase.from('dcli_invoice_events').insert({
        invoice_id: line.invoice_id,
        line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: 'DISPUTE',
        to_status: null,
        note: 'Dispute closed',
        metadata: {},
      })

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
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back</button>
        <h1 className="text-3xl font-bold">Dispute Line Item</h1>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {success ? (
        <Card>
          <CardContent className="pt-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">Dispute submitted successfully.</p>
              <p className="text-green-700 text-sm mt-1">The dispute has been recorded and is now open for review.</p>
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
                <div><p className="text-muted-foreground">Chassis</p><p className="font-mono font-medium">{line.chassis ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Container</p><p className="font-mono">{line.container ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Days Used</p><p>{line.days_used ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Line Total</p><p className="font-bold">{line.line_total != null ? formatCurrency(line.line_total) : '—'}</p></div>
                <div><p className="text-muted-foreground">Date Out</p><p>{line.date_out ? formatDate(line.date_out) : '—'}</p></div>
                <div><p className="text-muted-foreground">Date In</p><p>{line.date_in ? formatDate(line.date_in) : '—'}</p></div>
                <div>
                  <p className="text-muted-foreground">Portal Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(line.portal_status)}`}>
                    {line.portal_status || 'Not Set'}
                  </span>
                </div>
                {line.dispute_reason && (
                  <div><p className="text-muted-foreground">Current Dispute</p><Badge variant="destructive">Active</Badge></div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{line.dispute_reason ? 'Update Dispute' : 'Open Dispute'}</CardTitle></CardHeader>
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
                    placeholder="Describe the dispute reason..."
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
                    placeholder="Any additional context or notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" variant="destructive" disabled={submitting || !disputeType || !disputeReason}>
                    {submitting ? 'Submitting...' : 'Submit Dispute'}
                  </Button>
                  {line.dispute_reason && (
                    <Button type="button" variant="outline" onClick={handleCloseDispute} disabled={submitting}>
                      Close Dispute
                    </Button>
                  )}
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
