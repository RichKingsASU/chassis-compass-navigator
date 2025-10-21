import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GpsMapViewProps {
  providerName: string;
}

interface GpsPoint {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  geocoded_address?: string | null;
}

const containerStyle = {
  width: '100%',
  height: '600px'
};

const GpsMapView: React.FC<GpsMapViewProps> = ({ providerName }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  useEffect(() => {
    fetchApiKey();
    fetchGpsData();
  }, [providerName]);

  const fetchApiKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-maps-key');
      if (error) throw error;
      setApiKey(data.apiKey);
    } catch (error: any) {
      console.error('Error fetching Maps API key:', error);
      toast({
        title: "Error loading map",
        description: "Could not fetch Google Maps API key",
        variant: "destructive"
      });
    }
  };

  const fetchGpsData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gps_data')
        .select('*')
        .eq('provider', providerName)
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const points: GpsPoint[] = (data || []).map(record => ({
        id: record.id,
        device_id: record.device_id,
        latitude: parseFloat(String(record.latitude || 0)),
        longitude: parseFloat(String(record.longitude || 0)),
        recorded_at: record.recorded_at,
        geocoded_address: (record.raw_data as any)?.geocoded_address || null
      }));

      setGpsPoints(points);
    } catch (error: any) {
      console.error('Error fetching GPS data:', error);
      toast({
        title: "Error loading GPS data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Map View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gpsPoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Map View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[600px] text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No GPS data available to display on map</p>
            <p className="text-sm text-muted-foreground mt-2">Upload GPS data to see device locations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Map View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            Error loading Google Maps
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Map View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate map center based on GPS points
  const center = gpsPoints.length > 0 ? {
    lat: gpsPoints[0].latitude,
    lng: gpsPoints[0].longitude
  } : { lat: 0, lng: 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          GPS Map View ({gpsPoints.length} points)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        >
          {gpsPoints.map((point) => (
            <Marker
              key={point.id}
              position={{ lat: point.latitude, lng: point.longitude }}
              title={point.geocoded_address || `Device: ${point.device_id}`}
            />
          ))}
        </GoogleMap>
      </CardContent>
    </Card>
  );
};

export default GpsMapView;
