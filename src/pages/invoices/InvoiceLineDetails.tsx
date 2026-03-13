import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface InvoiceLine {
  id: string
  invoice_id: string
  chassis_number: string
  container_number: string
  vendor: string
  pickup_date: string
  return_date: string
  days: number
  rate: number
  amount: number
  status: string
  tms_match: boolean
  tms_ld_number: string
  variance_days: number
  variance_amount: number
  dispute_reason: string
  dispute_status: string
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'matched': return 'default'
    case 'approved': return 'default'
    case 'disputed': return 'destructive'
    case 'unmatched': return 'destructive'
    case 'pending': return 'secondary'
    default: return 'outline'
  }
}

function fmt(val: unknown): string {
  if (val == null) return '—'
  return String(val)
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return '—'
  return new Date(val).toLocaleDateString()
}

function fmtCurrency(val: number | null | undefined): string {
  if (val == null) return '—'
  return `$${Number(val).toFixed(2)}`
}

export default function InvoiceLineDetails() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()
  const [line, setLine] = useState<InvoiceLine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load line item')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lineId])

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
        <h1 className="text-3xl font-bold">Invoice Line Details</h1>
        <Badge variant={getStatusVariant(line.status)}>{line.status || 'N/A'}</Badge>
        {line.dispute_status && (
          <Badge variant="destructive">Dispute: {line.dispute_status}</Badge>
        )}
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Line Item Data</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Chassis #:</span>
              <span className="font-mono font-medium">{fmt(line.chassis_number)}</span>
              <span className="text-muted-foreground">Container #:</span>
              <span className="font-mono">{fmt(line.container_number)}</span>
              <span className="text-muted-foreground">Vendor:</span>
              <span>{fmt(line.vendor)}</span>
              <span className="text-muted-foreground">Pickup Date:</span>
              <span>{fmtDate(line.pickup_date)}</span>
              <span className="text-muted-foreground">Return Date:</span>
              <span>{fmtDate(line.return_date)}</span>
              <span className="text-muted-foreground">Days:</span>
              <span>{fmt(line.days)}</span>
              <span className="text-muted-foreground">Rate:</span>
              <span>{fmtCurrency(line.rate)}/day</span>
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold">{fmtCurrency(line.amount)}</span>
              <span className="text-muted-foreground">Created:</span>
              <span>{fmtDate(line.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>TMS Match Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className={`p-3 rounded-md text-sm ${line.tms_match ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {line.tms_match ? 'TMS Match Found' : 'No TMS Match'}
            </div>
            {line.tms_match && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">TMS LD #:</span>
                <span className="font-mono">{fmt(line.tms_ld_number)}</span>
                <span className="text-muted-foreground">Day Variance:</span>
                <span className={line.variance_days !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {fmt(line.variance_days)}
                </span>
                <span className="text-muted-foreground">Amount Variance:</span>
                <span className={line.variance_amount !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {fmtCurrency(line.variance_amount)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {line.dispute_reason && (
        <Card>
          <CardHeader><CardTitle>Dispute Information</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{line.dispute_reason}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link to={`/invoices/line/${line.id}/dispute`}>
          <Button variant="destructive">
            {line.dispute_status === 'open' ? 'Update Dispute' : 'Open Dispute'}
          </Button>
        </Link>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  )
}
