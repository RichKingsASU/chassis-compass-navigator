import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, DollarSign, Calendar, Tag, Info, Loader2, Save, X } from 'lucide-react'

export interface NewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorSlug: string
  onCreated?: () => void
}

const CATEGORIES = ['Per Diem', 'Damage', 'Flat Rate', 'Other'] as const
const STATUSES = ['Pending', 'Approved', 'Disputed', 'Paid'] as const

interface FormState {
  invoice_number: string
  invoice_date: string
  due_date: string
  invoice_amount: string
  invoice_category: string
  invoice_status: string
  notes: string
}

const EMPTY: FormState = {
  invoice_number: '',
  invoice_date: '',
  due_date: '',
  invoice_amount: '',
  invoice_category: 'Per Diem',
  invoice_status: 'Pending',
  notes: '',
}

export function NewInvoiceDialog({ open, onOpenChange, vendorSlug, onCreated }: NewInvoiceDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.invoice_number.trim()) next.invoice_number = 'Required'
    if (!form.invoice_date) next.invoice_date = 'Required'
    if (!form.due_date) next.due_date = 'Required'
    if (form.invoice_date && form.due_date && form.due_date < form.invoice_date) {
      next.due_date = 'Invalid date range'
    }
    const amount = parseFloat(form.invoice_amount)
    if (!form.invoice_amount || Number.isNaN(amount) || amount <= 0) {
      next.invoice_amount = 'Invalid amount'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vendor_invoices').insert({
        vendor_slug: vendorSlug.toLowerCase(),
        invoice_number: form.invoice_number.trim(),
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        invoice_amount: parseFloat(form.invoice_amount),
        invoice_category: form.invoice_category || null,
        invoice_status: form.invoice_status || 'Pending',
        notes: form.notes.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`Invoice ${form.invoice_number.trim()} synchronized successfully`)
      queryClient.invalidateQueries({ queryKey: ['vendor_invoices', vendorSlug] })
      setForm(EMPTY)
      setErrors({})
      onOpenChange(false)
      onCreated?.()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl" aria-describedby="new-invoice-description">
        <DialogHeader className="p-8 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-foreground/10 rounded-2xl">
              <FileText size={24} strokeWidth={3} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">Invoice Ingestion</DialogTitle>
              <DialogDescription id="new-invoice-description" className="text-primary-foreground/70 font-medium">
                Manual entry for {vendorSlug.toUpperCase()} audit tracking.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Info size={12} /> Reference Number
            </Label>
            <Input
              id="invoice_number"
              value={form.invoice_number}
              onChange={e => update('invoice_number', e.target.value)}
              placeholder="e.g. INV-10294"
              className={`h-12 text-lg font-black font-mono border-2 transition-all ${errors.invoice_number ? 'border-destructive' : 'focus:border-primary'}`}
            />
            {errors.invoice_number && <p className="text-[10px] text-destructive font-black uppercase tracking-widest">{errors.invoice_number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar size={12} /> Invoiced Date
              </Label>
              <Input
                type="date"
                value={form.invoice_date}
                className="h-12 font-bold border-2"
                onChange={e => update('invoice_date', e.target.value)}
              />
              {errors.invoice_date && <p className="text-[10px] text-destructive font-black uppercase tracking-widest">{errors.invoice_date}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar size={12} /> Maturity Date
              </Label>
              <Input
                type="date"
                value={form.due_date}
                className="h-12 font-bold border-2"
                onChange={e => update('due_date', e.target.value)}
              />
              {errors.due_date && <p className="text-[10px] text-destructive font-black uppercase tracking-widest">{errors.due_date}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <DollarSign size={12} /> Valuation (USD)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.invoice_amount}
              onChange={e => update('invoice_amount', e.target.value)}
              placeholder="0.00"
              className={`h-12 text-2xl font-black border-2 transition-all ${errors.invoice_amount ? 'border-destructive' : 'focus:border-primary'}`}
            />
            {errors.invoice_amount && <p className="text-[10px] text-destructive font-black uppercase tracking-widest">{errors.invoice_amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Tag size={12} /> Classification
              </Label>
              <Select value={form.invoice_category} onValueChange={v => update('invoice_category', v)}>
                <SelectTrigger className="h-12 font-bold border-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold text-[10px] uppercase tracking-widest">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Workflow
              </Label>
              <Select value={form.invoice_status} onValueChange={v => update('invoice_status', v)}>
                <SelectTrigger className="h-12 font-bold border-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="font-bold text-[10px] uppercase tracking-widest">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Contextual Notes
            </Label>
            <Textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Optional administrative context..."
              className="border-2 font-medium min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="p-8 bg-muted/30 border-t gap-4">
          <Button variant="ghost" className="font-bold h-12 px-8" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Abort
          </Button>
          <Button className="h-12 px-8 font-black shadow-xl shadow-primary/20 gap-2" onClick={() => { if (validate()) mutation.mutate() }} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={3} />}
            Commit Ingestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
