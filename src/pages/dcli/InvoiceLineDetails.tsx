import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import {
  type DcliLineItem, type InvoiceEvent,
  INVOICE_STATUSES, statusBadgeClass, eventLabel, eventIcon,
} from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, XCircle, ArrowLeft, Clock } from 'lucide-react'

// ── Status groups for the control panel ───────────────────────────────────
const STATUS_GROUPS = [
  {
    label: 'Payment',
    statuses: ['OK TO PAY', 'SCHEDULED', 'PAID'],
  },
  {
    label: 'Dispute',
    statuses: ['NEED TO DISPUTE', 'DISPUTE', 'DISPUTE PENDING', 'DISPUTE APPROVED', 'DISPUTE REJECTED'],
  },
  {
    label: 'Follow Up',
    statuses: ['NEED TO EMAIL AM', 'EMAILED AM', 'NEED TO EMAIL CARRIER', 'EMAILED CARRIER', 'NEED TO EMAIL TERMINAL', 'EMAILED TERMINAL'],
  },
] as const

// ── Confidence display ─────────────────────────────────────────────────────
function MatchBanner({ score }: { score: number | null }) {
  if (score == null) return (
    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
      <Clock size={16} />
      Not yet matched — go to the Invoice Detail page and click "Run Activity Matching"
    </div>
  )
  const matched = score >= 75; const fuzzy = score >= 40
  const [bg, border, text, Icon] =
    matched ? ['bg-emerald-50 dark:bg-emerald-950/30', 'border-emerald-200 dark:border-emerald-800', 'text-emerald-700 dark:text-emerald-400', CheckCircle2]
    : fuzzy  ? ['bg-yellow-50 dark:bg-yellow-950/30',  'border-yellow-200 dark:border-yellow-800',  'text-yellow-700 dark:text-yellow-400',  AlertCircle]
    :          ['bg-red-50 dark:bg-red-950/30',         'border-red-200 dark:border-red-800',         'text-red-600 dark:text-red-400',         XCircle]
  const label = matched ? 'Matched' : fuzzy ? 'Fuzzy Match' : 'No Match'

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${bg} ${border}`}>
      <Icon size={20} className={text} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`font-semibold text-sm ${text}`}>{label}</span>
          <span className={`font-bold text-2xl ${text}`}>{score}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${matched ? 'bg-emerald-500' : fuzzy ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Field row helper ──────────────────────────────────────────────────────
function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (!value || value === '—' || value === 'null' || value === 'undefined') return null
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value as React.ReactNode}</dd>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function DCLIInvoiceLineDetails() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate   = useNavigate()

  const [line,        setLine]       = useState<DcliLineItem | null>(null)
  const [events,      setEvents]     = useState<InvoiceEvent[]>([])
  const [loading,     setLoading]    = useState(true)
  const [error,       setError]      = useState<string | null>(null)
  const [activeStatus,setActiveStatus] = useState<string>('')
  const [note,        setNote]       = useState('')
  const [saving,      setSaving]     = useState(false)
  const [saveMsg,     setSaveMsg]    = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!lineId) return
    setLoading(true)
    try {
      const [lineRes, evtRes] = await Promise.all([
        supabase.from('dcli_invoice_line_item').select('*').eq('id', lineId).single(),
        supabase.from('dcli_invoice_events').select('*').eq('line_item_id', lineId).order('created_at', { ascending: false }),
      ])
      if (lineRes.error) throw lineRes.error
      setLine(lineRes.data)
      setActiveStatus(lineRes.data?.portal_status ?? '')
      setEvents(evtRes.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally { setLoading(false) }
  }, [lineId])

  useEffect(() => { load() }, [load])

  async function saveStatus(status: string) {
    if (!lineId || !line) return
    setSaving(true); setSaveMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('dcli_invoice_line_item')
        .update({ portal_status: status, updated_at: new Date().toISOString() })
        .eq('id', lineId)
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: line.invoice_id,
        line_item_id: lineId,
        event_type: 'line_status_change',
        from_status: line.portal_status,
        to_status: status,
        note: note || null,
        created_by_email: user?.email ?? null,
        metadata: { chassis: line.chassis },
      })
      setLine(prev => prev ? { ...prev, portal_status: status as DcliLineItem['portal_status'] } : prev)
      setActiveStatus(status)
      setNote('')
      setSaveMsg(`Status updated to "${status}"`)
      const { data: evts } = await supabase.from('dcli_invoice_events').select('*').eq('line_item_id', lineId).order('created_at', { ascending: false })
      setEvents(evts || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  if (!line)   return <div className="p-6 text-destructive">Line item not found.</div>

  const tms     = line.tms_match as Record<string, unknown> | null
  const rowData = line.row_data  as Record<string, unknown> | null

  // Extract customer/move details from row_data (original XLSX fields)
  const customerName    = String(rowData?.['Customer Name']         ?? rowData?.['Corporate Name']         ?? '—')
  const onHireLoc       = String(rowData?.['On-Hire Location']      ?? '—')
  const offHireLoc      = String(rowData?.['Off-Hire Location']     ?? '—')
  const onHireArea      = String(rowData?.['On-Hire Area']          ?? '—')
  const oceanCarrier    = String(rowData?.['Ocean Carrier SCAC']    ?? '—')
  const onHireMC        = String(rowData?.['On-Hire MC SCAC']       ?? rowData?.['On-Hire MC SCAC']  ?? '—')
  const offHireMC       = String(rowData?.['Off-Hire MC SCAC']      ?? '—')
  const haulageType     = String(rowData?.['Haulage Type']          ?? '—')
  const chargeDesc      = String(rowData?.['Charge Description']    ?? '—')
  const onHireStatus    = String(rowData?.['On-Hire Status']        ?? '—')
  const offHireStatus   = String(rowData?.['Off-Hire Status']       ?? '—')
  const onHireBOL       = String(rowData?.['On-Hire BOL']           ?? '—')
  const outGateFees     = rowData?.['Out Gate Fees'] != null ? formatCurrency(Number(rowData['Out Gate Fees'])) : '—'
  const inGateFees      = rowData?.['In Gate Fees']  != null ? formatCurrency(Number(rowData['In Gate Fees']))  : '—'
  const taxAmount       = rowData?.['Tax Amount']    != null ? formatCurrency(Number(rowData['Tax Amount']))    : '—'
  const partnerCode     = String(rowData?.['On-Hire Partner Code']  ?? '—')
  const billingTerms    = String(rowData?.['Billing Terms']         ?? '—')
  const poolContract    = String(rowData?.['Pool Contract']         ?? line.row_data?.['Pool Contract'] ?? '—')

  // Days variance between invoice and activity match
  const actDays = tms?.['days_out'] != null ? Number(tms['days_out']) : null
  const daysDelta = (line.days_used != null && actDays != null) ? line.days_used - actDays : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate(`/vendors/dcli/invoices/${line.invoice_id}/detail`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} /> Back to Invoice
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold font-mono">{line.chassis ?? 'Line Item'}</h1>
          {activeStatus && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(activeStatus)}`}>
              {activeStatus}
            </span>
          )}
        </div>
      </div>

      {error    && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
      {saveMsg  && <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm"><CheckCircle2 size={14} />{saveMsg}</div>}

      {/* ── STATUS CONTROL PANEL ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status Control Panel</CardTitle>
          <p className="text-sm text-muted-foreground">Select a status then optionally add a note. Changes are saved and logged immediately.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {STATUS_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.statuses.map(s => {
                  const isActive = activeStatus === s
                  return (
                    <button
                      key={s}
                      onClick={() => { setActiveStatus(s); saveStatus(s) }}
                      disabled={saving}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${isActive
                          ? `${statusBadgeClass(s)} ring-2 ring-offset-1 ring-current scale-105`
                          : `${statusBadgeClass(s)} opacity-60 hover:opacity-100`
                        }`}
                    >
                      {isActive && <span className="mr-1">✓</span>}{s}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs">Note <span className="text-muted-foreground font-normal">(optional — logged with status change)</span></Label>
            <Textarea
              rows={2}
              placeholder="Add context about this status change…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── MOVE DETAILS + MATCH ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Move details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Move Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <Field label="Customer"         value={customerName} />
              <Field label="Chassis"          value={<code className="bg-muted px-1.5 py-0.5 rounded text-xs">{line.chassis}</code>} />
              <Field label="Container"        value={<code className="bg-muted px-1.5 py-0.5 rounded text-xs">{line.container}</code>} />
              <Field label="Date Out"         value={formatDate(line.date_out)} />
              <Field label="Date In"          value={formatDate(line.date_in)} />
              <Field label="Days Billed"      value={line.days_used} />
              <Field label="Daily Rate"       value={line.daily_rate != null ? `${formatCurrency(line.daily_rate)}/day` : null} />
              <Field label="Line Total"       value={<span className="font-bold">{line.line_total != null ? formatCurrency(line.line_total) : '—'}</span>} />
              <Field label="Out Gate Fees"    value={outGateFees} />
              <Field label="In Gate Fees"     value={inGateFees} />
              <Field label="Tax Amount"       value={taxAmount} />
              <Field label="Charge Type"      value={chargeDesc} />
              <Field label="On-Hire Status"   value={onHireStatus} />
              <Field label="Off-Hire Status"  value={offHireStatus} />
              <Field label="On-Hire Location" value={onHireLoc} />
              <Field label="Off-Hire Location"value={offHireLoc} />
              <Field label="Area"             value={onHireArea} />
              <Field label="Ocean Carrier"    value={oceanCarrier} />
              <Field label="On-Hire MC"       value={onHireMC} />
              <Field label="Off-Hire MC"      value={offHireMC} />
              <Field label="Haulage Type"     value={haulageType} />
              <Field label="BOL"              value={onHireBOL} mono />
              <Field label="Pool Contract"    value={poolContract} />
              <Field label="Partner Code"     value={partnerCode} />
              <Field label="Billing Terms"    value={billingTerms} />
            </dl>
          </CardContent>
        </Card>

        {/* Activity match */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Match</CardTitle>
            <p className="text-xs text-muted-foreground">Matched against dcli_activity</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <MatchBanner score={line.match_confidence} />

            {tms ? (
              <>
                {/* Field comparison table */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Comparison</p>
                  <div className="overflow-hidden rounded-lg border text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-2 font-medium text-muted-foreground">Field</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">Invoice</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">Activity</th>
                          <th className="text-center p-2 font-medium text-muted-foreground">Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[
                          {
                            field: 'Chassis',
                            inv: line.chassis ?? '—',
                            act: String(tms['chassis'] ?? '—'),
                            match: line.chassis?.replace(/\s/g,'').toUpperCase() === String(tms['chassis'] ?? '').replace(/\s/g,'').toUpperCase(),
                          },
                          {
                            field: 'Container',
                            inv: line.container ?? '—',
                            act: String(tms['container'] ?? '—'),
                            match: !!line.container && line.container === String(tms['container']),
                          },
                          {
                            field: 'Date Out',
                            inv: formatDate(line.date_out),
                            act: tms['date_out'] ? formatDate(String(tms['date_out'])) : '—',
                            match: !!line.date_out && !!tms['date_out'] &&
                              Math.abs(new Date(line.date_out).getTime() - new Date(String(tms['date_out'])).getTime()) < 86400000 * 2,
                          },
                          {
                            field: 'Date In',
                            inv: formatDate(line.date_in),
                            act: tms['date_in'] ? formatDate(String(tms['date_in'])) : '—',
                            match: !!line.date_in && !!tms['date_in'] &&
                              Math.abs(new Date(line.date_in).getTime() - new Date(String(tms['date_in'])).getTime()) < 86400000 * 2,
                          },
                          {
                            field: 'Days',
                            inv: String(line.days_used ?? '—'),
                            act: String(tms['days_out'] ?? '—'),
                            match: daysDelta !== null && Math.abs(daysDelta) <= 1,
                          },
                        ].map(row => (
                          <tr key={row.field}>
                            <td className="p-2 font-medium text-muted-foreground">{row.field}</td>
                            <td className="p-2 font-mono">{row.inv}</td>
                            <td className="p-2 font-mono">{row.act}</td>
                            <td className="p-2 text-center">
                              {row.match
                                ? <span className="text-emerald-600 font-bold">✓</span>
                                : <span className="text-red-500 font-bold">✗</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Days variance callout */}
                {daysDelta !== null && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${
                    daysDelta === 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                  }`}>
                    {daysDelta === 0
                      ? '✓ Billed days match activity exactly'
                      : `⚠ Billed ${line.days_used} days · Activity shows ${actDays} days · Variance: ${daysDelta > 0 ? '+' : ''}${daysDelta} day(s)`}
                  </div>
                )}

                {/* Activity record details */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Matched Activity Record</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <Field label="Reservation #"    value={String(tms['reservation_number'] ?? '—')} mono />
                    <Field label="Market"           value={String(tms['market'] ?? '—')} />
                    <Field label="Pick Up"          value={String(tms['pick_up_location'] ?? '—')} />
                    <Field label="Return Location"  value={String(tms['location_in'] ?? '—')} />
                    <Field label="Carrier SCAC"     value={String(tms['motor_carrier_scac'] ?? '—')} />
                    <Field label="Asset Type"       value={String(tms['asset_type'] ?? '—')} />
                    <Field label="Pool Contract"    value={String(tms['pool_contract'] ?? '—')} />
                  </dl>
                </div>
              </>
            ) : line.match_confidence != null && line.match_confidence < 40 ? (
              <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
                <p>No activity record found for chassis <code className="bg-muted px-1 rounded">{line.chassis}</code>.</p>
                <p className="text-xs">Possible causes: chassis not in activity data for this billing period, or chassis ID format mismatch.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* ── DISPUTE INFO ─────────────────────────────────────────────────── */}
      {(line.dispute_reason || line.dispute_notes) && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader><CardTitle className="text-base text-red-700 dark:text-red-400">Dispute Information</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {line.dispute_reason && <p><strong>Reason:</strong> {line.dispute_reason}</p>}
            {line.dispute_notes  && <p><strong>Notes:</strong>  {line.dispute_notes}</p>}
          </CardContent>
        </Card>
      )}

      {/* ── EVENT HISTORY ────────────────────────────────────────────────── */}
      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Line Item History</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {events.map(evt => (
                <li key={evt.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <span className="text-base leading-none pt-0.5">{eventIcon(evt.event_type)}</span>
                  <div className="flex-1">
                    <p className="font-medium">{eventLabel(evt)}</p>
                    {evt.note && <p className="text-muted-foreground mt-0.5 text-xs">{evt.note}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(evt.created_at).toLocaleString()}{evt.created_by_email && ` · ${evt.created_by_email}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
