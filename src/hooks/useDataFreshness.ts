import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FreshnessEntry {
  refreshedAt: Date
  rowCount: number
}

export function useDataFreshness() {
  const [freshness, setFreshness] = useState<Record<string, FreshnessEntry>>({})

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('data_refresh_log')
          .select('table_name, refreshed_at, row_count')
          .order('refreshed_at', { ascending: false })
        if (!data) return
        const map: Record<string, FreshnessEntry> = {}
        for (const row of data) {
          if (!map[row.table_name]) {
            map[row.table_name] = {
              refreshedAt: new Date(row.refreshed_at),
              rowCount: row.row_count ?? 0,
            }
          }
        }
        setFreshness(map)
      } catch {
        // table may not exist yet
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  return freshness
}
