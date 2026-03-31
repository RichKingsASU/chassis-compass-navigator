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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, ArrowLeft, Upload, FileSpreadsheet, FileText, AlertCircle, X } from 'lucide-react'

type Step = 'upload' | 'header' | 'review' | 'confirm'

interface HeaderForm {
  invoice_number: string; invoice_date: string; due_date: string
  billing_date: string; account_code: string; total_amount: string
  portal_status: InvoiceStatus | ''; internal_notes: string
}

interface FileEntry {
  file: File; isPdf: boolean; columns: string[]
  rows: Record<string, unknown>[]; error: string | null; parsing: boolean
}

const EMPTY_FORM: HeaderForm = {
  invoice_number: '', invoice_date: '', due_date: '', billing_date: '',
  account_code: '', total_amount: '', portal_status: '', internal_notes: '',
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload',  label: 'Upload Files' },
  { key: 'header',  label: 'Invoice Info' },
  { key: 'review',  label: 'Review Data'  },
  { key: 'confirm', label: 'Confirm'      },
]

function toDateStr(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) }
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10)
  return ''
}

function formatDisplayDate(v: unknown): string {
  const s = toDateStr(v)
  if (!s) return String(v ?? '')
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapDcliRow(row: Record<string, unknown>) {
  const dateOut = row['On-Hire Date']  ?? row['Date Out'] ?? null
  const dateIn  = row['Off-Hire Date'] ?? row['Date In']  ?? null
  return {
    line_invoice_number: String(row['Invoice Number']       ?? ''),
    chassis:    String(row['Chassis On-Hire']   ?? row['Chassis']    ?? ''),
    container:  String(row['Container On-Hire'] ?? row['Container']  ?? ''),
    date_out:   toDateStr(dateOut) || (dateOut ? String(dateOut) : null),
    date_in:    toDateStr(dateIn)  || (dateIn  ? String(dateIn)  : null),
    days_used:  Number(row['Tier 1 Days'] ?? row['Days Out']   ?? 0) || null,
    daily_rate: Number(row['Tier 1 Rate'] ?? row['Daily Rate'] ?? 0) || null,
    line_total: Number(row['Grand Total'] ?? row['Line Total'] ?? 0) || null,
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

const PREVIEW_PRIORITY = [
  'Invoice Number', 'Chassis On-Hire', 'Container On-Hire',
  'On-Hire Date', 'Off-Hire Date', 'Tier 1 Days', 'Tier 1 Rate',
  'Grand Total', 'Pool Contract',
]

function pickPreviewCols(headers: string[]): string[] {
  const priority = PREVIEW_PRIORITY.filter(c => headers.includes(c))
  const rest = headers.filter(c => !priority.includes(c))
  return [...priority, ...rest].slice(0, 9)
}

export default function DCLINewInvoice() {
  const navigate     = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,        setStep]        = useState<Step>('upload')
  const [form,        setForm]        = useState<HeaderForm>(EMPTY_FORM)
  const [formErrors,  setFormErrors]  = useState<Partial<Record<keyof HeaderForm, string>>>({})
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [isDragging,  setIsDragging]  = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdId,   setCreatedId]   = useState<string | null>(null)
  const [dupWarning,  setDupWarning]  = useState<string | null>(null)
  const [checkingDup, setCheckingDup] = useState(false)

  function setField(f: keyof HeaderForm, v: string) {
    setForm(prev => ({ ...prev, [f]: v }))
    setFormErrors(prev => ({ ...prev, [f]: undefined }))
    if (f === 'invoice_number') setDupWarning(null)
  }

  function validateHeader(): boolean {
    const e: Partial<Record<keyof HeaderForm, string>> = {}
    if (!form.invoice_number.trim()) e.invoice_number = 'Required'
    if (!form.invoice_date)          e.invoice_date   = 'Required'
    if (!form.total_amount || isNaN(parseFloat(form.total_amount))) e.total_amount = 'Enter a valid number'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  async function checkDuplicate(invoiceNumber: string) {
    if (!invoiceNumber.trim()) return
    setCheckingDup(true); setDupWarning(null)
    try {
      const { data } = await supabase
        .from('dcli_invoice')
        .select('id, created_at')
        .eq('invoice_number', invoiceNumber.trim())
        .limit(1)
      if (data && data.length > 0) {
        const date = new Date(data[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        setDupWarning(`Invoice ${invoiceNumber} already exists (uploaded ${date}). Submitting will create a duplicate.`)
      }
    } finally { setCheckingDup(false) }
  }

  const processFile = useCallback(async (f: File): Promise<FileEntry> => {
    const isPdf = f.name.toLowerCase().endsWith('.pdf')
    if (isPdf) return { file: f, isPdf: true, columns: [], rows: [], error: null, parsing: false }
    try {
      const sheets = await parseExcelFile(f)
      const first  = sheets[0]
      if (!first || first.rows.length === 0) throw new Error('No data found in file')
      return { file: f, isPdf: false, columns: first.headers, rows: first.rows, error: null, parsing: false }
    } catch (err: unknown) {
      return { file: f, isPdf: false, columns: [], rows: [], error: err instanceof Error ? err.message : 'Parse failed', parsing: false }
    }
  }, [])

  const addFiles = useCallback(async (incoming: File[]) => {
    const existingNames = fileEntries.map(e => e.file.name)
    const newFiles = incoming.filter(f => !existingNames.includes(f.name))
    if (!newFiles.length) return
    setFileEntries(prev => [
      ...prev,
      ...newFiles.map(f => ({ file: f, isPdf: f.name.toLowerCase().endsWith('.pdf'), columns: [], rows: [], error: null, parsing: true })),
    ])
    const parsed = await Promise.all(newFiles.map(processFile))
    setFileEntries(prev => {
      const updated = [...prev]
      parsed.forEach((result, i) => {
        const idx = updated.findIndex(e => e.file.name === newFiles[i].name)
        if (idx !== -1) updated[idx] = result
      })
      return updated
    })
    const firstXlsx = parsed.find(p => !p.isPdf && p.rows.length > 0)
    if (firstXlsx && !form.invoice_number) {
      const auto = autoFillHeader(firstXlsx.rows)
      setForm(prev => ({ ...prev, ...auto }))
      if (auto.invoice_number) checkDuplicate(auto.invoice_number)
    }
  }, [fileEntries, form.invoice_number, processFile])

  function removeFile(name: string) { setFileEntries(prev => prev.filter(e => e.file.name !== name)) }

  function onDragOver(e: React.DragEvent<HTMLDivElement>)  { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  function onDragLeave(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragging(false) }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }
  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  async function handleSubmit() {
    if (!validateHeader()) return
    if (!fileEntries.length) { setSubmitError('Please upload at least one file'); return }
    setSubmitting(true); setSubmitError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email ?? null

      // Hard duplicate block before writing anything
      const { data: dupCheck } = await supabase
        .from('dcli_invoice').select('id').eq('invoice_number', form.invoice_number.trim()).limit(1)
      if (dupCheck && dupCheck.length > 0)
        throw new Error(`Invoice ${form.invoice_number} already exists. Use a different invoice number.`)

      // Upload ALL files now (after user approved on review step)
      const uploaded: { entry: FileEntry; path: string; ext: string }[] = []
      for (const entry of fileEntries) {
        const ext  = entry.file.name.split('.').pop()?.toLowerCase() ?? 'bin'
        const path = `dcli/${Date.now()}_${form.invoice_number.replace(/[^a-zA-Z0-9_-]/g, '_')}_${entry.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: upErr } = await supabase.storage.from('dcli-invoices').upload(path, entry.file, { upsert: false })
        if (upErr) throw new Error(`Upload failed for ${entry.file.name}: ${upErr.message}`)
        uploaded.push({ entry, path, ext })
      }

      // Insert invoice header
      const primary = uploaded[0]
      const { data: inv, error: invErr } = await supabase
        .from('dcli_invoice')
        .insert({
          invoice_id: form.invoice_number.trim(), invoice_number: form.invoice_number.trim(),
          invoice_date: form.invoice_date || null, due_date: form.due_date || null,
          billing_date: form.billing_date || null, account_code: form.account_code || null,
          total_amount: parseFloat(form.total_amount) || null,
          portal_status: form.portal_status || null, internal_notes: form.internal_notes || null,
          vendor: 'DCLI', file_name: primary.entry.file.name,
          file_type: primary.ext, file_path: primary.path, status: 'staged',
        })
        .select('id').single()
      if (invErr) throw new Error(`Invoice insert failed: ${invErr.message}`)
      const invoiceId = inv.id

      // Insert all line items from all XLSX files
      const allLines: Record<string, unknown>[] = []
      for (const { entry } of uploaded) {
        if (!entry.isPdf && entry.rows.length > 0)
          entry.rows.forEach(row => allLines.push({ invoice_id: invoiceId, ...mapDcliRow(row) }))
      }
      if (allLines.length > 0) {
        const { error: lineErr } = await supabase.from('dcli_invoice_line_item').insert(allLines)
        if (lineErr) throw new Error(`Line items insert failed: ${lineErr.message}`)
      }

      // Record all documents
      for (const { entry, path, ext } of uploaded) {
        await supabase.from('dcli_invoice_documents').insert({
          invoice_id: invoiceId, storage_path: path, original_name: entry.file.name,
          file_type: ext, file_size_bytes: entry.file.size,
          document_role: entry.isPdf ? 'primary_invoice' : 'supporting',
          uploaded_by_email: userEmail,
        })
      }

      // Log creation event
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: invoiceId, event_type: 'invoice_created',
        to_status: form.portal_status || null, note: form.internal_notes || null,
        created_by_email: userEmail,
        metadata: { invoice_number: form.invoice_number, file_count: uploaded.length, line_count: allLines.length, files: uploaded.map(u => u.entry.file.name) },
      })

      setCreatedId(invoiceId)
      setStep('confirm')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const stepIdx    = STEPS.findIndex(s => s.key === step)
  const totalRows  = fileEntries.reduce((sum, e) => sum + e.rows.length, 0)
  const anyParsing = fileEntries.some(e => e.parsing)
  const anyErrors  = fileEntries.some(e => !!e.error)
  const hasFiles   = fileEntries.length > 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

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
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${done ? 'bg-primary border-primary text-primary-foreground' : current ? 'bg-background border-primary text-primary' : 'bg-muted border-muted-foreground/30 text-muted-foreground'}`}>
                  {done ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`text-xs text-center ${current ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-10 mx-1 mb-5 ${done ? 'bg-primary' : 'bg-muted-foreground/20'}`} />}
            </div>
          )
        })}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Invoice Files</CardTitle>
            <p className="text-sm text-muted-foreground">Add one or more files. Mix of PDF and XLSX is fine.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'}`}
            >
              {anyParsing ? (
                <><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /><p className="text-sm text-muted-foreground">Parsing files…</p></>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-full"><Upload size={28} className="text-muted-foreground" /></div>
                  <div className="text-center">
                    <p className="font-medium">{isDragging ? 'Drop files here' : 'Drag & drop or click to upload'}</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports .xlsx, .xls, .pdf — multiple files allowed</p>
                  </div>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" multiple className="hidden" onChange={onInputChange} />
            </div>

            {hasFiles && (
              <div className="space-y-2">
                {fileEntries.map(entry => (
                  <div key={entry.file.name} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${entry.error ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/30'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {entry.parsing
                        ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0" />
                        : entry.isPdf
                          ? <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                          : <FileSpreadsheet size={16} className="text-muted-foreground flex-shrink-0" />}
                      <span className="truncate font-medium">{entry.file.name}</span>
                      <span className="text-muted-foreground flex-shrink-0 text-xs">({(entry.file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {entry.error && <span className="text-destructive text-xs">{entry.error}</span>}
                      {!entry.parsing && !entry.isPdf && entry.rows.length > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{entry.rows.length} rows</span>}
                      {entry.isPdf && !entry.parsing && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">PDF</span>}
                      <button onClick={e => { e.stopPropagation(); removeFile(entry.file.name) }}
                        className="text-muted-foreground hover:text-destructive p-1"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasFiles && !anyParsing && (
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep('header')} disabled={anyErrors}>
                  Continue to Invoice Info →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Header */}
      {step === 'header' && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <p className="text-sm text-muted-foreground">{fileEntries.length} file{fileEntries.length > 1 ? 's' : ''} ready · {totalRows} line items detected</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Invoice Number <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input placeholder="e.g. 1509151" value={form.invoice_number}
                    onChange={e => setField('invoice_number', e.target.value)}
                    onBlur={e => checkDuplicate(e.target.value)} />
                  {checkingDup && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />}
                </div>
                {formErrors.invoice_number && <p className="text-xs text-destructive">{formErrors.invoice_number}</p>}
                {dupWarning && (
                  <div className="flex items-start gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-2 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />{dupWarning}
                  </div>
                )}
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

      {/* STEP 3: Review */}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Review Data</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Files are uploaded only after you click Save.</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">{fileEntries.length} file{fileEntries.length > 1 ? 's' : ''}</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">{totalRows} line items</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg text-sm">
              <div><p className="text-muted-foreground text-xs">Invoice #</p><p className="font-semibold">{form.invoice_number}</p></div>
              <div><p className="text-muted-foreground text-xs">Billing Date</p><p className="font-medium">{form.invoice_date || '—'}</p></div>
              <div><p className="text-muted-foreground text-xs">Due Date</p><p className="font-medium">{form.due_date || '—'}</p></div>
              <div><p className="text-muted-foreground text-xs">Total</p><p className="font-semibold">{formatCurrency(parseFloat(form.total_amount) || 0)}</p></div>
            </div>

            <Tabs defaultValue={fileEntries[0]?.file.name}>
              <TabsList className="flex-wrap h-auto gap-1">
                {fileEntries.map(entry => (
                  <TabsTrigger key={entry.file.name} value={entry.file.name} className="text-xs">
                    {entry.isPdf ? <FileText size={12} className="mr-1" /> : <FileSpreadsheet size={12} className="mr-1" />}
                    <span className="max-w-[140px] truncate">{entry.file.name}</span>
                    {!entry.isPdf && entry.rows.length > 0 && <span className="ml-1.5 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{entry.rows.length}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
              {fileEntries.map(entry => {
                const previewCols = pickPreviewCols(entry.columns)
                return (
                  <TabsContent key={entry.file.name} value={entry.file.name} className="mt-4">
                    {entry.isPdf ? (
                      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg text-sm">
                        <FileText size={20} className="text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium">{entry.file.name}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">PDF — stored as document attachment. No line items extracted.</p>
                        </div>
                      </div>
                    ) : entry.rows.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground text-sm">No data rows found in this file.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {previewCols.map(col => <TableHead key={col} className="whitespace-nowrap text-xs">{col}</TableHead>)}
                              {entry.columns.length > 9 && <TableHead className="text-xs text-muted-foreground">+{entry.columns.length - 9} more</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.rows.slice(0, 10).map((row, i) => (
                              <TableRow key={i}>
                                {previewCols.map(col => (
                                  <TableCell key={col} className="text-xs whitespace-nowrap max-w-[180px] truncate">
                                    {(col.includes('Date') || col.includes('Hire')) ? formatDisplayDate(row[col]) : String(row[col] ?? '')}
                                  </TableCell>
                                ))}
                                {entry.columns.length > 9 && <TableCell />}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {entry.rows.length > 10 && <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/20">Showing 10 of {entry.rows.length} rows</div>}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>

            {dupWarning && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />{dupWarning}
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
                {submitting
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Uploading &amp; Saving…</>
                  : `Save Invoice (${fileEntries.length} file${fileEntries.length > 1 ? 's' : ''}) →`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Confirm */}
      {step === 'confirm' && (
        <Card>
          <CardHeader><CardTitle>Invoice Saved</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-950/30 dark:border-emerald-800">
              <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Invoice {form.invoice_number} created successfully</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {totalRows} line items saved · {fileEntries.length} file{fileEntries.length > 1 ? 's' : ''} uploaded
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {createdId && <Button onClick={() => navigate(`/vendors/dcli/invoices/${createdId}/detail`)}>View Invoice Details</Button>}
              <Button variant="outline" onClick={() => navigate('/vendors/dcli/invoices')}>Invoice Tracker</Button>
              <Button variant="ghost" onClick={() => { setStep('upload'); setFileEntries([]); setForm(EMPTY_FORM); setCreatedId(null); setDupWarning(null) }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
