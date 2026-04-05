import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FreshnessRecord {
  refreshedAt: Date
  rowCount: number
}

export function useDataFreshness() {
  const [data, setData] = useState<Record<string, FreshnessRecord>>({})

  useEffect(() => {
    async function fetch() {
      try {
        const { data: rows } = await supabase
          .from('data_refresh_log')
          .select('table_name, refreshed_at, row_count')
          .order('refreshed_at', { ascending: false })
        if (!rows) return
        const map: Record<string, FreshnessRecord> = {}
        for (const row of rows) {
          if (!map[row.table_name]) {
            map[row.table_name] = {
              refreshedAt: new Date(row.refreshed_at),
              rowCount: row.row_count ?? 0,
            }
          }
        }
        setData(map)
      } catch (err) {
        console.error('[useDataFreshness] load failed:', err)
      }
    }
    fetch()
    const interval = setInterval(fetch, 60_000)
    return () => clearInterval(interval)
  }, [])

  return data
}
