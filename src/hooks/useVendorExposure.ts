import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface VendorExposureRow {
  vendor: string | null;
  line_items: number | null;
  chassis_count: number | null;
  total_billed: number | null;
  open_balance: number | null;
  avg_bill_days: number | null;
  max_bill_days: number | null;
  disputed_count: number | null;
  disputed_amount: number | null;
  latest_invoice: string | null;
}

export function useVendorExposure() {
  const [vendors, setVendors] = useState<VendorExposureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dataErr } = await supabase
        .from('v_vendor_perdiem_summary')
        .select('*')
        .order('total_billed', { ascending: false });
      if (dataErr) throw dataErr;
      setVendors((data as VendorExposureRow[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load vendor exposure');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { vendors, loading, error, refetch: fetchData };
}
