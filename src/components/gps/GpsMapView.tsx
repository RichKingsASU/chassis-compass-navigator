import React, { useEffect, useState, useRef } from 'react';
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

const GpsMapView: React.FC<GpsMapViewProps> = ({ providerName }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKey();
    fetchGpsData();
  }, [providerName]);

  const fetchApiKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-maps-key');
      if (error) throw error;
      
      if (data?.apiKey) {
        setApiKey(data.apiKey);
      }
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

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey || mapLoaded) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    script.onerror = () => {
      toast({
        title: "Error loading map",
        description: "Failed to load Google Maps",
        variant: "destructive"
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current || gpsPoints.length === 0) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: gpsPoints[0].latitude, lng: gpsPoints[0].longitude },
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    googleMapRef.current = map;

    // Add markers for each GPS point
    gpsPoints.forEach((point) => {
      new google.maps.Marker({
        position: { lat: point.latitude, lng: point.longitude },
        map: map,
        title: point.geocoded_address || `Device: ${point.device_id}`,
      });
    });

    // Fit bounds to show all markers
    if (gpsPoints.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      gpsPoints.forEach(point => {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [mapLoaded, gpsPoints]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          GPS Map View ({gpsPoints.length} points)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} style={{ width: '100%', height: '600px' }} className="rounded-lg" />
      </CardContent>
    </Card>
  );
};

export default GpsMapView;
