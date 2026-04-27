import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatShortDate, formatUSD } from '@/features/dcli/format'
import { LineItemDocumentsPanel } from '@/features/dcli/components/LineItemDocumentsPanel'
import type { DcliInternalLineItem } from '@/features/dcli/types'

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
    </div>
  )
}

export default function DCLIInvoiceLineDetail() {
  const params = useParams<{ invoiceId?: string; lineId?: string }>()
  const navigate = useNavigate()
  const invoiceNumber = decodeURIComponent(params.invoiceId ?? '')
  const lineId = decodeURIComponent(params.lineId ?? '')

  const [line, setLine] = useState<DcliInternalLineItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!lineId) return
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_internal_line_item')
          .select('*')
          .eq('id', lineId)
          .limit(1)
          .maybeSingle()
        if (fetchErr) throw fetchErr
        if (!cancelled) setLine((data ?? null) as DcliInternalLineItem | null)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load line item')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lineId])

  const tms = line?.tms_match as Record<string, unknown> | null | undefined

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() =>
            navigate(`/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/detail`)
          }
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Invoice
        </button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold font-mono">{line?.chassis ?? 'Line Item'}</h1>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-52" />
          </CardContent>
        </Card>
      ) : !line ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Line item not found in <code>dcli_internal_line_item</code>.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Chassis" value={line.chassis} mono />
                <Field label="Date Out" value={formatShortDate(line.date_out)} />
                <Field label="Date In" value={formatShortDate(line.date_in)} />
                <Field label="Bill Days" value={line.bill_days ?? '—'} />
                <Field label="Rate" value={formatUSD(line.rate) || '—'} />
                <Field label="Total" value={formatUSD(line.total) || '—'} />
                <Field label="Pool Contract" value={line.pool_contract} />
                <Field label="Pick Up Location" value={line.pick_up_location} />
                <Field label="Return Location" value={line.return_location} />
                <Field label="Ocean Carrier SCAC" value={line.ocean_carrier_scac} />
                <Field label="Haulage Type" value={line.haulage_type} />
                <Field label="Charge Description" value={line.charge_description} />
                <Field label="Container In" value={line.container_in} mono />
                <Field label="Tax Amount" value={formatUSD(line.tax_amount) || '—'} />
                <Field label="Total Fees" value={formatUSD(line.total_fees) || '—'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">TMS Match</CardTitle>
            </CardHeader>
            <CardContent>
              {!tms || (typeof tms === 'object' && Object.keys(tms).length === 0) ? (
                <p className="text-sm text-muted-foreground">
                  No TMS match — click <strong>Sync TMS Data</strong> on the invoice page to
                  populate this section.
                </p>
              ) : (
                <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">
                  {JSON.stringify(tms, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          <LineItemDocumentsPanel invoiceNumber={invoiceNumber} lineItemId={line.id} />
        </>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/vendors/dcli/invoices/${encodeURIComponent(invoiceNumber)}/detail`)
          }
        >
          Back to Invoice
        </Button>
      </div>
    </div>
  )
}
