import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ValidationLine {
  id: string
  chassis_number: string
  invoice_amount: number
  tms_amount: number
  variance: number
  status: string
  match_type: string
}

export default function TRACInvoiceValidate() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lines, setLines] = useState<ValidationLine[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState({ matched: 0, unmatched: 0, disputed: 0, totalVariance: 0 })

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase.from('trac_invoice_data').select('*').eq('invoice_id', id)
        if (fetchErr) throw fetchErr
        const items = data || []
        setLines(items)
        setSummary({
          matched: items.filter((l: ValidationLine) => l.match_type === 'exact').length,
          unmatched: items.filter((l: ValidationLine) => !l.tms_amount).length,
          disputed: items.filter((l: ValidationLine) => l.status === 'disputed').length,
          totalVariance: items.reduce((sum: number, l: ValidationLine) => sum + Math.abs(l.variance || 0), 0),
        })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load validation data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function runValidation() {
    if (!id) return
    setRunning(true)
    try {
      const { error: rpcErr } = await supabase.rpc('validate_trac_invoice', { invoice_id: id })
      if (rpcErr) throw rpcErr
      window.location.reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setRunning(false)
    }
  }

  function getMatchBadge(matchType: string) {
    if (matchType === 'exact') return <Badge variant="default">Exact Match</Badge>
    if (matchType === 'partial') return <Badge variant="secondary">Partial</Badge>
    return <Badge variant="destructive">No Match</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back</button>
        <h1 className="text-3xl font-bold">TRAC Invoice Validation</h1>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Matched</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{summary.matched}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unmatched</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{summary.unmatched}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disputed</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{summary.disputed}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Variance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalVariance)}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={runValidation} disabled={running}>{running ? 'Running...' : 'Run Validation'}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Validation Results</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Invoice Amount</TableHead>
                  <TableHead>TMS Amount</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No data. Run validation first.</TableCell></TableRow>
                ) : lines.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono">{line.chassis_number}</TableCell>
                    <TableCell>{formatCurrency(line.invoice_amount)}</TableCell>
                    <TableCell>{formatCurrency(line.tms_amount)}</TableCell>
                    <TableCell className={Math.abs(line.variance || 0) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatCurrency(line.variance)}</TableCell>
                    <TableCell>{getMatchBadge(line.match_type)}</TableCell>
                    <TableCell><Badge variant="outline">{line.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
