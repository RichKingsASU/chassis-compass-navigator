import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { parseExcelFile } from '@/utils/excelParser'
import { formatCurrency } from '@/utils/dateUtils'
import { INVOICE_STATUSES, statusBadgeClass, type InvoiceStatus } from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, ArrowLeft, Upload, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react'

type Step = 'upload' | 'header' | 'review' | 'confirm'

interface HeaderForm {
  invoice_number: string; invoice_date: string; due_date: string
  billing_date: string; account_code: string; total_amount: string
  portal_status: InvoiceStatus | ''; internal_notes: string
}

const EMPTY_FORM: HeaderForm = {
  invoice_number: '', invoice_date: '', due_date: '', billing_date: '',
  account_code: '', total_amount: '', portal_status: '', internal_notes: '',
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload',  label: 'Upload File'  },
  { key: 'header',  label: 'Invoice Info' },
  { key: 'review',  label: 'Review Data'  },
  { key: 'confirm', label: 'Confirm'      },
]

function toDateStr(v: unknown): string {
  if (!v) return ''
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10)
  if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) }
  return ''
}

function mapDcliRow(row: Record<string, unknown>) {
  const dateOut = row['On-Hire Date']  ?? row['Date Out'] ?? null
  const dateIn  = row['Off-Hire Date'] ?? row['Date In']  ?? null
  return {
    line_invoice_number: String(row['Invoice Number'] ?? ''),
    chassis:    String(row['Chassis On-Hire']   ?? row['Chassis']    ?? ''),
    container:  String(row['Container On-Hire'] ?? row['Container']  ?? ''),
    date_out:   dateOut instanceof Date ? dateOut.toISOString() : (dateOut ? String(dateOut) : null),
    date_in:    dateIn  instanceof Date ? dateIn.toISOString()  : (dateIn  ? String(dateIn)  : null),
    days_used:  Number(row['Tier 1 Days']  ?? row['Days Out']    ?? 0) || null,
    daily_rate: Number(row['Tier 1 Rate']  ?? row['Daily Rate']  ?? 0) || null,
    line_total: Number(row['Grand Total']  ?? row['Line Total']  ?? 0) || null,
    row_data:   row,
  }
}

function autoFillHeader(rows: Record<string, unknown>[]): Partial<HeaderForm> {
  if (!rows.length) return {}
  const r = rows[0]
  return {
    invoice_number: String(r['Summary Invoice Number'] ?? r['Invoice Number'] ?? ''),
    invoice_date:   toDateStr(r['Billing Date']  ?? r['Invoice Date']),
    due_date:       toDateStr(r['Due Date']),
    account_code:   String(r['Corporate Account'] ?? r['Pool Contract'] ?? ''),
  }
}

export default function DCLINewInvoice() {
  const navigate     = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,        setStep]        = useState<Step>('upload')
  const [form,        setForm]        = useState<HeaderForm>(EMPTY_FORM)
  const [formErrors,  setFormErrors]  = useState<Partial<Record<keyof HeaderForm, string>>>({})
  const [file,        setFile]        = useState<File | null>(null)
  const [isPdf,       setIsPdf]       = useState(false)
  const [columns,     setColumns]     = useState<string[]>([])
  const [rows,        setRows]        = useState<Record<string, unknown>[]>([])
  const [isDragging,  setIsDragging]  = useState(false)
  const [parsing,     setParsing]     = useState(false)
  const [fileError,   setFileError]   = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdId,   setCreatedId]   = useState<string | null>(null)

  function setField(f: keyof HeaderForm, v: string) {
    setForm(prev => ({ ...prev, [f]: v }))
    setFormErrors(prev => ({ ...prev, [f]: undefined }))
  }

  function validateHeader(): boolean {
    const e: Partial<Record<keyof HeaderForm, string>> = {}
    if (!form.invoice_number.trim()) e.invoice_number = 'Required'
    if (!form.invoice_date)          e.invoice_date   = 'Required'
    if (!form.total_amount || isNaN(parseFloat(form.total_amount))) e.total_amount = 'Enter a valid number'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const processFile = useCallback(async (selected: File) => {
    setFile(selected)
    setFileError(null)
    const pdf = selected.name.toLowerCase().endsWith('.pdf')
    setIsPdf(pdf)
    if (pdf) { setColumns([]); setRows([]); setStep('header'); return }
    setParsing(true)
    try {
      const sheets = await parseExcelFile(selected)
      const first  = sheets[0]
      if (!first || first.rows.length === 0) throw new Error('No data found in file')
      setColumns(first.headers)
      setRows(first.rows)
      setForm(prev => ({ ...prev, ...autoFillHeader(first.rows) }))
      setStep('header')
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally { setParsing(false) }
  }, [])

  function onDragOver(e: React.DragEvent<HTMLDivElement>)  { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  function onDragLeave(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragging(false) }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) processFile(dropped)
  }
  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) processFile(selected)
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
    if (!validateHeader() || !file) return
    setSubmitting(true); setSubmitError(null)
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
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const stepIdx     = STEPS.findIndex(s => s.key === step)
  const previewCols = columns.slice(0, 8)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/vendors/dcli')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to DCLI
        </button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-semibold">New Invoice</h1>
      </div>

      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i < stepIdx; const current = i === stepIdx
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1 min-w-[72px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${done ? 'bg-primary border-primary text-primary-foreground' : current ? 'bg-background border-primary text-primary' : 'bg-muted border-muted-foreground/30 text-muted-foreground'}`}>
                  {done ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`text-xs text-center ${current ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-10 mx-1 mb-5 transition-colors ${done ? 'bg-primary' : 'bg-muted-foreground/20'}`} />}
            </div>
          )
        })}
      </div>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Invoice File</CardTitle>
            <p className="text-sm text-muted-foreground">Drag and drop your DCLI invoice XLSX or PDF, or click to browse.</p>
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
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Review Data</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Confirm the invoice details before saving.</p>
              </div>
              {rows.length > 0 && <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">{rows.length} line items</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg text-sm">
              <div><p className="text-muted-foreground text-xs">Invoice #</p><p className="font-medium">{form.invoice_number}</p></div>
              <div><p className="text-muted-foreground text-xs">Billing Date</p><p className="font-medium">{form.invoice_date || '—'}</p></div>
              <div><p className="text-muted-foreground text-xs">Due Date</p><p className="font-medium">{form.due_date || '—'}</p></div>
              <div><p className="text-muted-foreground text-xs">Total</p><p className="font-medium">{formatCurrency(parseFloat(form.total_amount) || 0)}</p></div>
            </div>
            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm">
                {isPdf ? <FileText size={14} className="text-muted-foreground" /> : <FileSpreadsheet size={14} className="text-muted-foreground" />}
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                {isPdf && <span className="text-muted-foreground italic ml-1">— PDF stored as document only</span>}
              </div>
            )}
            {rows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewCols.map(col => <TableHead key={col} className="whitespace-nowrap text-xs">{col}</TableHead>)}
                      {columns.length > 8 && <TableHead className="text-xs text-muted-foreground">+{columns.length - 8} more</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {previewCols.map(col => <TableCell key={col} className="text-xs whitespace-nowrap max-w-[160px] truncate">{String(row[col] ?? '')}</TableCell>)}
                        {columns.length > 8 && <TableCell />}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rows.length > 10 && <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/20">Showing 10 of {rows.length} rows</div>}
              </div>
            )}
            {submitError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{submitError}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('header')}>← Back</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Saving…</> : 'Save Invoice →'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card>
          <CardHeader><CardTitle>Invoice Submitted</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 text-lg font-medium">Invoice successfully uploaded!</p>
              <p className="text-green-700 text-sm mt-1">Invoice and {parsedData[0]?.rows.length ?? 0} line items have been saved.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {createdId && <Button onClick={() => navigate(`/vendors/dcli/invoices/${createdId}/detail`)}>View Invoice Details</Button>}
              <Button variant="outline" onClick={() => navigate('/vendors/dcli/invoices')}>Invoice Tracker</Button>
              <Button variant="ghost" onClick={() => { setStep('upload'); setFile(null); setIsPdf(false); setColumns([]); setRows([]); setForm(EMPTY_FORM); setCreatedId(null) }}>Upload Another</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
