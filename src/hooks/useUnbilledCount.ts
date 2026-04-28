import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnbilledCount() {
  const [count, setCount] = useState(0)
  const [totalAtRisk, setTotalAtRisk] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('v_unbilled_loads')
          .select('revenue_at_risk')

        if (error) throw error
        if (data) {
          setCount(data.length)
          setTotalAtRisk(
            data.reduce((s, r) => s + (Number(r.revenue_at_risk) || 0), 0)
          )
        }
      } catch {
        // silently fail
      }
    }
    load()
  }, [])

  return { count, totalAtRisk }
}
