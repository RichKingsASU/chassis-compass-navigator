import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface StagedInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  total_amount: number
  status: string
  source_file: string
  created_at: string
  [key: string]: unknown
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export default function DCLIInvoiceReview() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const { data: invoice, isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['dcli_invoice_staging', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null
      const { data, error } = await supabase
        .from('dcli_invoice_staging')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle()
      if (error) throw error
      return data as StagedInvoice
    },
    enabled: !!invoiceId
  })

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceId) return
      const { data, error } = await supabase.rpc('validate_dcli_invoice', { invoice_id: invoiceId })
      if (error) throw error
      return data as ValidationResult
    },
    onSuccess: (data) => {
      setValidation(data || null)
      if (data?.valid) {
        toast.success('Validation passed')
      } else {
        toast.error('Validation failed with errors')
      }
    },
    onError: (error: Error) => {
      toast.error(`Validation error: ${error.message}`)
    }
  })

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceId) return
      const { error } = await supabase
        .from('dcli_invoice_staging')
        .update({ status: 'approved' })
        .eq('id', invoiceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcli_invoice_staging'] })
      toast.success('Invoice approved successfully')
      navigate('/vendors/dcli')
    },
    onError: (error: Error) => {
      toast.error(`Approval failed: ${error.message}`)
    }
  })

  const handleBack = () => {
    navigate(
      invoiceId
        ? `/vendors/dcli/invoices/${encodeURIComponent(invoiceId)}/detail`
        : '/vendors/dcli?tab=invoices'
    )
  }

  if (fetchError) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{fetchError instanceof Error ? fetchError.message : 'Failed to load invoice'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/vendors/dcli?tab=invoices')}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  if (!loading && !invoice) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-destructive font-medium">Invoice not found.</p>
        <Button variant="outline" onClick={() => navigate('/vendors/dcli?tab=invoices')}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Invoice Review</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <span className="text-muted-foreground font-medium">Invoice Number</span>
                <span className="font-mono font-bold text-base">{invoice?.invoice_number || 'N/A'}</span>
                
                <span className="text-muted-foreground font-medium">Invoice Date</span>
                <span className="font-medium">{formatDate(invoice?.invoice_date)}</span>
                
                <span className="text-muted-foreground font-medium">Total Amount</span>
                <span className="font-bold text-primary text-lg">{formatCurrency(invoice?.total_amount || 0)}</span>
                
                <span className="text-muted-foreground font-medium">Current Status</span>
                <div>
                  <Badge variant="outline" className="px-3 py-0.5 capitalize">{invoice?.status}</Badge>
                </div>
                
                <span className="text-muted-foreground font-medium">Source File</span>
                <span className="text-xs break-all font-mono bg-muted p-2 rounded">{invoice?.source_file}</span>
                
                <span className="text-muted-foreground font-medium">System Entry</span>
                <span className="text-xs text-muted-foreground">{formatDate(invoice?.created_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Validation Engine</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {!validation ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-muted/30 rounded-lg border-2 border-dashed">
                <div className="p-3 bg-background rounded-full shadow-sm">
                  <AlertCircle className="text-muted-foreground" size={24} />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">No Validation Performed</p>
                  <p className="text-xs text-muted-foreground px-10">Check this invoice against TMS records to identify disputes and discrepancies.</p>
                </div>
                <Button 
                  onClick={() => validateMutation.mutate()} 
                  disabled={validateMutation.isPending}
                  size="sm"
                  className="font-semibold"
                >
                  {validateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Diagnostics...</>
                  ) : 'Run Cross-Reference Check'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${validation.valid ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                  {validation.valid ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-red-600" />}
                  <span className="font-bold text-lg">
                    {validation.valid ? 'System Validation Passed' : 'Discrepancies Detected'}
                  </span>
                </div>

                {validation.errors?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-2">
                      <span className="h-1 w-4 bg-red-600" /> Critical Errors
                    </p>
                    <ul className="space-y-2">
                      {validation.errors.map((e, i) => (
                        <li key={i} className="text-sm bg-red-50/50 p-3 rounded border border-red-100 flex gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.warnings?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                      <span className="h-1 w-4 bg-amber-500" /> Observations
                    </p>
                    <ul className="space-y-2">
                      {validation.warnings.map((w, i) => (
                        <li key={i} className="text-sm bg-amber-50/50 p-3 rounded border border-amber-100 flex gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending}
                  className="w-full"
                >
                  Re-run Validation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Raw Staging Attributes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3 pl-6">Staging Attribute</TableHead>
                  <TableHead>Captured Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  Object.entries(invoice || {}).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium text-xs text-muted-foreground uppercase pl-6">{key}</TableCell>
                      <TableCell className="text-sm font-mono">{String(value ?? '—')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4 pt-4 border-t">
        <Button 
          size="lg" 
          onClick={() => approveMutation.mutate()} 
          disabled={approveMutation.isPending || (validation !== null && !validation.valid)}
          className="px-10 font-bold"
        >
          {approveMutation.isPending ? 'Processing...' : 'Approve for Payment'}
        </Button>
        <Button 
          size="lg"
          variant="destructive" 
          onClick={() => navigate('/vendors/dcli')}
          className="px-10"
        >
          Reject Snapshot
        </Button>
        <Button 
          size="lg"
          variant="outline" 
          onClick={handleBack}
          className="px-10"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
