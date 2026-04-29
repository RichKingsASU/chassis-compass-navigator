import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface FreshnessEntry {
  refreshedAt: Date
  rowCount: number
  status: string
}

export function useDataFreshness() {
  const [freshness, setFreshness] = useState<Record<string, FreshnessEntry>>({})

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('data_refresh_log')
          .select('source_file, run_at, rows_processed, status')
          .order('run_at', { ascending: false })
          .limit(20)

        if (data && data.length > 0) {
          const map: Record<string, FreshnessEntry> = {}
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
          setFreshness(map)
        }
      } catch {
        // silently fail
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  return freshness
}
