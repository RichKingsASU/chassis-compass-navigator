import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnbilledCount() {
  const [count, setCount] = useState(0)
  const [totalAtRisk, setTotalAtRisk] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, count: rowCount, error } = await supabase
          .from('mg_tms')
          .select('cust_rate_charge', { count: 'exact' })
          .eq('unbilledflag', 'Y')
          .not('status', 'in', '("Cancelled","Void")')
        if (error) {
          console.error('Failed to load unbilled count:', error)
          return
        }
        setCount(rowCount || 0)
        const total = (data || []).reduce((s, r) => s + (Number(r.cust_rate_charge) || 0), 0)
        setTotalAtRisk(total)
      } catch (err) {
        console.error('Failed to load unbilled count:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { count, totalAtRisk, loading }
}
