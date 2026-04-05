import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FreshnessEntry {
  refreshedAt: Date
  rowCount: number | null
}

export type FreshnessMap = Record<string, FreshnessEntry>

export function useDataFreshness() {
  const [freshness, setFreshness] = useState<FreshnessMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('data_refresh_log')
          .select('table_name, refreshed_at, row_count')
          .order('refreshed_at', { ascending: false })
        if (error) {
          console.error('Failed to load data freshness:', error)
          return
        }
        const map: FreshnessMap = {}
        for (const row of data || []) {
          if (!map[row.table_name]) {
            map[row.table_name] = {
              refreshedAt: new Date(row.refreshed_at),
              rowCount: row.row_count,
            }
          }
        }
        setFreshness(map)
      } catch (err) {
        console.error('Failed to load data freshness:', err)
      } finally {
        setLoading(false)
      }
    }

    fetch()
    const interval = setInterval(fetch, 60_000)
    return () => clearInterval(interval)
  }, [])

  return { freshness, loading }
}
