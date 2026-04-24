import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DcliInvoiceInternal } from '../types'

export interface UseDcliInvoicesResult {
  invoices: DcliInvoiceInternal[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDcliInvoices(refreshKey: number = 0): UseDcliInvoicesResult {
  const [invoices, setInvoices] = useState<DcliInvoiceInternal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice_internal')
          .select(
            'id, invoice_number, invoice_date, billing_date, due_date, invoice_amount, invoice_balance, total_payments, dispute_pending, dispute_approved, portal_status, dispute_status, invoice_type'
          )
          .order('invoice_date', { ascending: false })
          .limit(2000)
        if (fetchErr) throw fetchErr
        if (cancelled) return

        const rows = (data ?? []) as DcliInvoiceInternal[]
        const seen = new Set<string>()
        const deduped = rows.filter((inv) => {
          if (!inv.invoice_number || inv.invoice_number === 'TOTAL') return false
          const key = inv.invoice_number
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setInvoices(deduped)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load invoices')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey, tick])

  return { invoices, loading, error, refresh: () => setTick((t) => t + 1) }
}
