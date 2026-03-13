import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface InvoiceLine {
  id: string
  chassis_number: string
  container_number: string
  provider: string
  invoice_number: string
  pickup_date: string
  return_date: string
  days: number
  rate: number
  amount: number
  status: string
  tms_match: boolean
  tms_ld_number: string
  tms_pickup_date: string
  tms_return_date: string
  tms_days: number
  variance_days: number
  variance_amount: number
  dispute_reason: string
  created_at: string
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
        const { data, error: fetchErr } = await supabase.from('invoice_lines').select('*').eq('id', lineId).single()
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
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back</button>
        <h1 className="text-3xl font-bold">Invoice Line Details</h1>
        <Badge variant="outline">{line.provider}</Badge>
        <Badge variant={line.status?.toLowerCase() === 'disputed' ? 'destructive' : 'outline'}>{line.status}</Badge>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Invoice Line Data</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Provider:</span><span className="font-medium">{line.provider}</span>
              <span className="text-muted-foreground">Invoice #:</span><span className="font-mono">{line.invoice_number}</span>
              <span className="text-muted-foreground">Chassis #:</span><span className="font-mono font-medium">{line.chassis_number}</span>
              <span className="text-muted-foreground">Container #:</span><span className="font-mono">{line.container_number || 'N/A'}</span>
              <span className="text-muted-foreground">Pickup:</span><span>{formatDate(line.pickup_date)}</span>
              <span className="text-muted-foreground">Return:</span><span>{formatDate(line.return_date)}</span>
              <span className="text-muted-foreground">Days:</span><span>{line.days}</span>
              <span className="text-muted-foreground">Rate:</span><span>{formatCurrency(line.rate)}/day</span>
              <span className="text-muted-foreground">Amount:</span><span className="font-bold text-lg">{formatCurrency(line.amount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>TMS Match Data</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className={`p-2 rounded text-sm ${line.tms_match ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {line.tms_match ? 'TMS Match Found' : 'No TMS Match'}
            </div>
            {line.tms_match && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">TMS LD #:</span><span className="font-mono">{line.tms_ld_number}</span>
                <span className="text-muted-foreground">TMS Pickup:</span><span>{formatDate(line.tms_pickup_date)}</span>
                <span className="text-muted-foreground">TMS Return:</span><span>{formatDate(line.tms_return_date)}</span>
                <span className="text-muted-foreground">TMS Days:</span><span>{line.tms_days}</span>
                <span className="text-muted-foreground">Day Variance:</span>
                <span className={line.variance_days !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{line.variance_days ?? 0} days</span>
                <span className="text-muted-foreground">Amt Variance:</span>
                <span className={line.variance_amount !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatCurrency(line.variance_amount ?? 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {line.dispute_reason && (
        <Card>
          <CardHeader><CardTitle>Dispute Information</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{line.dispute_reason}</p></CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link to={`/invoices/line/${line.id}/dispute`}><Button variant="destructive">Open Dispute</Button></Link>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  )
}
