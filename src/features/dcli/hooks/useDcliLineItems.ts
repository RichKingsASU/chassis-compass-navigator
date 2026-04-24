import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DcliInternalLineItem } from '../types'

export interface UseDcliLineItemsResult {
  lineItems: DcliInternalLineItem[]
  loading: boolean
  error: string | null
}

export function useDcliLineItems(invoiceNumber: string | null | undefined): UseDcliLineItemsResult {
  const [lineItems, setLineItems] = useState<DcliInternalLineItem[]>([])
  const [loading, setLoading] = useState<boolean>(!!invoiceNumber)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!invoiceNumber) {
      setLineItems([])
      setLoading(false)
      setError(null)
      return
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_internal_line_item')
          .select('*')
          .eq('invoice', invoiceNumber)
          .limit(5000)
        if (fetchErr) throw fetchErr
        if (cancelled) return
        setLineItems((data ?? []) as DcliInternalLineItem[])
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load line items')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [invoiceNumber])

  return { lineItems, loading, error }
}
