import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ScspaActivityRow } from '../types'

export function useScspaActivity() {
  return useQuery({
    queryKey: ['scspa_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scspa_activity')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      return (data || []) as ScspaActivityRow[]
    }
  })
}
