import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Activity, Upload, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import GpsMapView from './GpsMapView';

interface GpsDataPoint {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  recorded_at: string;
  battery_level: number | null;
  provider: string;
  chassis_id?: string;
  asset_id?: string;
  geocoded_address?: string | null;
}

interface GpsUploadRecord {
  id: string;
  provider: string;
  file_name: string;
  data_date: string;
  row_count: number;
  status: string;
  created_at: string;
}

interface GpsDashboardTabProps {
  providerName: string;
}

const getStatusBadge = (minutesAgo: number) => {
  if (minutesAgo < 5) {
    return <Badge variant="default">Active</Badge>;
  } else if (minutesAgo < 60) {
    return <Badge variant="secondary">Recent</Badge>;
  } else {
    return <Badge variant="destructive">Stale</Badge>;
  }
};

const GpsDashboardTab: React.FC<GpsDashboardTabProps> = ({ providerName }) => {
  const [gpsData, setGpsData] = useState<GpsDataPoint[]>([]);
  const [uploads, setUploads] = useState<GpsUploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [providerName]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent GPS data with chassis mapping
      // First get GPS data
      const { data: gpsDataResult, error: gpsError } = await supabase
        .from('gps_data')
        .select('*')
        .eq('provider', providerName)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (gpsError) throw gpsError;

      // Then enrich with chassis data via device mapping
      const enrichedGpsData: GpsDataPoint[] = [];
      
      for (const gpsPoint of (gpsDataResult || [])) {
        let chassisId = null;
        let assetId = null;

        if (gpsPoint.device_id) {
          // Look up device mapping
          const { data: mapping } = await supabase
            .from('blackberry_device_map')
            .select('asset_id, assets(identifier)')
            .eq('external_device_id', gpsPoint.device_id)
            .maybeSingle();

          if (mapping) {
            assetId = mapping.asset_id;
            chassisId = (mapping.assets as any)?.identifier || null;
          }
        }

        enrichedGpsData.push({
          ...gpsPoint,
          chassis_id: chassisId,
          asset_id: assetId,
          geocoded_address: (gpsPoint.raw_data as any)?.geocoded_address || null
        });
      }

      // Fetch recent uploads for this provider
      const { data: uploadsResult, error: uploadsError } = await supabase
        .from('gps_uploads')
        .select('*')
        .eq('provider', providerName)
        .order('created_at', { ascending: false })
        .limit(10);

      if (uploadsError) throw uploadsError;

      setGpsData(enrichedGpsData);
      setUploads(uploadsResult || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique devices and chassis
  const uniqueDevices = [...new Set(gpsData.map(d => d.device_id))].filter(Boolean);
  const mappedChassis = gpsData.filter(d => d.chassis_id).length;
  const unmappedDevices = uniqueDevices.length - [...new Set(gpsData.filter(d => d.chassis_id).map(d => d.device_id))].length;
  
  // Calculate statistics
  const totalDataPoints = gpsData.length;
  const totalUploads = uploads.length;
  const totalRowsUploaded = uploads.reduce((sum, u) => sum + (u.row_count || 0), 0);

  // Get most recent data point by device
  const latestByDevice = uniqueDevices.map(deviceId => {
    return gpsData.find(d => d.device_id === deviceId);
  }).filter(Boolean) as GpsDataPoint[];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GPS Map View */}
      <GpsMapView providerName={providerName} />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Devices Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDevices.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalDataPoints}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Total Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalUploads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Rows Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalRowsUploaded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent GPS Data */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Device Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {latestByDevice.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No GPS data available</p>
              <p className="text-sm mt-2">Upload GPS data to see device locations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis ID</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Battery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestByDevice.map((data) => {
                  const recordedAt = new Date(data.recorded_at);
                  const minutesAgo = Math.floor((Date.now() - recordedAt.getTime()) / 1000 / 60);
                  const timeAgo = minutesAgo < 1 ? 'Just now' : 
                                  minutesAgo < 60 ? `${minutesAgo}m ago` :
                                  minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)}h ago` :
                                  `${Math.floor(minutesAgo / 1440)}d ago`;

                  return (
                    <TableRow key={data.id}>
                      <TableCell className="font-medium">
                        {data.chassis_id || (
                          <span className="text-muted-foreground italic">Not Mapped</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {data.device_id || 'Unknown'}
                      </TableCell>
                      <TableCell>{getStatusBadge(minutesAgo)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {timeAgo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div className="space-y-0.5">
                            {data.geocoded_address ? (
                              <div className="text-sm font-medium">{data.geocoded_address}</div>
                            ) : null}
                            <div className="text-sm text-muted-foreground">
                              Lat: {typeof data.latitude === 'number' ? data.latitude.toFixed(6) : parseFloat(String(data.latitude || 0)).toFixed(6)}°
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Lon: {typeof data.longitude === 'number' ? data.longitude.toFixed(6) : parseFloat(String(data.longitude || 0)).toFixed(6)}°
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {data.speed !== null && data.speed !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            {typeof data.speed === 'number' ? data.speed.toFixed(1) : parseFloat(String(data.speed)).toFixed(1)} mph
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {data.battery_level !== null ? (
                          `${data.battery_level}%`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Data Date</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">{upload.file_name}</TableCell>
                    <TableCell>{format(new Date(upload.data_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{upload.row_count?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge variant={upload.status === 'completed' ? 'default' : 'secondary'}>
                        {upload.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(upload.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GpsDashboardTab;
