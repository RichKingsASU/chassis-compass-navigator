import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseInvoiceDataOptions {
  table: string
  provider?: string
}

export function useInvoiceData<T = Record<string, unknown>>({ table, provider }: UseInvoiceDataOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from(table).select('*').order('created_at', { ascending: false })

      if (provider) {
        query = query.eq('provider', provider)
      }

      const { data: result, error: fetchError } = await query

      if (fetchError) throw fetchError
      setData((result as T[]) || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(message)
      console.error(`Error fetching from ${table}:`, err)
    } finally {
      setLoading(false)
    }
  }, [table, provider])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
