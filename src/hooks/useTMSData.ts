import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TMSDataItem {
  id: string;
  shipment_number?: string;
  container_number?: string;
  chassis_number?: string;
  carrier_name?: string;
  carrier_scac_code?: string;
  status?: string;
  pickup_city?: string;
  pickup_state?: string;
  delivery_city?: string;
  delivery_state?: string;
  pickup_actual_date?: string;
  delivery_actual_date?: string;
  pickup_appmt_start?: string;
  delivery_appmt_start?: string;
  cust_invoice_charge?: string;
  carrier_invoice_charge?: string;
  mbl?: string;
  vessel_name?: string;
  customer_name?: string;
  service?: string;
  transport_type?: string;
}

export interface TMSFiltersState {
  source: string;
  type: string;
  status: string;
  searchTerm?: string;
}

export const useTMSData = (filters?: TMSFiltersState, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['tms-data', filters, page, pageSize],
    queryFn: async () => {
      // @ts-ignore - tms_mg table exists but not in generated types yet
      let query = supabase.from('tms_mg').select('*', { count: 'exact' });

      // Apply filters
      if (filters?.status && filters.status !== '') {
        query = query.ilike('status', `%${filters.status}%`);
      }

      if (filters?.searchTerm && filters.searchTerm !== '') {
        query = query.or(`shipment_number.ilike.%${filters.searchTerm}%,container_number.ilike.%${filters.searchTerm}%,chassis_number.ilike.%${filters.searchTerm}%,id.ilike.%${filters.searchTerm}%`);
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      query = query
        .range(startIndex, startIndex + pageSize - 1)
        .order('created_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as TMSDataItem[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
  });
};
