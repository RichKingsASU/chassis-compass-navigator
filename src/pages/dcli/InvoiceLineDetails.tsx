import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { type DcliLineItem, INVOICE_STATUSES, statusBadgeClass } from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'

function ConfidenceBar({ score }: { score: number | null }) {
  if (score == null) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <XCircle size={14} /> Not yet matched — run matching from the Invoice Detail page
    </div>
  )
  const color  = score >= 75 ? 'bg-emerald-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  const label  = score >= 75 ? 'Matched'         : score >= 40 ? 'Fuzzy Match'   : 'No Match'
  const textCls = score >= 75 ? 'text-emerald-700 dark:text-emerald-400' : score >= 40 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
  const bgCls  = score >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
               : score >= 40 ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
               :               'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
  const Icon   = score >= 75 ? CheckCircle2 : AlertCircle
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${bgCls}`}>
      <Icon size={20} className={textCls} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`font-semibold text-sm ${textCls}`}>{label}</span>
          <span className={`font-bold text-lg ${textCls}`}>{score}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function DCLIInvoiceLineDetails() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate   = useNavigate()
  const [line,    setLine]    = useState<DcliLineItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [note,      setNote]      = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(async () => {
    if (!lineId) return
    setLoading(true)
    try {
      const { data, error: e } = await supabase.from('dcli_invoice_line_item').select('*').eq('id', lineId).single()
      if (e) throw e
      setLine(data)
      setNewStatus(data?.portal_status || '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally { setLoading(false) }
  }, [lineId])

  useEffect(() => { load() }, [load])

  async function handleStatusUpdate() {
    if (!lineId || !newStatus || !line) return
    setSaving(true)
    try {
      await supabase.from('dcli_invoice_line_item')
        .update({ portal_status: newStatus, internal_notes: note || line.internal_notes })
        .eq('id', lineId)
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: line.invoice_id, line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: line.portal_status, to_status: newStatus,
        note: note || null, metadata: {},
      })
      setLine({ ...line, portal_status: newStatus as DcliLineItem['portal_status'] })
      setNote('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!line)   return <div className="p-6 text-destructive">Line item not found.</div>

  const tms = line.tms_match as Record<string, unknown> | null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/vendors/dcli/invoices/${line.invoice_id}/detail`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to Invoice
        </button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold">{line.chassis ?? 'Line Item'}</h1>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(line.portal_status)}`}>
          {line.portal_status || 'No Status'}
        </span>
      </div>

      {error && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Line item data */}
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Line Data</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {([
                ['Chassis',      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{line.chassis ?? '—'}</code>],
                ['Container',    <code className="font-mono text-xs">{line.container ?? '—'}</code>],
                ['Date Out',     formatDate(line.date_out)],
                ['Date In',      formatDate(line.date_in)],
                ['Days Used',    line.days_used ?? '—'],
                ['Daily Rate',   line.daily_rate != null ? `${formatCurrency(line.daily_rate)}/day` : '—'],
                ['Line Total',   <span className="font-bold">{line.line_total != null ? formatCurrency(line.line_total) : '—'}</span>],
                ['Match Type',   line.match_type ?? '—'],
              ] as [string, React.ReactNode][]).map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* TMS/Activity match */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Activity Match</CardTitle>
              {line.match_confidence != null && (
                <span className="text-xs text-muted-foreground">vs dcli_activity</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfidenceBar score={line.match_confidence} />

            {tms ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Matched Activity Record</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {([
                    ['Chassis',         tms['chassis']],
                    ['Container',       tms['container']],
                    ['Reservation #',   tms['reservation_number']],
                    ['Date Out',        tms['date_out'] ? formatDate(String(tms['date_out'])) : '—'],
                    ['Date In',         tms['date_in']  ? formatDate(String(tms['date_in']))  : '—'],
                    ['Days Out',        tms['days_out']],
                    ['Market',          tms['market']],
                    ['Pick Up',         tms['pick_up_location']],
                    ['Return Location', tms['location_in']],
                    ['Carrier SCAC',    tms['motor_carrier_scac']],
                    ['Asset Type',      tms['asset_type']],
                    ['Pool Contract',   tms['pool_contract']],
                  ] as [string, unknown][]).map(([label, val]) => val ? (
                    <div key={label} className="contents">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-xs">{String(val)}</dd>
                    </div>
                  ) : null)}
                </dl>

                {/* Variance comparison */}
                {line.days_used != null && tms['days_out'] != null && (
                  <div className={`mt-3 p-2 rounded text-xs font-medium ${
                    line.days_used === Number(tms['days_out'])
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                  }`}>
                    Invoice days: {line.days_used} &middot; Activity days: {String(tms['days_out'])} &middot;{' '}
                    {line.days_used === Number(tms['days_out'])
                      ? '\u2713 Days match exactly'
                      : `\u26A0 Variance: ${line.days_used - Number(tms['days_out'])} day(s)`}
                  </div>
                )}
              </div>
            ) : line.match_confidence != null && line.match_confidence < 40 ? (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>No activity record found for chassis <code className="bg-muted px-1 rounded">{line.chassis}</code>.</p>
                <p>Possible causes: chassis not in activity data for this period, or chassis ID mismatch.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Status update */}
      <Card>
        <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue placeholder="Select portal status" /></SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(s)}`}>{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStatusUpdate} disabled={saving || !newStatus}>
              {saving ? 'Saving\u2026' : 'Update Status'}
            </Button>
          </div>
          <Textarea placeholder="Add a note (optional)\u2026" value={note} onChange={e => setNote(e.target.value)} rows={2} />
        </CardContent>
      </Card>

      {(line.dispute_reason || line.dispute_notes) && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader><CardTitle className="text-base text-red-700 dark:text-red-400">Dispute Information</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {line.dispute_reason && <p><strong>Reason:</strong> {line.dispute_reason}</p>}
            {line.dispute_notes  && <p><strong>Notes:</strong>  {line.dispute_notes}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
