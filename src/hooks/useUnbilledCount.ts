import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnbilledCount() {
  const [count, setCount] = useState(0)
  const [totalAtRisk, setTotalAtRisk] = useState(0)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('mg_data')
          .select('cust_rate_charge')
          .eq('unbilledflag', 'Y')
          .not('status', 'in', '("Cancelled","Void")')
        if (error) throw error
        const rows = data || []
        setCount(rows.length)
        setTotalAtRisk(rows.reduce((s, r) => s + (Number(r.cust_rate_charge) || 0), 0))
      } catch (err) {
        console.error('[useUnbilledCount] load failed:', err)
      }
    }
    fetch()
  }, [])

  return { count, totalAtRisk }
}
