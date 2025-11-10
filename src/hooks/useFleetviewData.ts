import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeChassisId } from "@/lib/utils";

export interface FleetviewData {
  id?: number;
  asset_id: string;
  vehicle: string;
  device_id: string;
  status: string;
  location: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  dwell_time: string;
  battery_status?: string;
  notes?: string;
  provider: string;
  lastUpdate: string;
}

interface FleetviewRawData {
  asset_id: string | null;
  device_serial_number: string | null;
  event_reason: string | null;
  landmark: string | null;
  address_city_state_zip_code: string | null;
  nearest_major_city: string | null;
  gps_time: string | null;
  report_time: string | null;
  days_dormant: number | null;
}

export const useFleetviewData = () => {
  return useQuery({
    queryKey: ["fleetview-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-ignore - forrest_assetlist_data table exists but not in generated types yet
        .from("forrest_assetlist_data")
        .select("*, _load_ts")
        .order("_load_ts", { ascending: false })
        .limit(100);

      if (error) throw error;

      return ((data as unknown as FleetviewRawData[]) || []).map((row): FleetviewData => ({
        asset_id: normalizeChassisId(row.asset_id),
        vehicle: normalizeChassisId(row.asset_id),
        device_id: row.device_serial_number || "N/A",
        status: row.event_reason || "N/A",
        location: row.landmark || row.nearest_major_city || "N/A",
        address: row.address_city_state_zip_code || "N/A",
        city: row.nearest_major_city || "N/A",
        state: "N/A",
        country: "N/A",
        latitude: 0,
        longitude: 0,
        speed: 0,
        timestamp: row.gps_time || row.report_time || "N/A",
        dwell_time: row.days_dormant ? `${row.days_dormant} days` : "N/A",
        notes: `Days dormant: ${row.days_dormant || 0}`,
        provider: 'Fleetview',
        lastUpdate: (row as any)._load_ts || "N/A",
      }));
    },
  });
};
