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
  'Asset ID': string | null;
  'Group': string | null;
  'Status': string | null;
  'Duration': string | null;
  'Location': string | null;
  'Landmark': string | null;
  'Address': string | null;
  'City': string | null;
  'State': string | null;
  'Zip': string | null;
  'Last Event Date': string | null;
  'Serial Number': string | null;
  'Device': string | null;
  'Battery Status': string | null;
  '_load_ts': string;
  '_source_file': string | null;
}

export const useFleetlocateData = () => {
  return useQuery({
    queryKey: ['fleetlocate-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-ignore - fleetlocate_stg table exists but not in generated types yet
        .from('fleetlocate_stg')
        .select('*')
        .order('_load_ts', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform the data to match GpsData interface
      const transformedData: FleetlocateData[] = ((data as unknown as FleetlocateRawData[]) || []).map((item) => ({
        chassisId: item['Asset ID'] || 'N/A',
        timestamp: item['Last Event Date'] || 'N/A',
        location: [item['Address'], item['City'], item['State']]
          .filter(Boolean)
          .join(', ') || item['Location'] || 'N/A',
        coordinates: item['Landmark'] || 'N/A',
        speed: item['Duration'] || 'N/A',
        notes: `Status: ${item['Status'] || 'N/A'}, Battery: ${item['Battery Status'] || 'N/A'}`,
      }));

      return transformedData;
    },
  });
};
