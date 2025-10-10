import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Calendar, Truck, Package } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Asset {
  id: string;
  identifier: string;
  type: string;
  asset_class: string;
  length: number;
  width: number;
  height: number;
}

interface LocationHistory {
  id: number;
  recorded_at: string;
  location: any;
  normalized_address: string;
  velocity_cms: number;
  altitude_m: number;
}

interface TMSData {
  chassis_number: string;
  container_number: string;
  pickup_loc_name: string;
  delivery_loc_name: string;
  status: string;
  created_date: string;
  mbl: string;
  so_num: string;
}

const ChassisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [tmsData, setTMSData] = useState<TMSData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChassisData();
    }
  }, [id]);

  useEffect(() => {
    if (locationHistory.length > 0 && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [locationHistory]);

  const fetchChassisData = async () => {
    try {
      setLoading(true);

      // Fetch asset details
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (assetError) throw assetError;
      setAsset(assetData);

      // Fetch location history
      const { data: locationsData, error: locationsError } = await supabase
        .from('asset_locations')
        .select('*')
        .eq('asset_id', id)
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (locationsError) throw locationsError;
      setLocationHistory(locationsData || []);

      // Fetch TMS data (matching by chassis identifier)
      if (assetData?.identifier) {
        const { data: tmsDataResult, error: tmsError } = await supabase
          .from('mg_tms')
          .select('*')
          .eq('chassis_norm', assetData.identifier)
          .order('created_date', { ascending: false })
          .limit(50);

        if (tmsError) console.error('TMS error:', tmsError);
        setTMSData(tmsDataResult || []);
      }

    } catch (error) {
      console.error('Error fetching chassis data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load chassis information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || locationHistory.length === 0) return;

    // TODO: Replace with actual Mapbox token from Supabase secrets
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNscHd5eTJtcDBiMGMyanBqaWY3NTJ5aGQifQ.8ZqDLLjKE6v6E9sKqKqLQQ';

    const coordinates = locationHistory
      .filter(loc => loc.location?.coordinates)
      .map(loc => ({
        lng: loc.location.coordinates[0],
        lat: loc.location.coordinates[1],
        timestamp: loc.recorded_at
      }));

    if (coordinates.length === 0) return;

    // Calculate bounds
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend([coord.lng, coord.lat]);
    }, new mapboxgl.LngLatBounds(
      [coordinates[0].lng, coordinates[0].lat],
      [coordinates[0].lng, coordinates[0].lat]
    ));

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      bounds: bounds,
      fitBoundsOptions: { padding: 50 }
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for each location
    coordinates.forEach((coord, index) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = index === 0 ? '#ef4444' : '#3b82f6';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';

      new mapboxgl.Marker(el)
        .setLngLat([coord.lng, coord.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div class="p-2"><strong>${format(new Date(coord.timestamp), 'PPpp')}</strong></div>`)
        )
        .addTo(map.current!);
    });

    // Draw route line
    map.current.on('load', () => {
      map.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates.map(c => [c.lng, c.lat]).reverse()
          }
        }
      });

      map.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.6
        }
      });
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading chassis data...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <div className="text-lg">Chassis not found</div>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chassis {asset.identifier}</h1>
            <p className="text-muted-foreground">{asset.type} - {asset.asset_class}</p>
          </div>
        </div>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={mapContainer} className="w-full h-[400px] rounded-lg" />
            {locationHistory.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No location history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chassis Details */}
        <Card>
          <CardHeader>
            <CardTitle>Chassis Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">{asset.type || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Class</div>
                <div className="font-medium">{asset.asset_class || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Length</div>
                <div className="font-medium">{asset.length ? `${asset.length} ft` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dimensions</div>
                <div className="font-medium">
                  {asset.width && asset.height ? `${asset.width}x${asset.height}` : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Tables */}
        <Tabs defaultValue="locations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" />
              Location History ({locationHistory.length})
            </TabsTrigger>
            <TabsTrigger value="tms" className="gap-2">
              <Truck className="h-4 w-4" />
              TMS Data ({tmsData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Speed (mph)</TableHead>
                        <TableHead>Altitude (m)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationHistory.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell>
                            {format(new Date(location.recorded_at), 'PPpp')}
                          </TableCell>
                          <TableCell className="max-w-md">
                            {location.normalized_address || 
                              (location.location?.coordinates 
                                ? `${location.location.coordinates[1].toFixed(4)}, ${location.location.coordinates[0].toFixed(4)}`
                                : 'N/A')}
                          </TableCell>
                          <TableCell>
                            {location.velocity_cms 
                              ? (location.velocity_cms * 0.0223694).toFixed(1)
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {location.altitude_m?.toFixed(1) || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tms">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Container</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>BOL</TableHead>
                        <TableHead>SO#</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tmsData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No TMS data available for this chassis
                          </TableCell>
                        </TableRow>
                      ) : (
                        tmsData.map((tms, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {tms.created_date ? format(new Date(tms.created_date), 'PP') : 'N/A'}
                            </TableCell>
                            <TableCell>{tms.container_number || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {tms.pickup_loc_name || 'N/A'}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {tms.delivery_loc_name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tms.status === 'Completed' ? 'default' : 'secondary'}>
                                {tms.status || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{tms.mbl || 'N/A'}</TableCell>
                            <TableCell>{tms.so_num || 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ChassisDetail;
