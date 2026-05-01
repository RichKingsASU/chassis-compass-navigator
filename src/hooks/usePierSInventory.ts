import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PierSInventoryRow {
  equipment_number: string | null;
  equipment_type: string | null;
  size: string | null;
  customer_code: string | null;
  load_type: string | null;
  last_carrier: string | null;
  last_carrier_name: string | null;
  booking_number: string | null;
  days_on_site: number | null;
  last_ingate_datetime: string | null;
  comment: string | null;
  gate_lane: string | null;
  license_number: string | null;
  matched_chassis: string | null;
  ld_num: string | null;
  so_num: string | null;
  customer_name: string | null;
  tms_status: string | null;
  drop_actual_date: string | null;
  actual_rc_date: string | null;
  inventory_status: string | null;
}

export function usePierSInventory() {
  const [inventory, setInventory] = useState<PierSInventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dataErr } = await supabase
        .from('v_pier_s_inventory_live')
        .select('*')
        .order('days_on_site', { ascending: false });
      if (dataErr) throw dataErr;
      setInventory((data as PierSInventoryRow[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Pier S inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { inventory, loading, error, refetch: fetchData };
}
