import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CcmActivityRow } from '../types'

export function useCcmActivity() {
  return useQuery({
    queryKey: ['ccm_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ccm_activity')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      return (data || []) as CcmActivityRow[]
    }
  })
}
