import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WccpActivityRow } from '../types'

export function useWccpActivity() {
  return useQuery({
    queryKey: ['wccp_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wccp_activity')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      return (data || []) as WccpActivityRow[]
    }
  })
}
