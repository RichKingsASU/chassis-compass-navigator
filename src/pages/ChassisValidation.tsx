import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  const { data: results = [], isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['validation_results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('validation_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
      if (error) throw error
      return data || []
    }
  })

  const validationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('run_full_chassis_validation')
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Validation completed successfully')
      queryClient.invalidateQueries({ queryKey: ['validation_results'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Validation failed')
    }
  })

  const error = fetchError ? (fetchError as Error).message : null

  const matched = results.filter(r => r.match_type === 'exact').length
  const unmatched = results.filter(r => !r.tms_amount).length
  const disputed = results.filter(r => r.status === 'disputed').length
  const totalVariance = results.reduce((sum, r) => sum + Math.abs(r.variance || 0), 0)

  const vendors = [...new Set(results.map(r => r.vendor).filter(Boolean))]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chassis Validation</h1>
          <p className="text-muted-foreground mt-2">Invoice validation against TMS data across all vendors</p>
        </div>
        <Button onClick={() => validationMutation.mutate()} disabled={validationMutation.isPending}>
          {validationMutation.isPending ? 'Running...' : 'Run Full Validation'}
        </Button>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Matched</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-green-600">{matched}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unmatched</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-red-600">{unmatched}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disputed</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-yellow-600">{disputed}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Variance</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-2xl font-bold text-red-600">{formatCurrency(totalVariance)}</p>}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" onValueChange={() => setPage(1)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Results</TabsTrigger>
          {vendors.map(v => <TabsTrigger key={v} value={v}>{v}</TabsTrigger>)}
        </TabsList>

        {['all', ...vendors].map(tab => {
          const tabResults = tab === 'all' ? results : results.filter(r => r.vendor === tab)
          const totalPages = Math.ceil(tabResults.length / ITEMS_PER_PAGE)
          const paginatedResults = tabResults.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border overflow-x-auto">
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
                            {paginatedResults.length === 0 ? (
                              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground h-24">No validation results. Run validation to generate results.</TableCell></TableRow>
                            ) : paginatedResults.map(r => (
                              <TableRow key={r.id} className="hover:bg-muted/50">
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
                          </TableBody>
                        </Table>
                      </div>

                      {tabResults.length > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, tabResults.length)} to {Math.min(page * ITEMS_PER_PAGE, tabResults.length)} of {tabResults.length} records
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
