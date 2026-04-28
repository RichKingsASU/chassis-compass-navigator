import { supabase } from '@/lib/supabase'
import type { DcliInternalLineItem } from '../types'
import { useQuery } from '@tanstack/react-query'

export function useDcliLineItems(
  invoiceNumber: string | null | undefined
) {
  return useQuery({
    queryKey: ['dcli_internal_line_item', invoiceNumber],
    queryFn: async () => {
      if (!invoiceNumber) return []
      const { data, error } = await supabase
        .from('dcli_internal_line_item')
        .select('*')
        .eq('invoice', invoiceNumber)
        .limit(5000)
      if (error) throw error
      return (data ?? []) as DcliInternalLineItem[]
    },
    enabled: !!invoiceNumber
  })
}
