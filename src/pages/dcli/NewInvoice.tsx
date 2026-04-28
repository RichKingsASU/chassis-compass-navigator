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
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  X,
  Loader2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
  { key: 'upload',  label: 'Files' },
  { key: 'header',  label: 'Metadata' },
  { key: 'review',  label: 'Audit'  },
  { key: 'confirm', label: 'Done'      },
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
  const queryClient  = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,        setStep]        = useState<Step>('upload')
  const [form,        setForm]        = useState<HeaderForm>(EMPTY_FORM)
  const [formErrors,  setFormErrors]  = useState<Partial<Record<keyof HeaderForm, string>>>({})
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [isDragging,  setIsDragging]  = useState(false)
  const [createdId,   setCreatedId]   = useState<string | null>(null)
  const [dupWarning,  setDupWarning]  = useState<string | null>(null)
  const [checkingDup, setCheckingDup] = useState(false)

  const setField = (f: keyof HeaderForm, v: string) => {
    setForm(prev => ({ ...prev, [f]: v }))
    setFormErrors(prev => ({ ...prev, [f]: undefined }))
    if (f === 'invoice_number') setDupWarning(null)
  }

  const validateHeader = (): boolean => {
    const e: Partial<Record<keyof HeaderForm, string>> = {}
    if (!form.invoice_number.trim()) e.invoice_number = 'Invoice number is required'
    if (!form.invoice_date)          e.invoice_date   = 'Billing date is required'
    if (!form.total_amount || isNaN(parseFloat(form.total_amount))) e.total_amount = 'Enter a valid total amount'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const checkDuplicate = async (invoiceNumber: string) => {
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
        setDupWarning(`Invoice ${invoiceNumber} already exists (uploaded ${date}).`)
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

  const removeFile = (name: string) => { setFileEntries(prev => prev.filter(e => e.file.name !== name)) }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email ?? null

      // Hard duplicate check
      const { data: dupCheck } = await supabase
        .from('dcli_invoice').select('id').eq('invoice_number', form.invoice_number.trim()).limit(1)
      if (dupCheck && dupCheck.length > 0)
        throw new Error(`Invoice ${form.invoice_number} already exists.`)

      // Upload files
      const uploaded: { entry: FileEntry; path: string; ext: string }[] = []
      for (const entry of fileEntries) {
        const ext  = entry.file.name.split('.').pop()?.toLowerCase() ?? 'bin'
        const path = `dcli/${Date.now()}_${form.invoice_number.replace(/[^a-zA-Z0-9_-]/g, '_')}_${entry.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: upErr } = await supabase.storage.from('dcli-invoices').upload(path, entry.file)
        if (upErr) throw new Error(`Upload failed for ${entry.file.name}: ${upErr.message}`)
        uploaded.push({ entry, path, ext })
      }

      // Insert header
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
      if (invErr) throw new Error(`Invoice header creation failed: ${invErr.message}`)
      
      const invoiceId = inv.id

      // Insert line items
      const allLines: any[] = []
      for (const { entry } of uploaded) {
        if (!entry.isPdf && entry.rows.length > 0)
          entry.rows.forEach(row => allLines.push({ invoice_id: invoiceId, ...mapDcliRow(row) }))
      }
      if (allLines.length > 0) {
        const { error: lineErr } = await supabase.from('dcli_invoice_line_item').insert(allLines)
        if (lineErr) throw new Error(`Line item synchronization failed: ${lineErr.message}`)
      }

      // Documents
      for (const { entry, path, ext } of uploaded) {
        await supabase.from('dcli_invoice_documents').insert({
          invoice_id: invoiceId, storage_path: path, original_name: entry.file.name,
          file_type: ext, file_size_bytes: entry.file.size,
          document_role: entry.isPdf ? 'primary_invoice' : 'supporting',
          uploaded_by_email: userEmail,
        })
      }

      // Audit Log
      await supabase.from('dcli_invoice_events').insert({
        invoice_id: invoiceId, event_type: 'invoice_created',
        to_status: form.portal_status || null, note: form.internal_notes || null,
        created_by_email: userEmail,
        metadata: { invoice_number: form.invoice_number, file_count: uploaded.length, line_count: allLines.length },
      })

      return invoiceId
    },
    onSuccess: (id) => {
      setCreatedId(id)
      setStep('confirm')
      queryClient.invalidateQueries({ queryKey: ['dcli_invoice'] })
      toast.success('Invoice uploaded and processed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const stepIdx    = STEPS.findIndex(s => s.key === step)
  const totalRows  = fileEntries.reduce((sum, e) => sum + e.rows.length, 0)
  const anyParsing = fileEntries.some(e => e.parsing)
  const hasFiles   = fileEntries.length > 0

  return (
    <div className="p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendors/dcli')}
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={14} /> Back to DCLI
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Onboard New Invoice</h1>
        </div>
        
        {/* Progress Stepper */}
        <div className="flex items-center bg-muted/30 p-2 rounded-full border">
          {STEPS.map((s, i) => {
            const done = i < stepIdx; const current = i === stepIdx
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full transition-all">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${done ? 'bg-primary border-primary text-primary-foreground' : current ? 'bg-background border-primary text-primary' : 'bg-muted border-muted-foreground/30 text-muted-foreground'}`}>
                    {done ? <CheckCircle2 size={12} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${current ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground/30" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <Card className="shadow-xl">
          <CardHeader className="bg-muted/5 border-b py-6">
            <CardTitle>Resource Ingestion</CardTitle>
            <p className="text-sm text-muted-foreground">Select PDF summaries and XLSX line-item reports for processing.</p>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} 
              onDragLeave={() => setIsDragging(false)} 
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-16 cursor-pointer transition-all duration-300 ${isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30'}`}
            >
              {anyParsing ? (
                <div className="flex flex-col items-center gap-4 text-primary">
                  <Loader2 size={40} className="animate-spin" strokeWidth={3} />
                  <p className="font-bold uppercase tracking-widest text-xs">Analyzing Data Patterns...</p>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-primary/10 rounded-3xl text-primary animate-pulse">
                    <Upload size={32} strokeWidth={3} />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-black">{isDragging ? 'Release to Process' : 'Drop Source Files'}</p>
                    <p className="text-sm text-muted-foreground max-w-[300px]">Ingest DCLI Excel exports or official PDF invoices for correlation.</p>
                  </div>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" multiple className="hidden" onChange={(e) => addFiles(Array.from(e.target.files ?? []))} />
            </div>

            {hasFiles && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fileEntries.map(entry => (
                  <div key={entry.file.name} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${entry.error ? 'border-destructive/30 bg-destructive/5' : 'border-muted/50 bg-background'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-muted rounded-lg">
                        {entry.isPdf ? <FileText size={18} /> : <FileSpreadsheet size={18} className="text-emerald-600" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-bold text-sm">{entry.file.name}</span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{(entry.file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {entry.error ? (
                        <Badge variant="destructive" className="text-[10px]">{entry.error}</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-bold text-[10px] bg-primary/5 text-primary border-primary/20">
                          {entry.isPdf ? 'PDF DOCK' : `${entry.rows.length} ROWS`}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeFile(entry.file.name) }}>
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasFiles && !anyParsing && (
              <div className="flex justify-end pt-4 border-t">
                <Button size="lg" className="gap-2 font-black" onClick={() => setStep('header')} disabled={fileEntries.some(e => !!e.error)}>
                  Configure Metadata <ChevronRight size={18} strokeWidth={3} />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Header */}
      {step === 'header' && (
        <Card className="shadow-xl">
          <CardHeader className="bg-muted/5 border-b py-6">
            <CardTitle>Audit Metadata</CardTitle>
            <p className="text-sm text-muted-foreground">Configure the core invoice parameters for system-wide tracking.</p>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice Reference #</Label>
                <div className="relative">
                  <Input placeholder="e.g. 1509151" value={form.invoice_number} 
                    className={`h-12 text-lg font-black font-mono border-2 ${formErrors.invoice_number ? 'border-destructive' : ''}`}
                    onChange={e => setField('invoice_number', e.target.value)}
                    onBlur={e => checkDuplicate(e.target.value)} />
                  {checkingDup && <Loader2 className="absolute right-3 top-3 animate-spin text-primary" size={20} />}
                </div>
                {formErrors.invoice_number && <p className="text-[10px] text-destructive font-bold uppercase">{formErrors.invoice_number}</p>}
                {dupWarning && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 border-2 border-amber-200 rounded-xl text-xs font-bold">
                    <AlertCircle size={16} /> {dupWarning}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Invoiced Amount</Label>
                <Input type="number" step="0.01" placeholder="0.00" 
                  className={`h-12 text-lg font-black border-2 ${formErrors.total_amount ? 'border-destructive' : ''}`}
                  value={form.total_amount} onChange={e => setField('total_amount', e.target.value)} />
                {formErrors.total_amount && <p className="text-[10px] text-destructive font-bold uppercase">{formErrors.total_amount}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Billing Date</Label>
                <Input type="date" className="h-12 font-bold border-2" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)} />
                {formErrors.invoice_date && <p className="text-[10px] text-destructive font-bold uppercase">{formErrors.invoice_date}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Settlement Due Date</Label>
                <Input type="date" className="h-12 font-bold border-2" value={form.due_date} onChange={e => setField('due_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pool Contract Code</Label>
                <Input placeholder="e.g. FRQT" className="h-12 font-bold border-2 uppercase" value={form.account_code} onChange={e => setField('account_code', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit Workflow Status</Label>
                <Select value={form.portal_status} onValueChange={v => setField('portal_status', v)}>
                  <SelectTrigger className="h-12 font-bold border-2"><SelectValue placeholder="Select starting status" /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="font-bold text-xs uppercase tracking-wider">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Administrative Notes</Label>
              <Textarea rows={4} className="border-2 font-medium" placeholder="Internal commentary or flags for this batch..." value={form.internal_notes} onChange={e => setField('internal_notes', e.target.value)} />
            </div>
            <div className="flex justify-between pt-8 border-t">
              <Button variant="outline" size="lg" className="gap-2 font-bold" onClick={() => setStep('upload')}>
                <ChevronLeft size={18} strokeWidth={3} /> Re-upload
              </Button>
              <Button size="lg" className="gap-2 font-black" onClick={() => { if (validateHeader()) setStep('review') }}>
                Run Data Validation <ChevronRight size={18} strokeWidth={3} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Review */}
      {step === 'review' && (
        <Card className="shadow-2xl border-primary/10">
          <CardHeader className="bg-primary/5 border-b py-6">
            <div className="flex items-center justify-between">
              <CardTitle>Correlation Review</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-background font-black text-[10px]">{fileEntries.length} SOURCES</Badge>
                <Badge className="font-black text-[10px]">{totalRows} RECORDS</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-muted/30 rounded-2xl border-2 border-primary/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Invoice</p>
                <p className="text-xl font-black font-mono">{form.invoice_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Invoiced Date</p>
                <p className="text-xl font-bold">{form.invoice_date || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Due Date</p>
                <p className="text-xl font-bold text-muted-foreground">{form.due_date || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Valuation</p>
                <p className="text-xl font-black text-primary">{formatCurrency(parseFloat(form.total_amount) || 0)}</p>
              </div>
            </div>

            <Tabs defaultValue={fileEntries[0]?.file.name} className="space-y-4">
              <TabsList className="bg-muted p-1 h-auto gap-1 rounded-xl">
                {fileEntries.map(entry => (
                  <TabsTrigger key={entry.file.name} value={entry.file.name} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {entry.isPdf ? <FileText size={12} className="mr-2" /> : <FileSpreadsheet size={12} className="mr-2 text-emerald-600" />}
                    <span className="max-w-[120px] truncate">{entry.file.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {fileEntries.map(entry => {
                const previewCols = pickPreviewCols(entry.columns)
                return (
                  <TabsContent key={entry.file.name} value={entry.file.name}>
                    {entry.isPdf ? (
                      <div className="p-12 flex flex-col items-center justify-center bg-muted/20 rounded-2xl border-2 border-dashed gap-4">
                        <div className="p-4 bg-background rounded-full shadow-sm"><FileText size={32} className="text-muted-foreground" /></div>
                        <div className="text-center">
                          <p className="font-bold">{entry.file.name}</p>
                          <p className="text-xs text-muted-foreground">Digital Image - Ready for Document Store</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 overflow-hidden bg-background shadow-sm">
                        <Table>
                          <TableHeader className="bg-muted/50 border-b">
                            <tr>
                              {previewCols.map(col => <TableHead key={col} className="text-[10px] font-black uppercase tracking-tighter py-4">{col}</TableHead>)}
                              {entry.columns.length > 9 && <TableHead />}
                            </tr>
                          </TableHeader>
                          <TableBody>
                            {entry.rows.slice(0, 8).map((row, i) => (
                              <TableRow key={i} className="hover:bg-muted/10 transition-colors">
                                {previewCols.map(col => (
                                  <TableCell key={col} className="text-xs font-medium py-3">
                                    {(col.includes('Date') || col.includes('Hire')) ? formatDisplayDate(row[col]) : String(row[col] ?? '')}
                                  </TableCell>
                                ))}
                                {entry.columns.length > 9 && <TableCell className="text-[10px] font-bold text-muted-foreground">+More</TableCell>}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {entry.rows.length > 8 && <div className="p-4 bg-muted/20 text-[10px] font-black text-muted-foreground text-center border-t">Analyzing first 8 of {entry.rows.length} records...</div>}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>

            <div className="flex justify-between pt-8 border-t">
              <Button variant="outline" size="lg" className="gap-2 font-bold" onClick={() => setStep('header')}>
                <ChevronLeft size={18} strokeWidth={3} /> Metadata
              </Button>
              <Button size="lg" className="gap-2 font-black shadow-xl shadow-primary/20" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <><Loader2 size={18} className="animate-spin" strokeWidth={3} /> Synchronizing...</>
                ) : (
                  <>Finalize Batch ({fileEntries.length} Files) <CheckCircle2 size={18} strokeWidth={3} /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Confirm */}
      {step === 'confirm' && (
        <Card className="shadow-2xl border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="py-20 flex flex-col items-center text-center space-y-8">
            <div className="p-8 bg-emerald-500 rounded-full shadow-2xl shadow-emerald-500/40 text-white animate-bounce">
              <CheckCircle2 size={64} strokeWidth={3} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter">Synchronized Successfully</h2>
              <div className="space-y-1">
                <p className="text-lg font-bold text-emerald-800">Invoice {form.invoice_number} is now live.</p>
                <p className="text-sm text-muted-foreground">{totalRows} line items processed and {fileEntries.length} documents archived.</p>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              {createdId && (
                <Button size="lg" className="px-8 font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20" onClick={() => navigate(`/vendors/dcli/invoices/${createdId}/detail`)}>
                  View Audit Console
                </Button>
              )}
              <Button variant="outline" size="lg" className="px-8 font-bold" onClick={() => navigate('/vendors/dcli/invoices')}>
                Invoice Tracker
              </Button>
              <Button variant="ghost" size="lg" className="font-bold" onClick={() => { setStep('upload'); setFileEntries([]); setForm(EMPTY_FORM); setCreatedId(null); setDupWarning(null) }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
