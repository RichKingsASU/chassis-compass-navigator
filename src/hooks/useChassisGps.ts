import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ChassisGpsPoint {
  gps_source: string
  chassis_number: string
  landmark: string | null
  address: string | null
  latitude: number
  longitude: number
  gps_date: string | null
  dormant_days: number | null
  gps_status: string | null
  lessor: string | null
  reporting_category: string | null
  lease_rate_per_day: number | null
}

export function useChassisGps() {
  return useQuery({
    queryKey: ['chassis-gps'],
    queryFn: async (): Promise<ChassisGpsPoint[]> => {
      const { data, error } = await supabase
        .from('v_chassis_gps_mcl')
        .select(
          'gps_source, chassis_number, landmark, address, latitude, longitude, gps_date, dormant_days, gps_status, lessor, reporting_category, lease_rate_per_day'
        )
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (error) throw error
      return (data ?? []) as ChassisGpsPoint[]
    },
    refetchInterval: 5 * 60_000,
  })
}
