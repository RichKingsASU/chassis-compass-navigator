import { useEffect, useMemo, useState } from "react";
import { GoogleMap, LoadScript, Marker, MarkerClusterer } from "@react-google-maps/api";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedGpsData } from "@/hooks/useUnifiedGpsData";
import { Loader2 } from "lucide-react";

interface ChassisLocatorMapProps {
  data: UnifiedGpsData[];
  onMarkerClick?: (chassis: UnifiedGpsData) => void;
  selectedChassisId?: string | null;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 33.4484,
  lng: -112.074,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

const ChassisLocatorMap = ({ data, onMarkerClick, selectedChassisId }: ChassisLocatorMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { data: mapsKey, isLoading: keyLoading } = useQuery({
    queryKey: ["google-maps-key"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-maps-key");
      if (error) throw error;
      return data.apiKey as string;
    },
  });

  // Filter data to only include items with valid coordinates
  const validMarkers = useMemo(() => {
    return data.filter((item) => item.latitude !== 0 && item.longitude !== 0);
  }, [data]);

  // Calculate map center based on markers
  const mapCenter = useMemo(() => {
    if (validMarkers.length === 0) return defaultCenter;
    
    const avgLat = validMarkers.reduce((sum, m) => sum + m.latitude, 0) / validMarkers.length;
    const avgLng = validMarkers.reduce((sum, m) => sum + m.longitude, 0) / validMarkers.length;
    
    return { lat: avgLat, lng: avgLng };
  }, [validMarkers]);

  // Get marker color based on status
  const getMarkerIcon = (status: string) => {
    let color = "#9CA3AF"; // gray for unknown
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("available") || statusLower === "active") {
      color = "#22C55E"; // green
    } else if (statusLower.includes("in-use") || statusLower.includes("in use") || statusLower.includes("transit")) {
      color = "#3B82F6"; // blue
    } else if (statusLower.includes("out of service") || statusLower.includes("maintenance")) {
      color = "#EF4444"; // red
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 8,
    };
  };

  // Pan to selected marker when selection changes
  useEffect(() => {
    if (map && selectedChassisId) {
      const selected = validMarkers.find((m) => m.chassisId === selectedChassisId);
      if (selected) {
        map.panTo({ lat: selected.latitude, lng: selected.longitude });
        map.setZoom(15);
      }
    }
  }, [selectedChassisId, map, validMarkers]);

  if (keyLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mapsKey) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <p className="text-muted-foreground">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={mapsKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={validMarkers.length > 0 ? 10 : 7}
        options={mapOptions}
        onLoad={setMap}
      >
        <MarkerClusterer>
          {(clusterer) => (
            <>
              {validMarkers.map((chassis) => (
                <Marker
                  key={chassis.chassisId}
                  position={{ lat: chassis.latitude, lng: chassis.longitude }}
                  icon={getMarkerIcon(chassis.status)}
                  clusterer={clusterer}
                  onClick={() => onMarkerClick?.(chassis)}
                  animation={
                    selectedChassisId === chassis.chassisId
                      ? google.maps.Animation.BOUNCE
                      : undefined
                  }
                  title={`${chassis.chassisId} - ${chassis.status}`}
                />
              ))}
            </>
          )}
        </MarkerClusterer>
      </GoogleMap>
    </LoadScript>
  );
};

export default ChassisLocatorMap;
