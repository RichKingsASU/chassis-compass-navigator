import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type DcliLineItem,
  INVOICE_STATUSES,
  statusBadgeClass,
} from '@/types/invoice'

export default function DCLIInvoiceLineDetails() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()
  const [line, setLine] = useState<DcliLineItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Status update
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!lineId) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase.from('dcli_invoice_line_item').select('*').eq('id', lineId).single()
        if (fetchErr) throw fetchErr
        setLine(data)
        setNewStatus(data?.portal_status || '')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load line item')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lineId])

  async function handleStatusUpdate() {
    if (!lineId || !newStatus || !line) return
    setSaving(true)
    try {
      const { error: updateErr } = await supabase
        .from('dcli_invoice_line_item')
        .update({ portal_status: newStatus, internal_notes: note || line.internal_notes })
        .eq('id', lineId)
      if (updateErr) throw updateErr

      await supabase.from('dcli_invoice_events').insert({
        invoice_id: line.invoice_id,
        line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: line.portal_status,
        to_status: newStatus,
        note: note || null,
        metadata: {},
      })

      setLine({ ...line, portal_status: newStatus as DcliLineItem['portal_status'], internal_notes: note || line.internal_notes })
      setNote('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!line) return <div className="p-6"><p className="text-destructive">Line item not found.</p></div>

  const tms = line.tms_match as Record<string, unknown> | null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back</button>
        <h1 className="text-3xl font-bold">Line Item Details</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(line.portal_status)}`}>
          {line.portal_status || 'No Status'}
        </span>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Invoice Line Data</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Chassis:</span>
              <span className="font-mono font-medium">{line.chassis ?? '—'}</span>
              <span className="text-muted-foreground">Container:</span>
              <span className="font-mono">{line.container ?? '—'}</span>
              <span className="text-muted-foreground">Date Out:</span>
              <span>{line.date_out ? formatDate(line.date_out) : '—'}</span>
              <span className="text-muted-foreground">Date In:</span>
              <span>{line.date_in ? formatDate(line.date_in) : '—'}</span>
              <span className="text-muted-foreground">Days Used:</span>
              <span>{line.days_used ?? '—'}</span>
              <span className="text-muted-foreground">Daily Rate:</span>
              <span>{line.daily_rate != null ? `${formatCurrency(line.daily_rate)}/day` : '—'}</span>
              <span className="text-muted-foreground">Line Total:</span>
              <span className="font-bold">{line.line_total != null ? formatCurrency(line.line_total) : '—'}</span>
              <span className="text-muted-foreground">Match Type:</span>
              <span>{line.match_type ?? '—'}</span>
              <span className="text-muted-foreground">Match Confidence:</span>
              <span>{line.match_confidence != null ? `${(line.match_confidence * 100).toFixed(0)}%` : '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>TMS Match Data</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tms ? (
              <>
                <div className="p-2 rounded text-sm bg-green-50 text-green-800">TMS Match Found</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(tms).map(([key, val]) => (
                    <div key={key} className="contents">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{String(val ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-2 rounded text-sm bg-red-50 text-red-800">No TMS Match</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status update */}
      <Card>
        <CardHeader><CardTitle>Update Portal Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select portal status" />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStatusUpdate} disabled={saving || !newStatus}>
              {saving ? 'Saving...' : 'Update Status'}
            </Button>
          </div>
          <Textarea
            placeholder="Add a note (optional)..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {line.dispute_reason && (
        <Card>
          <CardHeader><CardTitle>Dispute Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm"><strong>Reason:</strong> {line.dispute_reason}</p>
            {line.dispute_notes && <p className="text-sm"><strong>Notes:</strong> {line.dispute_notes}</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link to={`/vendors/dcli/invoice-line/${line.id}/dispute`}>
          <Button variant="destructive">Open Dispute</Button>
        </Link>
        <Link to={`/vendors/dcli/invoices/${line.invoice_id}/detail`}>
          <Button variant="outline">View Invoice</Button>
        </Link>
      </div>
    </div>
  )
}
