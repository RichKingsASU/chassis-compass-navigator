import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
  const [invoice, setInvoice] = useState<StagedInvoice | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!invoiceId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice_staging')
          .select('*')
          .eq('id', invoiceId)
          .maybeSingle()
        if (fetchErr) throw fetchErr
        if (!cancelled) setInvoice((data ?? null) as StagedInvoice | null)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [invoiceId])

  async function runValidation() {
    if (!invoiceId) return
    setValidating(true)
    setError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('validate_dcli_invoice', { invoice_id: invoiceId })
      if (rpcErr) throw rpcErr
      setValidation(data as ValidationResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  async function approveInvoice() {
    if (!invoiceId) return
    try {
      const { error: updateErr } = await supabase
        .from('dcli_invoice_staging')
        .update({ status: 'approved' })
        .eq('id', invoiceId)
      if (updateErr) throw updateErr
      navigate('/vendors/dcli')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve invoice')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading invoice review...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/vendors/dcli#invoices')}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-destructive">Invoice not found.</p>
        <Button variant="outline" onClick={() => navigate('/vendors/dcli#invoices')}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendors/dcli')}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          &larr; Back to DCLI
        </button>
        <h1 className="text-3xl font-bold">Review Invoice</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Invoice #:</span>
              <span className="font-medium">{invoice.invoice_number || 'N/A'}</span>
              <span className="text-muted-foreground">Invoice Date:</span>
              <span>{formatDate(invoice.invoice_date)}</span>
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline">{invoice.status}</Badge>
              <span className="text-muted-foreground">Source File:</span>
              <span className="text-xs break-all">{invoice.source_file}</span>
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(invoice.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Validation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!validation ? (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">Run validation to check invoice against TMS data.</p>
                <Button onClick={runValidation} disabled={validating}>
                  {validating ? 'Validating...' : 'Run Validation'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`p-3 rounded-md ${validation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${validation.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {validation.valid ? 'Validation Passed' : 'Validation Failed'}
                  </p>
                </div>
                {validation.errors?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-destructive mb-1">Errors:</p>
                    <ul className="text-sm text-destructive list-disc list-inside space-y-1">
                      {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {validation.warnings?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-yellow-700 mb-1">Warnings:</p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                      {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Raw Data</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(invoice).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium text-sm">{key}</TableCell>
                  <TableCell className="text-sm">{String(value ?? '')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={approveInvoice}>Approve Invoice</Button>
        <Button variant="destructive" onClick={() => navigate('/vendors/dcli')}>Reject</Button>
        <Button variant="outline" onClick={() => navigate('/vendors/dcli')}>Cancel</Button>
      </div>
    </div>
  )
}
