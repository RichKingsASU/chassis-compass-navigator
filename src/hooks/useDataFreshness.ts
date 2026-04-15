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
        // data_refresh_log may not exist locally — use mg_data updated_at as fallback
        const { data: mgData } = await supabase
          .from('mg_data')
          .select('updated_at', { count: 'exact', head: false })
          .order('updated_at', { ascending: false })
          .limit(1)

        if (mgData && mgData.length > 0) {
          setFreshness({
            mg_data: {
              refreshedAt: new Date(mgData[0].updated_at),
              rowCount: 0,
            },
          })
        }
      } catch {
        // silently fail — freshness bar will show "Never refreshed"
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  return freshness
}
