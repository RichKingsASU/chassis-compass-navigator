import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnytrekData {
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
}

interface AnytrekRawData {
  device_id: string | null;
  vehicle: string | null;
  driving_status: string | null;
  landmark: string | null;
  address: string | null;
  state_province: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  speed_mph: number | null;
  last_location_utc: string | null;
  dwell_time: string | null;
  driving_direction: string | null;
}

export const useAnytrekData = () => {
  return useQuery({
    queryKey: ["anytrek-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-ignore - anytrek_data table exists but not in generated types yet
        .from("anytrek_data")
        .select("*")
        .order("_load_ts", { ascending: false })
        .limit(100);

      if (error) throw error;

      return ((data as unknown as AnytrekRawData[]) || []).map((row): AnytrekData => ({
        asset_id: row.device_id || "N/A",
        vehicle: row.vehicle || "N/A",
        device_id: row.device_id || "N/A",
        status: row.driving_status || "N/A",
        location: row.landmark || row.address || "N/A",
        address: row.address || "N/A",
        city: row.state_province || "N/A",
        state: row.state_province || "N/A",
        country: row.country || "N/A",
        latitude: row.lat ? Number(row.lat) : 0,
        longitude: row.lng ? Number(row.lng) : 0,
        speed: row.speed_mph ? Number(row.speed_mph) : 0,
        timestamp: row.last_location_utc || "N/A",
        dwell_time: row.dwell_time || "N/A",
        notes: `Speed: ${row.speed_mph || 0} mph, Direction: ${row.driving_direction || "N/A"}`,
      }));
    },
  });
};
