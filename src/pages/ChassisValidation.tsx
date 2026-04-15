import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ValidationResult {
  id: string
  chassis_number: string
  vendor: string
  invoice_number: string
  invoice_amount: number
  tms_amount: number
  variance: number
  status: string
  match_type: string
  created_at: string
}

export default function ChassisValidation() {
  const [results, setResults] = useState<ValidationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('validation_results')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200)
        if (fetchErr) throw fetchErr
        setResults(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load validation results')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function runFullValidation() {
    setRunning(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('run_full_chassis_validation')
      if (rpcErr) throw rpcErr
      window.location.reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setRunning(false)
    }
  }

  const matched = results.filter(r => r.match_type === 'exact').length
  const unmatched = results.filter(r => !r.tms_amount).length
  const disputed = results.filter(r => r.status === 'disputed').length
  const totalVariance = results.reduce((sum, r) => sum + Math.abs(r.variance || 0), 0)

  const vendors = [...new Set(results.map(r => r.vendor).filter(Boolean))]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chassis Validation</h1>
          <p className="text-muted-foreground">Invoice validation against TMS data across all vendors</p>
        </div>
        <Button onClick={runFullValidation} disabled={running}>
          {running ? 'Running...' : 'Run Full Validation'}
        </Button>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Matched</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{matched}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unmatched</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{unmatched}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disputed</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-yellow-600">{disputed}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Variance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(totalVariance)}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Results</TabsTrigger>
          {vendors.map(v => <TabsTrigger key={v} value={v}>{v}</TabsTrigger>)}
        </TabsList>

        {['all', ...vendors].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                {loading ? <p className="text-muted-foreground">Loading...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chassis #</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Invoice Amt</TableHead>
                        <TableHead>TMS Amt</TableHead>
                        <TableHead>Variance</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tab === 'all' ? results : results.filter(r => r.vendor === tab)).slice(0, 100).map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
                          <TableCell><Badge variant="outline">{r.vendor}</Badge></TableCell>
                          <TableCell className="font-mono text-sm">{r.invoice_number}</TableCell>
                          <TableCell>{formatCurrency(r.invoice_amount)}</TableCell>
                          <TableCell>{formatCurrency(r.tms_amount)}</TableCell>
                          <TableCell className={Math.abs(r.variance || 0) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatCurrency(r.variance)}</TableCell>
                          <TableCell>
                            {r.match_type === 'exact' ? <Badge variant="default">Exact</Badge>
                              : r.match_type === 'partial' ? <Badge variant="secondary">Partial</Badge>
                              : <Badge variant="destructive">None</Badge>}
                          </TableCell>
                          <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                          <TableCell className="text-sm">{formatDate(r.created_at)}</TableCell>
                        </TableRow>
                      ))}
                      {results.length === 0 && (
                        <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No validation results. Run validation to generate results.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
