import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Truck, TrendingUp, DollarSign, CheckCircle, Clock, XCircle, AlertTriangle, Lock, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FinancialsTab from '@/components/chassis/FinancialsTab';
import { ChassisMapView } from '@/components/chassis/ChassisMapView';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TMSDetailView from '@/components/tms/TMSDetailView';
import UtilizationTab from '@/components/chassis/UtilizationTab';

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
  // Carrier charges
  carrier_rate_charge: string | number;
  carrier_total_rate_linehaul: string | number;
  carrier_total_rate_fuel: string | number;
  carrier_total_rate_detention: string | number;
  carrier_total_accessorials_rate: string | number;
  carrier_invoice_charge: string | number;
  carrier_total_rate_other: string | number;
  // Customer charges
  cust_rate_charge: string | number;
  cust_total_rate_linehaul: string | number;
  cust_total_rate_fuel: string | number;
  cust_total_rate_detention: string | number;
  customer_total_accessorials_rate: string | number;
  cust_invoice_charge: string | number;
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
  const [expandedCharges, setExpandedCharges] = useState<Set<string>>(new Set());
  const [selectedTMSRecord, setSelectedTMSRecord] = useState<TMSData | null>(null);

  // Helper functions for charge parsing and formatting
  const parseCharge = (value: string | number | null | undefined): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: string | number | null | undefined): string => {
    const num = parseCharge(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const toggleCharges = (tmsId: string) => {
    setExpandedCharges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tmsId)) {
        newSet.delete(tmsId);
      } else {
        newSet.add(tmsId);
      }
      return newSet;
    });
  };

  // Calculate summary KPIs
  const summaryKPIs = React.useMemo(() => {
    const totalRevenue = tmsData.reduce((sum, tms) => sum + parseCharge(tms.cust_invoice_charge), 0);
    const totalCost = tmsData.reduce((sum, tms) => sum + parseCharge(tms.carrier_invoice_charge), 0);
    const totalMargin = totalRevenue - totalCost;
    const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
    const loadCount = tmsData.length;

    return {
      totalRevenue,
      totalCost,
      totalMargin,
      avgMarginPct,
      loadCount
    };
  }, [tmsData]);

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
          table: 'chassis_master',
          filter: `forrest_chz_id=eq.${id}`
        },
        (payload) => {
          // @ts-ignore - chassis_master types not yet generated
          const updated = payload.new;
          if (asset) {
            setAsset({
              ...asset,
              current_status: updated.chassis_status || asset.current_status
            });
            toast({
              title: "Status Updated",
              description: "Chassis status has been updated",
            });
          }
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

      // Fetch from chassis_master table
      // @ts-ignore - chassis_master types not yet generated
      const { data: chassisData, error: chassisError } = await supabase
        // @ts-ignore - chassis_master types not yet generated
        .from('chassis_master')
        .select('*')
        .eq('forrest_chz_id', decodedId)
        .maybeSingle();

      if (chassisError) {
        console.error('Error fetching chassis:', chassisError);
      }

      if (chassisData) {
        // @ts-ignore - chassis_master types not yet generated
        assetData = {
          // @ts-ignore
          id: chassisData.forrest_chz_id,
          // @ts-ignore
          identifier: chassisData.forrest_chz_id,
          // @ts-ignore
          type: chassisData.forrest_chassis_type || 'N/A',
          // @ts-ignore
          asset_class: chassisData.chassis_category || 'N/A',
          length: 0,
          width: 0,
          height: 0,
          // @ts-ignore
          current_status: chassisData.chassis_status || 'Active',
          // @ts-ignore
          vin: chassisData.serial_number || '',
          // @ts-ignore
          make: chassisData.manufacturer || '',
          // @ts-ignore
          model: chassisData.model_year ? `${chassisData.model_year}` : '',
          updated_at: new Date().toISOString()
        };
      }

      if (!assetData) {
        throw new Error('Chassis not found');
      }

      setAsset(assetData);

      // Fetch GPS location data from fleetlocate_stg
      if (assetData.identifier) {
        console.log('Fetching GPS data for chassis:', assetData.identifier);
        
        // @ts-ignore - fleetlocate_stg not in types yet
        const { data: gpsData, error: gpsError } = await supabase
          // @ts-ignore
          .from('fleetlocate_stg')
          .select('*')
          .eq('Asset ID', assetData.identifier)
          .order('Last Event Date', { ascending: false });

        if (gpsError) {
          console.error('GPS error:', gpsError);
          setLocationHistory([]);
        } else if (gpsData && gpsData.length > 0) {
          // Transform fleetlocate data to location history format
          const transformedHistory = gpsData.map((record: any, index: number) => ({
            id: index,
            recorded_at: record['Last Event Date'] || new Date().toISOString(),
            location: null, // Fleetlocate doesn't have exact coordinates in this format
            normalized_address: [record.Address, record.City, record.State]
              .filter(Boolean)
              .join(', ') || record.Location || 'N/A',
            velocity_cms: 0,
            altitude_m: 0,
            status: record.Status,
            duration: record.Duration,
            battery: record['Battery Status']
          }));
          setLocationHistory(transformedHistory);
          console.log('GPS location data loaded:', transformedHistory.length, 'records');
        } else {
          setLocationHistory([]);
          console.log('No GPS location data found');
        }
      }

      // Fetch TMS data from mg_tms table
      if (assetData?.identifier) {
        console.log('Fetching TMS data for chassis:', assetData.identifier);
        
        // @ts-ignore - mg_tms types not yet generated
        const { data: tmsDataResult, error: tmsError } = await supabase
          // @ts-ignore - mg_tms types not yet generated
          .from('mg_tms')
          .select('*')
          .or(`chassis_number.eq.${assetData.identifier},chassis_number_format.eq.${assetData.identifier}`)
          .order('created_date', { ascending: false });

        if (tmsError) {
          console.error('TMS error:', tmsError);
        } else {
          console.log('TMS data found:', tmsDataResult?.length || 0, 'records');
        }
        // @ts-ignore - tms_mg types not yet generated
        setTMSData(tmsDataResult || []);
      }

      // Repairs table doesn't exist yet - skip for now
      setRepairs([]);

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
      // @ts-ignore - chassis_master types not yet generated
      const { error } = await supabase
        // @ts-ignore - chassis_master types not yet generated
        .from('chassis_master')
        .update({ 
          chassis_status: newStatus
        })
        .eq('forrest_chz_id', asset.id);

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
            <TabsTrigger value="utilization" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Utilization
            </TabsTrigger>
            <TabsTrigger value="financials" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financials
            </TabsTrigger>
          </TabsList>

          {/* GPS Tab */}
          <TabsContent value="gps" className="space-y-4">
            <ChassisMapView 
              locationHistory={locationHistory} 
              currentChassisId={asset?.identifier}
            />
            <Card>
              <CardHeader>
                <CardTitle>GPS Location History</CardTitle>
              </CardHeader>
              <CardContent>
                {locationHistory.length > 0 ? (
                  <ChassisMapView 
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
          <TabsContent value="tms" className="space-y-4">
            {selectedTMSRecord ? (
              <TMSDetailView 
                record={selectedTMSRecord} 
                onBack={() => setSelectedTMSRecord(null)} 
              />
            ) : (
              <>
            {/* Debug Info Card */}
            <Card className="border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Info className="h-5 w-5" />
                  TMS Data Query Debug
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Query Target</div>
                    <div className="font-mono text-sm">{asset?.identifier || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Records Found</div>
                    <div className="text-2xl font-bold">{tmsData.length}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Query Field</div>
                    <div className="text-sm">chassis_number OR chassis_number_format</div>
                  </div>
                </div>
                {tmsData.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Sample Record (First)</div>
                    <pre className="text-xs overflow-auto max-h-32 bg-background p-2 rounded">
                      {JSON.stringify(tmsData[0], null, 2)}
                    </pre>
                  </div>
                )}
                {tmsData.length === 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">⚠️ No TMS records found</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Check if mg_tms table has records where chassis_number or chassis_number_format = '{asset?.identifier}'
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Summary KPIs */}
            {tmsData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(summaryKPIs.totalRevenue)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Costs</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(summaryKPIs.totalCost)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Margin</div>
                    <div className={`text-2xl font-bold ${summaryKPIs.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summaryKPIs.totalMargin)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Avg Margin %</div>
                    <div className={`text-2xl font-bold ${summaryKPIs.avgMarginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summaryKPIs.avgMarginPct.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Number of Loads</div>
                    <div className="text-2xl font-bold">
                      {summaryKPIs.loadCount}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Usage History by Load/Shipment Order</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Chassis usage organized by LD/SO numbers with dates and charge breakdowns
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tmsData.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No TMS usage data available for this chassis
                    </div>
                  ) : (
                    tmsData.map((tms) => {
                      const revenue = parseCharge(tms.cust_invoice_charge);
                      const cost = parseCharge(tms.carrier_invoice_charge);
                      const margin = revenue - cost;
                      const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
                      const isExpanded = expandedCharges.has(tms.id);

                      return (
                        <Card 
                          key={tms.id} 
                          className="border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedTMSRecord(tms)}
                        >
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

                              {/* Charges Collapsible Section */}
                              <Collapsible open={isExpanded} onOpenChange={() => toggleCharges(tms.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" className="w-full mt-2" size="sm">
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    {isExpanded ? 'Hide' : 'View'} Charges & Margin
                                    {isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3">
                                  <div className="space-y-3">
                                    {/* Charge Breakdown Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Carrier Charges */}
                                      <Card className="bg-muted/50">
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-sm font-semibold">Carrier Charges (Cost)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                          {parseCharge(tms.carrier_total_rate_linehaul) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Linehaul:</span>
                                              <span className="font-medium">{formatCurrency(tms.carrier_total_rate_linehaul)}</span>
                                            </div>
                                          )}
                                          {parseCharge(tms.carrier_total_rate_fuel) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Fuel Surcharge:</span>
                                              <span className="font-medium">{formatCurrency(tms.carrier_total_rate_fuel)}</span>
                                            </div>
                                          )}
                                          {parseCharge(tms.carrier_total_rate_detention) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Detention:</span>
                                              <span className="font-medium">{formatCurrency(tms.carrier_total_rate_detention)}</span>
                                            </div>
                                          )}
                                          {parseCharge(tms.carrier_total_accessorials_rate) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Accessorials:</span>
                                              <span className="font-medium">{formatCurrency(tms.carrier_total_accessorials_rate)}</span>
                                            </div>
                                          )}
                                          {parseCharge(tms.carrier_total_rate_other) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Other:</span>
                                              <span className="font-medium">{formatCurrency(tms.carrier_total_rate_other)}</span>
                                            </div>
                                          )}
                                          <div className="border-t pt-2 flex justify-between font-semibold">
                                            <span>Invoice Total:</span>
                                            <span className="text-orange-600">{formatCurrency(tms.carrier_invoice_charge)}</span>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* Customer Charges */}
                                      <Card className="bg-muted/50">
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-sm font-semibold">Customer Charges (Revenue)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                          {parseCharge(tms.cust_total_rate_linehaul) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Linehaul:</span>
                                              <span className="font-medium">{formatCurrency(tms.cust_total_rate_linehaul)}</span>
                                            </div>
                                          )}
                                          {parseCharge(tms.cust_total_rate_fuel) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Fuel Surcharge:</span>
                                              <span className="font-medium">{formatCurrency(tms.cust_total_rate_fuel)}</span>
                                            </div>
                                          )}
                                          {parseCharge(tms.cust_total_rate_detention) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Detention:</span>
                                              <span className="font-medium">{formatCurrency(tms.cust_total_rate_detention)}</span>
                                            </div>
                                          )}
                                          {parseCharge(tms.customer_total_accessorials_rate) > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Accessorials:</span>
                                              <span className="font-medium">{formatCurrency(tms.customer_total_accessorials_rate)}</span>
                                            </div>
                                          )}
                                          <div className="border-t pt-2 flex justify-between font-semibold">
                                            <span>Invoice Total:</span>
                                            <span className="text-green-600">{formatCurrency(tms.cust_invoice_charge)}</span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>

                                    {/* Margin Summary */}
                                    <Card className={`border-2 ${margin >= 0 ? 'border-green-500 bg-green-50/50' : 'border-red-500 bg-red-50/50'}`}>
                                      <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-sm text-muted-foreground">Gross Margin</div>
                                            <div className={`text-2xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                              {formatCurrency(margin)}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm text-muted-foreground">Margin %</div>
                                            <div className={`text-2xl font-bold ${marginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                              {marginPct.toFixed(1)}%
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
            </>
            )}
          </TabsContent>

          {/* Utilization Tab */}
          <TabsContent value="utilization">
            <UtilizationTab chassisId={asset.identifier} tmsData={tmsData} />
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
