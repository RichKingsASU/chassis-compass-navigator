import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.invoice_number.trim()) next.invoice_number = 'Invoice number is required'
    if (!form.invoice_date) next.invoice_date = 'Invoice date is required'
    if (!form.due_date) next.due_date = 'Due date is required'
    if (form.invoice_date && form.due_date && form.due_date < form.invoice_date) {
      next.due_date = 'Due date must be on or after invoice date'
    }
    const amount = parseFloat(form.invoice_amount)
    if (!form.invoice_amount || Number.isNaN(amount) || amount <= 0) {
      next.invoice_amount = 'Amount must be greater than 0'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
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
      toast.success(`Invoice ${form.invoice_number.trim()} added successfully`)
      setForm(EMPTY)
      setErrors({})
      onOpenChange(false)
      onCreated?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="invoice_number">Invoice Number *</Label>
            <Input
              id="invoice_number"
              value={form.invoice_number}
              onChange={e => update('invoice_number', e.target.value)}
              placeholder="INV-0001"
            />
            {errors.invoice_number && <p className="text-xs text-destructive">{errors.invoice_number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={form.invoice_date}
                onChange={e => update('invoice_date', e.target.value)}
              />
              {errors.invoice_date && <p className="text-xs text-destructive">{errors.invoice_date}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={e => update('due_date', e.target.value)}
              />
              {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="invoice_amount">Invoice Amount (USD) *</Label>
            <Input
              id="invoice_amount"
              type="number"
              min="0"
              step="0.01"
              value={form.invoice_amount}
              onChange={e => update('invoice_amount', e.target.value)}
              placeholder="0.00"
            />
            {errors.invoice_amount && <p className="text-xs text-destructive">{errors.invoice_amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.invoice_category} onValueChange={v => update('invoice_category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.invoice_status} onValueChange={v => update('invoice_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes / Remarks</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
