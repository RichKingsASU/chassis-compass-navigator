import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnbilledCount() {
  const [count, setCount] = useState(0)
  const [totalAtRisk, setTotalAtRisk] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('mg_data')
          .select('customer_rate_amount, customer_inv_amount')
          .not('status', 'in', '("Cancelled","Void")')
          .neq('zero_rev', 'Y')
        if (data) {
          const unbilled = data.filter(r => {
            const rate = parseFloat(r.customer_rate_amount) || 0
            const inv = parseFloat(r.customer_inv_amount) || 0
            return rate > 0 && inv === 0
          })
          setCount(unbilled.length)
          setTotalAtRisk(unbilled.reduce((s, r) => s + (parseFloat(r.customer_rate_amount) || 0), 0))
        }
      } catch {
        // silently fail
      }
    }
    load()
  }, [])

  return { count, totalAtRisk }
}
