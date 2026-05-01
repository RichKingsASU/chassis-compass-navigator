import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface OpportunityLostChassisRow {
  chassis_number: string
  chassis_type: string | null
  lessor: string | null
  region: string | null
  days_idle: number | null
  idle_lease_cost: number | null
  lease_rate_per_day: number | null
  last_activity_date: string | null
  utilization_status: string | null
  acct_mgr_name: string | null
  container_number: string | null
  ld_num: string | null
}

export interface OpportunityLostDailyRow {
  idle_since_date: string
  chassis_count: number
  total_idle_cost: number
  avg_days_idle: number
  lessors: string | null
}

export function useOpportunityLost() {
  const [dailyData, setDailyData] = useState<OpportunityLostDailyRow[]>([])
  const [chassisData, setChassisData] = useState<OpportunityLostChassisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dailyRes, chassisRes] = await Promise.all([
        supabase
          .from('v_opportunity_lost_daily')
          .select('*')
          .order('idle_since_date', { ascending: true }),
        supabase
          .from('v_opportunity_lost')
          .select('*')
          .order('idle_lease_cost', { ascending: false }),
      ])

      if (dailyRes.error) throw dailyRes.error
      if (chassisRes.error) throw chassisRes.error

      setDailyData((dailyRes.data ?? []) as OpportunityLostDailyRow[])
      setChassisData((chassisRes.data ?? []) as OpportunityLostChassisRow[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load opportunity lost data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { dailyData, chassisData, loading, error, refetch: fetchAll }
}
