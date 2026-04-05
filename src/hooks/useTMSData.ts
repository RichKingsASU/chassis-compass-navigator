import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TMSRecord {
  id: number
  ld_num: string | null
  so_num: string | null
  shipment_number: string | null
  chassis_number: string | null
  container_number: string | null
  pickup_actual_date: string | null
  delivery_actual_date: string | null
  carrier_name: string | null
  customer_name: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export function useTMSData(searchTerm?: string) {
  const [data, setData] = useState<TMSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchData = useCallback(
    async (page = 0, pageSize = 50) => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('mg_data')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (searchTerm) {
          query = query.or(
            `chassis_number.ilike.%${searchTerm}%,container_number.ilike.%${searchTerm}%,ld_num.ilike.%${searchTerm}%,so_num.ilike.%${searchTerm}%`
          )
        }

        const { data: result, error: fetchError, count } = await query

        if (fetchError) throw fetchError
        setData((result as TMSRecord[]) || [])
        setTotalCount(count || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch TMS data')
      } finally {
        setLoading(false)
      }
    },
    [searchTerm]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, totalCount, refetch: fetchData }
}
