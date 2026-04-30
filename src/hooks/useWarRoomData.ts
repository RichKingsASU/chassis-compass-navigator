import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { WarRoomChassis, WarRoomKPI, WarRoomStatus } from '@/types/warroom';

export function useWarRoomData() {
  const [chassisData, setChassisData] = useState<WarRoomChassis[]>([]);
  const [kpi, setKpi] = useState<WarRoomKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WarRoomStatus | 'all'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: kpiData, error: kpiErr } = await supabase
        .rpc('fn_warroom_kpi');
      if (kpiErr) throw kpiErr;
      if (kpiData && kpiData.length > 0) setKpi(kpiData[0] as WarRoomKPI);

      let query = supabase
        .from('v_warroom_chassis')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(2000);

      if (statusFilter !== 'all') {
        query = query.eq('war_room_status', statusFilter);
      }

      const { data, error: dataErr } = await query;
      if (dataErr) throw dataErr;
      setChassisData((data as WarRoomChassis[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load war room data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { chassisData, kpi, loading, error, statusFilter, setStatusFilter, refetch: fetchData };
}
