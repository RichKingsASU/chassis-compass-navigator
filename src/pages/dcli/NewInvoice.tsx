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

  async function handleSubmit() {
    if (!validateHeader() || !file) return
    setSubmitting(true); setSubmitError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email ?? null
      const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      const filePath = `dcli/${Date.now()}_${form.invoice_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`
      const { error: upErr } = await supabase.storage.from('dcli-invoices').upload(filePath, file, { upsert: false })
      if (upErr) throw new Error(`File upload failed: ${upErr.message}`)
      const { data: inv, error: invErr } = await supabase.from('dcli_invoice').insert({
        invoice_id: form.invoice_number.trim(), invoice_number: form.invoice_number.trim(),
        invoice_date: form.invoice_date || null, due_date: form.due_date || null,
        billing_date: form.billing_date || null, account_code: form.account_code || null,
        total_amount: parseFloat(form.total_amount) || null,
        portal_status: form.portal_status || null, internal_notes: form.internal_notes || null,
        vendor: 'DCLI', file_name: file.name, file_type: ext, file_path: filePath, status: 'staged',
      }).select('id').single()
      if (invErr) throw new Error(`Invoice insert failed: ${invErr.message}`)
      const invoiceId = inv.id
      if (rows.length > 0) {
        const lineItems = rows.map(row => ({ invoice_id: invoiceId, ...mapDcliRow(row) }))
        const { error: lineErr } = await supabase.from('dcli_invoice_line_item').insert(lineItems)
        if (lineErr) throw new Error(`Line items failed: ${lineErr.message}`)
      }
      await supabase.from('dcli_invoice_documents').insert({
        invoice_id: invoiceId, storage_path: filePath, original_name: file.name,
        file_type: ext, file_size_bytes: file.size, document_role: 'primary_invoice', uploaded_by_email: userEmail,
      })
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: invoiceId, event_type: 'invoice_created',
        to_status: form.portal_status || null, note: form.internal_notes || null,
        created_by_email: userEmail,
        metadata: { invoice_number: form.invoice_number, line_count: rows.length, file_name: file.name, is_pdf: isPdf },
      })
      setCreatedId(invoiceId)
      setStep('confirm')
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
            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-14 cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'}`}
            >
              {parsing ? (
                <><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /><p className="text-sm text-muted-foreground">Parsing file…</p></>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-full"><Upload size={28} className="text-muted-foreground" /></div>
                  <div className="text-center">
                    <p className="font-medium">{isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports .xlsx, .xls, .pdf — max 50 MB</p>
                  </div>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" className="hidden" onChange={onInputChange} />
            </div>
            {fileError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{fileError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'header' && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {isPdf ? <FileText size={14} /> : <FileSpreadsheet size={14} />}
                <span className="truncate max-w-xs">{file.name}</span>
                {rows.length > 0 && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{rows.length} line items detected</span>}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Invoice Number <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. 1509151" value={form.invoice_number} onChange={e => setField('invoice_number', e.target.value)} />
                {formErrors.invoice_number && <p className="text-xs text-destructive">{formErrors.invoice_number}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Total ($) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.total_amount} onChange={e => setField('total_amount', e.target.value)} />
                {formErrors.total_amount && <p className="text-xs text-destructive">{formErrors.total_amount}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Billing / Invoice Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)} />
                {formErrors.invoice_date && <p className="text-xs text-destructive">{formErrors.invoice_date}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setField('due_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Account / Pool Code</Label>
                <Input placeholder="e.g. FRQT" value={form.account_code} onChange={e => setField('account_code', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Initial Status</Label>
                <Select value={form.portal_status} onValueChange={v => setField('portal_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select status…" /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(s)}`}>{s}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea rows={3} placeholder="Optional notes for the team…" value={form.internal_notes} onChange={e => setField('internal_notes', e.target.value)} />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>← Back</Button>
              <Button onClick={() => { if (validateHeader()) setStep('review') }}>Continue to Review →</Button>
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
          <CardHeader><CardTitle>Invoice Saved</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-950/30 dark:border-emerald-800">
              <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Invoice {form.invoice_number} created successfully</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {rows.length > 0 ? `${rows.length} line items saved` : 'PDF stored as document'} · file saved to dcli-invoices bucket
                </p>
              </div>
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
