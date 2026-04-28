import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FlexivanActivityRow } from '../types'

export function useFlexivanActivity() {
  return useQuery({
    queryKey: ['flexivan_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flexivan_activity')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      return (data || []) as FlexivanActivityRow[]
    }
  })
}
