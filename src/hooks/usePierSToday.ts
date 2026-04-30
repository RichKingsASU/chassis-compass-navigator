import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PierSEvent {
  event_datetime: string | null;
  event_description: string | null;
  chassis_equipment_number: string | null;
  chassis_equipment_owner: string | null;
  container_equipment_number: string | null;
  pier_booking: string | null;
  loaded_empty: string | null;
  carrier_name: string | null;
  gate_lane: string | null;
  ld_num: string | null;
  so_num: string | null;
  customer_name: string | null;
  tms_status: string | null;
  match_status: string | null;
  drop_loc_name: string | null;
  pickup_loc_name: string | null;
}

export function usePierSToday() {
  const [events, setEvents] = useState<PierSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dataErr } = await supabase
        .from('v_pier_s_today')
        .select('*')
        .order('event_datetime', { ascending: false });
      if (dataErr) throw dataErr;
      setEvents((data as PierSEvent[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Pier S events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { events, loading, error, refetch: fetchData };
}
