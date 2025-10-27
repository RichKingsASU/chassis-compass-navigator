import { GoogleMap, Marker, Polyline, LoadScript } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface LocationHistory {
  id: number;
  recorded_at: string;
  location: {
    coordinates: [number, number];
  };
}

interface FleetAsset {
  id: string;
  identifier: string;
  lat: number;
  lon: number;
  last_seen_at: string;
  last_address: string;
}

interface ChassisMapViewProps {
  locationHistory: LocationHistory[];
  currentChassisId?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

export const ChassisMapView = ({ locationHistory, currentChassisId }: ChassisMapViewProps) => {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Fetch API key from Supabase edge function
  const { data: apiKeyData, isLoading: isLoadingKey } = useQuery({
    queryKey: ['google-maps-key'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-maps-key');
      if (error) throw error;
      return data as { apiKey: string };
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Load all fleet assets for the map
  const loadFleetMarkers = async () => {
    try {
      // @ts-ignore - fleet.assets_for_map view
      const { data, error } = await supabase
        // @ts-ignore - fleet.assets_for_map view
        .from('fleet.assets_for_map')
        .select('*')
        .not('lat', 'is', null)
        .not('lon', 'is', null);

      if (error) {
        console.error('Error loading fleet markers:', error);
        return;
      }

      setFleetAssets((data as any) || []);
    } catch (err) {
      console.error('Failed to load fleet markers:', err);
    }
  };

  // Update GPS data by calling edge function
  const updateGps = async () => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('refreshLocation', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "GPS Updated",
        description: "Fleet locations have been refreshed",
      });

      await loadFleetMarkers();
    } catch (error) {
      console.error('Error updating GPS:', error);
      toast({
        title: "Update Failed",
        description: "Failed to refresh GPS data",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Load fleet markers on mount
  useEffect(() => {
    loadFleetMarkers();
  }, []);

  // Subscribe to realtime location updates
  useEffect(() => {
    const channel = supabase
      .channel('location-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'fleet',
          table: 'asset_locations'
        },
        (payload) => {
          console.log('New location received:', payload);
          // Reload markers when new location data arrives
          loadFleetMarkers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoadingKey) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Loading Google Maps...</p>
      </div>
    );
  }

  if (!apiKeyData?.apiKey) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-destructive/10 rounded-lg border border-destructive/20">
        <p className="text-destructive text-sm px-4">
          Google Maps API key not configured in Supabase secrets
        </p>
      </div>
    );
  }

  const coordinates = locationHistory
    .filter(loc => loc.location?.coordinates)
    .map(loc => ({
      lat: loc.location.coordinates[1],
      lng: loc.location.coordinates[0],
      time: loc.recorded_at
    }));

  const pathCoordinates = coordinates.map(coord => ({
    lat: coord.lat,
    lng: coord.lng
  }));

  const mapCenter = coordinates.length > 0
    ? coordinates[coordinates.length - 1]
    : fleetAssets.length > 0
    ? { lat: fleetAssets[0].lat, lng: fleetAssets[0].lon }
    : { lat: 33.7701, lng: -118.1937 };

  return (
    <LoadScript googleMapsApiKey={apiKeyData.apiKey}>
      <div className="relative">
        {/* Update GPS Button */}
        <div className="absolute top-2 left-2 z-10">
          <Button
            onClick={updateGps}
            disabled={isUpdating}
            size="sm"
            variant="secondary"
            className="shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            Update GPS
          </Button>
        </div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={10}
      options={{
        styles: [
          // Industry-optimized map style for logistics
          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
          {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#dadada" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }],
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
          {
            featureType: "transit.line",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }],
          },
          {
            featureType: "transit.station",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
        ],
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Route polyline */}
      {pathCoordinates.length > 1 && (
        <Polyline
          path={pathCoordinates}
          options={{
            strokeColor: '#2563eb',
            strokeOpacity: 0.8,
            strokeWeight: 3,
          }}
        />
      )}

      {/* Historical route markers for current chassis */}
      {coordinates.map((coord, index) => (
        <Marker
          key={`history-${index}`}
          position={{ lat: coord.lat, lng: coord.lng }}
          onClick={() => setSelectedMarker(`history-${index}`)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: index === coordinates.length - 1 ? '#16a34a' : '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: index === coordinates.length - 1 ? 8 : 6,
          }}
          title={`${new Date(coord.time).toLocaleString()}`}
        />
      ))}

      {/* Fleet asset markers */}
      {fleetAssets.map((asset) => {
        const isCurrentChassis = asset.identifier === currentChassisId;
        return (
          <Marker
            key={asset.id}
            position={{ lat: asset.lat, lng: asset.lon }}
            onClick={() => setSelectedMarker(asset.id)}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: isCurrentChassis ? '#f59e0b' : '#10b981',
              fillOpacity: isCurrentChassis ? 1 : 0.7,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: isCurrentChassis ? 7 : 5,
            }}
            title={`${asset.identifier}\n${asset.last_address || 'Unknown location'}\n${new Date(asset.last_seen_at).toLocaleString()}`}
            label={isCurrentChassis ? {
              text: asset.identifier,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold'
            } : undefined}
          />
        );
      })}
      </GoogleMap>
      </div>
    </LoadScript>
  );
};
