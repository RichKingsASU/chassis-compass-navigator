import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FreshnessEntry {
  refreshedAt: Date
  rowCount: number
  status: string
  fallback?: boolean
}

export function useDataFreshness() {
  const [freshness, setFreshness] = useState<Record<string, FreshnessEntry>>({})

  useEffect(() => {
    async function load() {
      const map: Record<string, FreshnessEntry> = {}
      try {
        const { data } = await supabase
          .from('data_refresh_log')
          .select('source_file, run_at, rows_processed, status')
          .order('run_at', { ascending: false })
          .limit(20)

        if (data && data.length > 0) {
          for (const row of data) {
            const key = row.source_file || 'unknown'
            if (!map[key]) {
              map[key] = {
                refreshedAt: new Date(row.run_at),
                rowCount: row.rows_processed ?? 0,
                status: row.status ?? 'unknown',
              }
            }
          }
        }
      } catch {
        // silently fail
      }

      if (!map.mg_data) {
        try {
          const { data: mgFallback } = await supabase
            .from('mg_data')
            .select('updated_at')
            .order('updated_at', { ascending: false })
            .limit(1)
          const row = mgFallback?.[0] as { updated_at?: string } | undefined
          if (row?.updated_at) {
            map.mg_data = {
              refreshedAt: new Date(row.updated_at),
              rowCount: 0,
              status: 'ok',
              fallback: true,
            }
          }
        } catch {
          // silently fail
        }
      }

      setFreshness(map)
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  return freshness
}
