import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface GpsSyncStatus {
  provider: string
  status: string
  assets_found: number | null
  repair_found: number | null
  rows_inserted: number | null
  completed_at: string | null
  error_message: string | null
  days_since_sync: number | null
}

export function useGpsSyncStatus() {
  const [statuses, setStatuses] = useState<GpsSyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('v_gps_sync_status')
      .select('*')
    if (err) {
      setError(err.message)
    } else {
      setStatuses(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const getStatus = (provider: string): GpsSyncStatus | null =>
    statuses.find(s => s.provider === provider) ?? null

  const isStale = (provider: string, days = 3): boolean => {
    const s = getStatus(provider)
    if (!s || s.days_since_sync === null) return true
    return s.days_since_sync > days
  }

  return { statuses, loading, error, refetch: fetch, getStatus, isStale }
}
