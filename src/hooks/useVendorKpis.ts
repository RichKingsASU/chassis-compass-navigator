import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface VendorKpiData {
  totalBilled: number
  openAudits: number
  totalInvoices: number
  activityCount: number
}

export function useVendorKpis(vendorSlug: string, activityTable?: string, refreshKey: number = 0) {
  return useQuery({
    queryKey: ['vendor_kpis', vendorSlug, refreshKey],
    queryFn: async (): Promise<VendorKpiData> => {
      const [invoiceRes, activityRes] = await Promise.all([
        supabase
          .from('vendor_invoices')
          .select('invoice_amount, invoice_status')
          .eq('vendor_slug', vendorSlug),
        activityTable 
          ? supabase.from(activityTable).select('*', { count: 'exact', head: true })
          : Promise.resolve({ count: 0, error: null })
      ])

      if (invoiceRes.error) throw invoiceRes.error

      const invoices = invoiceRes.data || []
      const totalBilled = invoices.reduce((sum, r) => sum + (Number(r.invoice_amount) || 0), 0)
      const openAudits = invoices.filter(r => (r.invoice_status || '').toLowerCase() !== 'paid').length
      const totalInvoices = invoices.length
      const activityCount = activityRes.count || 0

      return {
        totalBilled,
        openAudits,
        totalInvoices,
        activityCount
      }
    }
  })
}
