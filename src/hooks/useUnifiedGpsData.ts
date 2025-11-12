import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeChassisId } from "@/lib/utils";
import { useFleetlocateData } from "./useFleetlocateData";
import { useAnytrekData } from "./useAnytrekData";
import { useFleetviewData } from "./useFleetviewData";

export interface UnifiedGpsData {
  chassisId: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  equipmentType: string;
  provider: string;
  timestamp: string;
  lastUpdate: string;
  freshnessMinutes: number;
  speed?: number;
  notes?: string;
}

interface ChassisMasterData {
  forrest_chz_id: string;
  status: string;
  equipment_type: string;
}

export const useUnifiedGpsData = () => {
  // Fetch data from all three providers
  const { data: fleetlocateData = [], isLoading: fleetlocateLoading } = useFleetlocateData();
  const { data: anytrekData = [], isLoading: anytrekLoading } = useAnytrekData();
  const { data: fleetviewData = [], isLoading: fleetviewLoading } = useFleetviewData();

  // Fetch chassis master data
  const { data: chassisMaster = [], isLoading: chassisMasterLoading } = useQuery({
    queryKey: ['chassis-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chassis_master')
        .select('forrest_chz_id, status, equipment_type');

      if (error) throw error;
      return (data || []) as ChassisMasterData[];
    },
  });

  return useQuery({
    queryKey: ['unified-gps-data', fleetlocateData, anytrekData, fleetviewData, chassisMaster],
    queryFn: async () => {
      const now = new Date();
      const unifiedMap = new Map<string, UnifiedGpsData>();

      // Helper to calculate freshness in minutes
      const calculateFreshness = (timestamp: string): number => {
        const dataTime = new Date(timestamp);
        return Math.floor((now.getTime() - dataTime.getTime()) / (1000 * 60));
      };

      // Helper to get the most recent data
      const addOrUpdateData = (item: UnifiedGpsData) => {
        const existing = unifiedMap.get(item.chassisId);
        if (!existing || new Date(item.lastUpdate) > new Date(existing.lastUpdate)) {
          unifiedMap.set(item.chassisId, item);
        }
      };

      // Process Fleetlocate data
      fleetlocateData.forEach((item) => {
        const chassisId = normalizeChassisId(item.chassisId);
        if (chassisId && chassisId !== 'N/A') {
          addOrUpdateData({
            chassisId,
            location: item.location,
            latitude: 0, // Fleetlocate doesn't have lat/lon in current structure
            longitude: 0,
            status: 'Unknown',
            equipmentType: 'Unknown',
            provider: 'Fleetlocate',
            timestamp: item.timestamp,
            lastUpdate: item.lastUpdate,
            freshnessMinutes: calculateFreshness(item.lastUpdate),
            notes: item.notes,
          });
        }
      });

      // Process Anytrek data
      anytrekData.forEach((item) => {
        const chassisId = normalizeChassisId(item.vehicle);
        if (chassisId && chassisId !== 'N/A') {
          addOrUpdateData({
            chassisId,
            location: item.location,
            latitude: item.latitude,
            longitude: item.longitude,
            status: 'Unknown',
            equipmentType: 'Unknown',
            provider: 'Anytrek',
            timestamp: item.timestamp,
            lastUpdate: item.lastUpdate,
            freshnessMinutes: calculateFreshness(item.lastUpdate),
            speed: item.speed,
            notes: item.notes,
          });
        }
      });

      // Process Fleetview data
      fleetviewData.forEach((item) => {
        const chassisId = normalizeChassisId(item.asset_id);
        if (chassisId && chassisId !== 'N/A') {
          addOrUpdateData({
            chassisId,
            location: item.location,
            latitude: item.latitude,
            longitude: item.longitude,
            status: 'Unknown',
            equipmentType: 'Unknown',
            provider: 'Fleetview',
            timestamp: item.timestamp,
            lastUpdate: item.lastUpdate,
            freshnessMinutes: calculateFreshness(item.lastUpdate),
            speed: item.speed,
            notes: item.notes,
          });
        }
      });

      // Create a lookup map for chassis master data
      const chassisMasterMap = new Map(
        chassisMaster.map((item) => [
          normalizeChassisId(item.forrest_chz_id),
          { status: item.status, equipmentType: item.equipment_type }
        ])
      );

      // Enrich unified data with chassis master information
      const enrichedData = Array.from(unifiedMap.values()).map((item) => {
        const masterData = chassisMasterMap.get(item.chassisId);
        return {
          ...item,
          status: masterData?.status || item.status,
          equipmentType: masterData?.equipmentType || item.equipmentType,
        };
      });

      return enrichedData;
    },
    enabled: !fleetlocateLoading && !anytrekLoading && !fleetviewLoading && !chassisMasterLoading,
  });
};
