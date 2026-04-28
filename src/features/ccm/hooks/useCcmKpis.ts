import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCcmKpis(refreshKey: number = 0) {
  return useQuery({
    queryKey: ['ccm_kpis', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select('invoice_amount, invoice_status')
        .eq('vendor_slug', 'ccm')

      if (error) throw error

      const totalBilled = data.reduce((sum, r) => sum + (Number(r.invoice_amount) || 0), 0)
      const openAudits = data.filter(r => (r.invoice_status || '').toLowerCase() !== 'paid').length
      const totalInvoices = data.length

      return {
        totalBilled,
        openAudits,
        totalInvoices,
      }
    }
  })
}
