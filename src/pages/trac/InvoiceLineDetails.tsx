import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface LineItem {
  id: string
  invoice_id: string
  chassis_number: string
  container_number: string
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
}

export default function TRACInvoiceLineDetails() {
  const { lineId } = useParams<{ lineId: string }>()
  const navigate = useNavigate()
  const [line, setLine] = useState<LineItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!lineId) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase.from('trac_invoice_data').select('*').eq('id', lineId).single()
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
        <h1 className="text-3xl font-bold">TRAC Line Item</h1>
        <Badge variant="outline">{line.status}</Badge>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Invoice Line Data</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Chassis #:</span><span className="font-mono font-medium">{line.chassis_number}</span>
              <span className="text-muted-foreground">Container #:</span><span className="font-mono">{line.container_number}</span>
              <span className="text-muted-foreground">Pickup:</span><span>{formatDate(line.pickup_date)}</span>
              <span className="text-muted-foreground">Return:</span><span>{formatDate(line.return_date)}</span>
              <span className="text-muted-foreground">Days:</span><span>{line.days}</span>
              <span className="text-muted-foreground">Rate:</span><span>{formatCurrency(line.rate)}/day</span>
              <span className="text-muted-foreground">Amount:</span><span className="font-bold">{formatCurrency(line.amount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>TMS Match</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className={`p-2 rounded text-sm ${line.tms_match ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {line.tms_match ? 'TMS Match Found' : 'No TMS Match'}
            </div>
            {line.tms_match && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">LD #:</span><span className="font-mono">{line.tms_ld_number}</span>
                <span className="text-muted-foreground">Day Variance:</span>
                <span className={line.variance_days ? 'text-red-600 font-medium' : 'text-green-600'}>{line.variance_days ?? 0}</span>
                <span className="text-muted-foreground">Amount Variance:</span>
                <span className={line.variance_amount ? 'text-red-600 font-medium' : 'text-green-600'}>{formatCurrency(line.variance_amount ?? 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {line.dispute_reason && (
        <Card>
          <CardHeader><CardTitle>Dispute Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{line.dispute_reason}</p></CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link to={`/trac/line/${line.id}/dispute`}><Button variant="destructive">Open Dispute</Button></Link>
        <Link to={`/trac/invoice/${line.invoice_id}`}><Button variant="outline">View Invoice</Button></Link>
      </div>
    </div>
  )
}
