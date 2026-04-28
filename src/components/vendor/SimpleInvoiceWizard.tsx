import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { parseExcelFile } from '@/utils/excelParser'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ChevronLeft,
  Search,
  Database
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type Step = 'upload' | 'header' | 'review' | 'confirm'

export interface ParsedFileEntry {
  file: File
  isPdf: boolean
  columns: string[]
  rows: Record<string, unknown>[]
}

export interface HeaderForm {
  invoice_number: string
  invoice_date: string
  total_amount: string
  notes: string
}

export interface SaveContext {
  header: HeaderForm
  files: ParsedFileEntry[]
  uploaded: { entry: ParsedFileEntry; path: string; ext: string }[]
  userEmail: string | null
}

export interface SimpleInvoiceWizardProps {
  vendorName: string
  vendorPath: string
  storageBucket: string
  invoiceTable: string
  invoiceNumberColumn?: string
  /** Insert the invoice header row. Receives uploaded paths and parsed files. Must return new invoice id. */
  insertHeader: (ctx: SaveContext) => Promise<string>
  /** Optional: insert parsed line item rows. Called once per file containing rows. */
  insertLineItems?: (invoiceId: string, ctx: SaveContext) => Promise<void>
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Files' },
  { key: 'header', label: 'Details' },
  { key: 'review', label: 'Verify' },
  { key: 'confirm', label: 'Done' },
]

const EMPTY_FORM: HeaderForm = {
  invoice_number: '',
  invoice_date: '',
  total_amount: '',
  notes: '',
}

interface FileEntryState extends ParsedFileEntry {
  error: string | null
  parsing: boolean
}

function toDateStr(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') {
    const d = new Date(v)
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10)
  return ''
}

function formatDisplayDate(v: unknown): string {
  const s = toDateStr(v)
  if (!s) return String(v ?? '')
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function autoFillHeader(rows: Record<string, unknown>[]): Partial<HeaderForm> {
  if (!rows.length) return {}
  const r = rows[0]
  const num =
    r['Invoice Number'] ?? r['Invoice #'] ?? r['Invoice No'] ??
    r['Summary Invoice Number'] ?? r['InvoiceNumber'] ?? ''
  const date = r['Invoice Date'] ?? r['Billing Date'] ?? r['Date']
  return {
    invoice_number: String(num ?? ''),
    invoice_date: toDateStr(date),
  }
}

export default function SimpleInvoiceWizard({
  vendorName,
  vendorPath,
  storageBucket,
  invoiceTable,
  invoiceNumberColumn = 'invoice_number',
  insertHeader,
  insertLineItems,
}: SimpleInvoiceWizardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [form, setForm] = useState<HeaderForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof HeaderForm, string>>>({})
  const [fileEntries, setFileEntries] = useState<FileEntryState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [dupWarning, setDupWarning] = useState<string | null>(null)
  const [checkingDup, setCheckingDup] = useState(false)

  function setField(f: keyof HeaderForm, v: string) {
    setForm(prev => ({ ...prev, [f]: v }))
    setFormErrors(prev => ({ ...prev, [f]: undefined }))
    if (f === 'invoice_number') setDupWarning(null)
  }

  function validateHeader(): boolean {
    const e: Partial<Record<keyof HeaderForm, string>> = {}
    if (!form.invoice_number.trim()) e.invoice_number = 'Required'
    if (!form.invoice_date) e.invoice_date = 'Required'
    if (!form.total_amount || isNaN(parseFloat(form.total_amount))) e.total_amount = 'Invalid amount'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  async function checkDuplicate(invoiceNumber: string) {
    if (!invoiceNumber.trim()) return
    setCheckingDup(true)
    setDupWarning(null)
    try {
      const { data } = await supabase
        .from(invoiceTable)
        .select('id, created_at')
        .eq(invoiceNumberColumn, invoiceNumber.trim())
        .limit(1)
      if (data && data.length > 0) {
        const date = new Date(data[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        setDupWarning(`Invoice ${invoiceNumber} already exists (uploaded ${date}).`)
      }
    } finally {
      setCheckingDup(false)
    }
  }

  const processFile = useCallback(async (f: File): Promise<FileEntryState> => {
    const isPdf = f.name.toLowerCase().endsWith('.pdf')
    if (isPdf) return { file: f, isPdf: true, columns: [], rows: [], error: null, parsing: false }
    try {
      const sheets = await parseExcelFile(f)
      const first = sheets[0]
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

  function removeFile(name: string) {
    setFileEntries(prev => prev.filter(e => e.file.name !== name))
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email ?? null

      // Duplicate check
      const { data: dupCheck } = await supabase
        .from(invoiceTable)
        .select('id')
        .eq(invoiceNumberColumn, form.invoice_number.trim())
        .limit(1)
      if (dupCheck && dupCheck.length > 0) throw new Error(`Invoice ${form.invoice_number} already exists.`)

      const uploaded: SaveContext['uploaded'] = []
      for (const entry of fileEntries) {
        const ext = entry.file.name.split('.').pop()?.toLowerCase() ?? 'bin'
        const safeName = entry.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const safeInv = form.invoice_number.replace(/[^a-zA-Z0-9_-]/g, '_')
        const path = `${vendorPath}/${Date.now()}_${safeInv}_${safeName}`
        const { error: upErr } = await supabase.storage.from(storageBucket).upload(path, entry.file)
        if (upErr) throw new Error(`Upload failed for ${entry.file.name}: ${upErr.message}`)
        uploaded.push({ entry, path, ext })
      }

      const ctx: SaveContext = {
        header: { ...form, invoice_number: form.invoice_number.trim() },
        files: fileEntries,
        uploaded,
        userEmail,
      }

      const invoiceId = await insertHeader(ctx)
      if (insertLineItems) await insertLineItems(invoiceId, ctx)
      return invoiceId
    },
    onSuccess: (id) => {
      setCreatedId(id)
      setStep('confirm')
      queryClient.invalidateQueries({ queryKey: [invoiceTable] })
      toast.success(`${vendorName} invoice synchronized successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const stepIdx = STEPS.findIndex(s => s.key === step)
  const totalRows = fileEntries.reduce((sum, e) => sum + e.rows.length, 0)
  const anyParsing = fileEntries.some(e => e.parsing)
  const hasFiles = fileEntries.length > 0
  const hubPath = `/vendors/${vendorPath}`

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(hubPath)}
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={14} /> Back to {vendorName}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Onboard {vendorName} Invoice</h1>
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

      {step === 'upload' && (
        <Card className="shadow-xl">
          <CardHeader className="bg-muted/5 border-b py-6">
            <CardTitle>Resource Ingestion</CardTitle>
            <p className="text-sm text-muted-foreground">Ingest PDF summaries and data reports for {vendorName} processing.</p>
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
                    <p className="text-sm text-muted-foreground max-w-[300px]">Supports Excel extracts or PDF invoices for this vendor.</p>
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
                          {entry.isPdf ? 'DOC' : `${entry.rows.length} ROWS`}
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

      {step === 'header' && (
        <Card className="shadow-xl">
          <CardHeader className="bg-muted/5 border-b py-6">
            <CardTitle>Audit Metadata</CardTitle>
            <p className="text-sm text-muted-foreground">Define the core invoice parameters for {vendorName} tracking.</p>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice Reference #</Label>
                <div className="relative">
                  <Input placeholder="Reference ID" value={form.invoice_number} 
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
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Administrative Notes</Label>
              <Textarea rows={4} className="border-2 font-medium" placeholder="Internal commentary for this batch..." value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </div>
            <div className="flex justify-between pt-8 border-t">
              <Button variant="outline" size="lg" className="gap-2 font-bold" onClick={() => setStep('upload')}>
                <ChevronLeft size={18} strokeWidth={3} /> Re-upload
              </Button>
              <Button size="lg" className="gap-2 font-black" onClick={() => { if (validateHeader()) setStep('review') }}>
                Review Payload <ChevronRight size={18} strokeWidth={3} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card className="shadow-2xl">
          <CardHeader className="bg-primary/5 border-b py-6">
            <div className="flex items-center justify-between">
              <CardTitle>Data Integrity Review</CardTitle>
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
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Valuation</p>
                <p className="text-xl font-black text-primary">{formatCurrency(parseFloat(form.total_amount) || 0)}</p>
              </div>
            </div>

            <Tabs defaultValue={fileEntries[0]?.file.name} className="space-y-4">
              <TabsList className="bg-muted p-1 h-auto gap-1 rounded-xl">
                {fileEntries.map(entry => (
                  <TabsTrigger key={entry.file.name} value={entry.file.name} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg data-[state=active]:bg-background">
                    <span className="max-w-[120px] truncate">{entry.file.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {fileEntries.map(entry => (
                <TabsContent key={entry.file.name} value={entry.file.name}>
                  {entry.isPdf ? (
                    <div className="p-12 flex flex-col items-center justify-center bg-muted/20 rounded-2xl border-2 border-dashed gap-4 text-center">
                      <FileText size={32} className="text-muted-foreground opacity-30" />
                      <p className="text-sm font-medium text-muted-foreground">PDF Payload — Archival only</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 overflow-hidden bg-background shadow-sm max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-muted/50 border-b sticky top-0">
                          <tr>
                            {entry.columns.slice(0, 6).map(col => <TableHead key={col} className="text-[10px] font-black uppercase tracking-tighter py-4">{col}</TableHead>)}
                          </tr>
                        </TableHeader>
                        <TableBody>
                          {entry.rows.slice(0, 20).map((row, i) => (
                            <TableRow key={i} className="hover:bg-muted/10 transition-colors">
                              {entry.columns.slice(0, 6).map(col => (
                                <TableCell key={col} className="text-xs font-medium py-3">
                                  {col.toLowerCase().includes('date') ? formatDisplayDate(row[col]) : String(row[col] ?? '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-between pt-8 border-t">
              <Button variant="outline" size="lg" className="gap-2 font-bold" onClick={() => setStep('header')}>
                <ChevronLeft size={18} strokeWidth={3} /> Metadata
              </Button>
              <Button size="lg" className="gap-2 font-black shadow-xl shadow-primary/20" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <><Loader2 size={18} className="animate-spin" strokeWidth={3} /> Processing...</>
                ) : (
                  <>Finalize Batch <CheckCircle2 size={18} strokeWidth={3} /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card className="shadow-2xl border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="py-20 flex flex-col items-center text-center space-y-8">
            <div className="p-8 bg-emerald-500 rounded-full shadow-2xl shadow-emerald-500/40 text-white animate-bounce">
              <CheckCircle2 size={64} strokeWidth={3} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter">Synchronization Complete</h2>
              <p className="text-lg font-bold text-emerald-800">{vendorName} Invoice {form.invoice_number} is now in the audit pipeline.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="px-8 font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20" onClick={() => navigate(`/vendors/${vendorPath}/invoices`)}>
                Vendor Hub
              </Button>
              <Button variant="ghost" size="lg" className="font-bold" onClick={() => { setStep('upload'); setFileEntries([]); setForm(EMPTY_FORM); setCreatedId(null) }}>
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
