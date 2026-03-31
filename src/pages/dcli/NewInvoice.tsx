import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { parseExcelFile, type ParsedSheet } from '@/utils/excelParser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Step = 'upload' | 'review' | 'submit'

export default function DCLINewInvoice() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedSheet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setError(null)
    setLoading(true)
    try {
      const rows = await parseExcelFile(selected)
      setParsedData(rows)
      setStep('review')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add('border-primary', 'bg-primary/5')
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return
    const fakeEvent = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFileChange(fakeEvent)
  }

  async function handleSubmit() {
    if (!file || parsedData.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const filePath = `dcli/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('dcli-invoices').upload(filePath, file)
      if (uploadError) throw uploadError

      const now = new Date().toISOString()
      const firstSheet = parsedData[0]
      const rows = firstSheet ? firstSheet.rows : []

      // Insert invoice header
      const { data: invoice, error: invoiceError } = await supabase.from('dcli_invoice').insert({
        invoice_number: file.name.replace(/\.\w+$/, ''),
        invoice_date: now,
        vendor: 'DCLI',
        total_amount: rows.reduce((sum, r) => sum + (Number((r as any).line_total) || 0), 0),
        status: 'pending',
        portal_status: 'OK TO PAY',
        file_name: file.name,
        file_path: filePath,
        created_at: now,
        updated_at: now,
      }).select().single()
      if (invoiceError) throw invoiceError

      // Insert line items
      const lineItems = rows.map(row => ({
        invoice_id: invoice.id,
        line_invoice_number: (row as any).invoice_number ?? null,
        chassis: (row as any).chassis ?? null,
        container: (row as any).container ?? null,
        date_out: (row as any).date_out ?? null,
        date_in: (row as any).date_in ?? null,
        days_used: Number((row as any).days_used) || null,
        daily_rate: Number((row as any).daily_rate) || null,
        line_total: Number((row as any).line_total) || null,
      }))
      if (lineItems.length > 0) {
        const { error: lineError } = await supabase.from('dcli_invoice_line_item').insert(lineItems)
        if (lineError) throw lineError
      }

      // Insert document record
      const { error: docError } = await supabase.from('dcli_invoice_documents').insert({
        invoice_id: invoice.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || 'application/octet-stream',
        uploaded_at: now,
      })
      if (docError) throw docError

      // Insert audit log entry
      const { error: eventError } = await supabase.from('dcli_invoice_events').insert({
        invoice_id: invoice.id,
        event_type: 'created',
        description: `Invoice uploaded from file ${file.name}`,
        created_at: now,
      })
      if (eventError) throw eventError

      setStep('submit')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit invoice')
    } finally {
      setUploading(false)
    }
  }

  const firstSheet = parsedData[0]; const columns = firstSheet ? firstSheet.headers.slice(0, 8) : []; const rows = firstSheet ? firstSheet.rows : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vendors/dcli')} className="text-muted-foreground hover:text-foreground text-sm">
          &larr; Back to DCLI
        </button>
        <h1 className="text-3xl font-bold">New DCLI Invoice</h1>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {(['upload', 'review', 'submit'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s ? 'bg-primary text-primary-foreground' : i < ['upload', 'review', 'submit'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
              {i + 1}
            </div>
            <span className="text-sm capitalize">{s}</span>
            {i < 2 && <div className="w-8 h-px bg-muted mx-1" />}
          </div>
        ))}
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Invoice File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Upload an Excel (.xlsx) or PDF file containing the DCLI invoice data.</p>
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <div className="space-y-2">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-lg font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, .pdf</p>
              </div>
            </div>
            {loading && <p className="text-center text-muted-foreground">Parsing file...</p>}
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Review Parsed Data</CardTitle>
              <Badge variant="outline">{rows.length} rows found</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Review the parsed invoice data below before submitting.</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      {columns.map(col => (
                        <TableCell key={col} className="text-sm">{String((row as any)[col] ?? '')}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 20 && (
              <p className="text-sm text-muted-foreground text-center">Showing 20 of {rows.length} rows</p>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? 'Submitting...' : 'Submit Invoice'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'submit' && (
        <Card>
          <CardHeader><CardTitle>Invoice Submitted</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 text-lg font-medium">Invoice successfully uploaded!</p>
              <p className="text-green-700 text-sm mt-1">Invoice and {parsedData[0]?.rows.length ?? 0} line items have been saved.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/vendors/dcli')}>Back to DCLI</Button>
              <Button variant="outline" onClick={() => { setStep('upload'); setFile(null); setParsedData([]); }}>Upload Another</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
