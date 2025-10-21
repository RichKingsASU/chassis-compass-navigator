import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Truck, Hammer, DollarSign, CheckCircle, Clock, XCircle, AlertTriangle, Lock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FinancialsTab from '@/components/chassis/FinancialsTab';
import { ChassisMapView } from '@/components/chassis/ChassisMapView';

interface Asset {
  id: string;
  identifier: string;
  type: string;
  asset_class: string;
  length: number;
  width: number;
  height: number;
  current_status: string;
  vin: string;
  make: string;
  model: string;
  updated_at: string;
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
  id: string;
  chassis_norm: string;
  container_number: string;
  pickup_loc_name: string;
  delivery_loc_name: string;
  status: string;
  created_date: string;
  mbl: string;
  so_num: string;
  ld_num: string;
  pickup_actual_date: string;
  delivery_actual_date: string;
  customer_name: string;
  carrier_name: string;
  miles: string;
}

interface Repair {
  id: string;
  timestamp_utc: string;
  cost_usd: number;
  description: string;
  repair_status: string;
}

const ChassisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [tmsData, setTMSData] = useState<TMSData[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);

  // Fetch Google Maps API key from Supabase edge function
  useEffect(() => {
    const fetchMapsKey = async () => {
      try {
        const response = await fetch(
          `https://fucvkmsaappphsvuabos.supabase.co/functions/v1/get-maps-key`,
          {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y3ZrbXNhYXBwcGhzdnVhYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mzg1OTcsImV4cCI6MjA3MzMxNDU5N30.zGnrRCzrWbFY-tvXjsb6nf9nVmRhqlEAcdtilRaJPxQ',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y3ZrbXNhYXBwcGhzdnVhYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mzg1OTcsImV4cCI6MjA3MzMxNDU5N30.zGnrRCzrWbFY-tvXjsb6nf9nVmRhqlEAcdtilRaJPxQ'
            }
          }
        );
        const data = await response.json();
        if (data?.apiKey) {
          setMapsApiKey(data.apiKey);
        }
      } catch (error) {
        console.error('Error fetching Maps API key:', error);
      }
    };
    fetchMapsKey();
  }, []);

  useEffect(() => {
    if (id) {
      fetchChassisData();
      subscribeToChanges();
    }

    return () => {
      // Cleanup subscription on unmount
    };
  }, [id]);

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('chassis-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assets',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setAsset(payload.new as Asset);
          toast({
            title: "Status Updated",
            description: "Chassis status has been updated",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchChassisData = async () => {
    try {
      setLoading(true);

      let assetData: Asset | null = null;
      const decodedId = decodeURIComponent(id || '');

      // Try to fetch from assets table first (by UUID or identifier)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
      
      if (isUuid) {
        // Look up by UUID
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('id', decodedId)
          .single();

        if (!error && data) {
          assetData = data;
        }
      } else {
        // Look up by identifier in assets table
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('identifier', decodedId)
          .maybeSingle();

        if (!error && data) {
          assetData = data;
        }
      }

      // If not found in assets, try MCL master chassis list
      if (!assetData) {
        const { data: mclData, error: mclError } = await supabase
          .from('mcl_master_chassis_list')
          .select('*')
          .eq('forrest_chz', decodedId)
          .maybeSingle();

        if (!mclError && mclData) {
          // Convert MCL data to Asset format
          assetData = {
            id: `mcl-${mclData.id}`,
            identifier: mclData.forrest_chz,
            type: mclData.forrest_chassis_type,
            asset_class: mclData.chassis_category,
            length: 0,
            width: 0,
            height: 0,
            current_status: mclData.chassis_status || 'Active',
            vin: mclData.serial || '',
            make: '',
            model: '',
            updated_at: new Date().toISOString()
          };
        }
      }

      if (!assetData) {
        throw new Error('Chassis not found');
      }

      setAsset(assetData);

      // Fetch location history (GPS) - only for real assets with UUIDs
      if (assetData.id && !assetData.id.startsWith('mcl-')) {
        console.log('Fetching GPS data for asset:', assetData.id);
        const { data: locationsData, error: locationsError } = await supabase
          .from('asset_locations')
          .select('*')
          .eq('asset_id', assetData.id)
          .order('recorded_at', { ascending: false })
          .limit(100);

        if (locationsError) {
          console.error('GPS error:', locationsError);
        } else {
          console.log('GPS data found:', locationsData?.length || 0, 'records');
        }
        setLocationHistory(locationsData || []);
      } else {
        console.log('Skipping GPS fetch - asset from MCL master list');
      }

      // Fetch TMS data - try multiple identifier fields for matching
      if (assetData?.identifier) {
        console.log('Fetching TMS data for chassis:', assetData.identifier);
        
        const { data: tmsDataResult, error: tmsError } = await supabase
          .from('mg_tms')
          .select('*')
          .eq('chassis_norm', assetData.identifier)
          .order('created_date', { ascending: false });

        if (tmsError) {
          console.error('TMS error:', tmsError);
        } else {
          console.log('TMS data found:', tmsDataResult?.length || 0, 'records');
        }
        setTMSData(tmsDataResult || []);
      }

      // Fetch repairs - only for real assets with UUIDs
      if (assetData.id && !assetData.id.startsWith('mcl-')) {
        const { data: repairsData, error: repairsError } = await supabase
          .from('repairs')
          .select('*')
          .eq('chassis_id', assetData.id)
          .order('timestamp_utc', { ascending: false });

        if (repairsError) console.error('Repairs error:', repairsError);
        setRepairs(repairsData || []);
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

  const handleStatusChange = async (newStatus: string) => {
    if (!asset) return;

    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update({ 
          current_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', asset.id);

      if (error) throw error;

      setAsset({ ...asset, current_status: newStatus });
      toast({
        title: "Status Updated",
        description: `Chassis status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update chassis status",
        variant: "destructive"
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Available': return 'secondary';
      case 'Out of Service': return 'destructive';
      case 'Reserved': return 'outline';
      case 'Maintenance': return 'secondary';
      case 'Retired': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4" />;
      case 'Available': return <CheckCircle className="h-4 w-4" />;
      case 'Out of Service': return <XCircle className="h-4 w-4" />;
      case 'Reserved': return <Lock className="h-4 w-4" />;
      case 'Maintenance': return <AlertTriangle className="h-4 w-4" />;
      case 'Retired': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRepairStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'In Progress': return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'Pending': return <Badge className="bg-amber-500">Pending</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
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

  const coordinates = locationHistory
    .filter(loc => loc.location?.coordinates)
    .map(loc => ({
      lat: loc.location.coordinates[1],
      lng: loc.location.coordinates[0],
      timestamp: loc.recorded_at,
      address: loc.normalized_address
    }));

  const center = coordinates.length > 0 ? coordinates[0] : { lat: 0, lng: 0 };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chassis Details: {asset.identifier}</h1>
              <p className="text-muted-foreground">VIN: {asset.vin || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(asset.current_status)} className="gap-1">
              {getStatusIcon(asset.current_status)}
              {asset.current_status}
            </Badge>
            <Select
              value={asset.current_status}
              onValueChange={handleStatusChange}
              disabled={statusUpdating}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Out of Service">Out of Service</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Core Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Chassis Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Make/Model</div>
                <div className="font-medium">{asset.make || 'N/A'} {asset.model || ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unit Number</div>
                <div className="font-medium">{asset.identifier || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">
                  {asset.updated_at ? format(new Date(asset.updated_at), 'PPp') : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type/Class</div>
                <div className="font-medium">{asset.type || 'N/A'} / {asset.asset_class || 'N/A'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="gps" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gps" className="gap-2">
              <MapPin className="h-4 w-4" />
              GPS
            </TabsTrigger>
            <TabsTrigger value="tms" className="gap-2">
              <Truck className="h-4 w-4" />
              TMS
            </TabsTrigger>
            <TabsTrigger value="repairs" className="gap-2">
              <Hammer className="h-4 w-4" />
              Repairs
            </TabsTrigger>
            <TabsTrigger value="financials" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financials
            </TabsTrigger>
          </TabsList>

          {/* GPS Tab */}
          <TabsContent value="gps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GPS Location History</CardTitle>
              </CardHeader>
              <CardContent>
                {mapsApiKey ? (
                  locationHistory.length > 0 ? (
                    <ChassisMapView 
                      apiKey={mapsApiKey} 
                      locationHistory={locationHistory} 
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center space-y-2">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">No GPS data available for this chassis</p>
                        <p className="text-sm text-muted-foreground">GPS tracking data will appear here once available</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Loading map...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Coordinates</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationHistory.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell>
                            {format(new Date(location.recorded_at), 'PPpp')}
                          </TableCell>
                          <TableCell className="max-w-md">
                            {location.normalized_address || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {location.location?.coordinates 
                              ? `${location.location.coordinates[1].toFixed(4)}, ${location.location.coordinates[0].toFixed(4)}`
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TMS Tab */}
          <TabsContent value="tms">
            <Card>
              <CardHeader>
                <CardTitle>Usage History by Load/Shipment Order</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Chassis usage organized by LD/SO numbers with dates
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tmsData.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No TMS usage data available for this chassis
                    </div>
                  ) : (
                    tmsData.map((tms) => (
                      <Card key={tms.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {/* Header with LD/SO and Status */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-lg">LD: {tms.ld_num || 'N/A'}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="font-semibold">SO: {tms.so_num || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={tms.status === 'Delivered' ? 'default' : 'secondary'}>
                                    {tms.status || 'Unknown'}
                                  </Badge>
                                  {tms.mbl && (
                                    <span className="text-xs text-muted-foreground">MBL: {tms.mbl}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Date Information */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Created</div>
                                <div className="text-sm font-medium">
                                  {tms.created_date ? format(new Date(tms.created_date), 'PP') : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Pickup</div>
                                <div className="text-sm font-medium">
                                  {tms.pickup_actual_date ? format(new Date(tms.pickup_actual_date), 'PP') : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-muted-foreground">Delivery</div>
                                <div className="text-sm font-medium">
                                  {tms.delivery_actual_date ? format(new Date(tms.delivery_actual_date), 'PP') : 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* Route Information */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Pickup:</span>
                                <span className="text-muted-foreground">{tms.pickup_loc_name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-red-600" />
                                <span className="font-medium">Delivery:</span>
                                <span className="text-muted-foreground">{tms.delivery_loc_name || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Additional Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {tms.container_number && (
                                <div>
                                  <span className="text-muted-foreground">Container:</span>
                                  <span className="ml-1 font-medium">{tms.container_number}</span>
                                </div>
                              )}
                              {tms.customer_name && (
                                <div>
                                  <span className="text-muted-foreground">Customer:</span>
                                  <span className="ml-1 font-medium">{tms.customer_name}</span>
                                </div>
                              )}
                              {tms.carrier_name && (
                                <div>
                                  <span className="text-muted-foreground">Carrier:</span>
                                  <span className="ml-1 font-medium">{tms.carrier_name}</span>
                                </div>
                              )}
                              {tms.miles && (
                                <div>
                                  <span className="text-muted-foreground">Miles:</span>
                                  <span className="ml-1 font-medium">{tms.miles}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repairs Tab */}
          <TabsContent value="repairs">
            <Card>
              <CardHeader>
                <CardTitle>Repair History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repairs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No repair records found
                    </div>
                  ) : (
                    repairs.map((repair) => (
                      <Card key={repair.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">
                                  ${repair.cost_usd.toFixed(2)}
                                </span>
                                {getRepairStatusBadge(repair.repair_status)}
                              </div>
                              <div className="text-sm">{repair.description}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(repair.timestamp_utc), 'PPp')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials">
            <FinancialsTab chassisId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ChassisDetail;
