import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TracActivityRow } from '../types'

export function useTracActivity() {
  return useQuery({
    queryKey: ['trac_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trac_activity')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      return (data || []) as TracActivityRow[]
    }
  })
}
