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
  'Device Id': string | null;
  'Vehicle': string | null;
  'Driving Status': string | null;
  'Landmark': string | null;
  'address': string | null;
  'state/province': string | null;
  'Country': string | null;
  'Lat': number | null;
  'Lng': number | null;
  'Speed(mp/h)': number | null;
  'Last Location(UTC)': string | null;
  'Dwell Time': string | null;
  'Driving Direction': string | null;
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
        asset_id: row["Device Id"] || "N/A",
        vehicle: row.Vehicle || "N/A",
        device_id: row["Device Id"] || "N/A",
        status: row["Driving Status"] || "N/A",
        location: row.Landmark || row.address || "N/A",
        address: row.address || "N/A",
        city: row["state/province"] || "N/A",
        state: row["state/province"] || "N/A",
        country: row.Country || "N/A",
        latitude: row.Lat ? Number(row.Lat) : 0,
        longitude: row.Lng ? Number(row.Lng) : 0,
        speed: row["Speed(mp/h)"] ? Number(row["Speed(mp/h)"]) : 0,
        timestamp: row["Last Location(UTC)"] || "N/A",
        dwell_time: row["Dwell Time"] || "N/A",
        notes: `Speed: ${row["Speed(mp/h)"] || 0} mph, Direction: ${row["Driving Direction"] || "N/A"}`,
      }));
    },
  });
};
