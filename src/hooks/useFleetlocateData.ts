import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FleetlocateData {
  chassisId: string;
  timestamp: string;
  location: string;
  coordinates: string;
  speed: string;
  notes: string;
}

interface FleetlocateRawData {
  id: string;
  battery_status: string | null;
  device: string | null;
  serial_number: string | null;
  asset_id: string | null;
  group: string | null;
  status: string | null;
  location: string | null;
  landmark: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: number | null;
  duration: string | null;
  last_event_date: string | null;
  inserted_at: string;
}

export const useFleetlocateData = () => {
  return useQuery({
    queryKey: ['fleetlocate-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-ignore - fleetlocate_daily_asset_report table exists but not in generated types yet
        .from('fleetlocate_daily_asset_report')
        .select('*')
        .order('inserted_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform the data to match GpsData interface
      const transformedData: FleetlocateData[] = ((data as unknown as FleetlocateRawData[]) || []).map((item) => ({
        chassisId: item.asset_id || 'N/A',
        timestamp: item.last_event_date || 'N/A',
        location: [item.address, item.city, item.state]
          .filter(Boolean)
          .join(', ') || item.location || 'N/A',
        coordinates: item.landmark || 'N/A',
        speed: item.duration || 'N/A',
        notes: `Status: ${item.status || 'N/A'}, Battery: ${item.battery_status || 'N/A'}`,
      }));

      return transformedData;
    },
  });
};
