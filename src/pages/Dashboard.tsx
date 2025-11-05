import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, PlusCircle, FileCheck, AlertTriangle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import DashboardMap from '@/components/dashboard/DashboardMap';
import RecentActivityList from '@/components/dashboard/RecentActivityList';
import ActivityLog from '@/components/dashboard/ActivityLog';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [fleetlocateData, setFleetlocateData] = useState<any[]>([]);
  const [chassisData, setChassisData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch fleetlocate GPS data
      // @ts-ignore
      const { data: gpsData, error: gpsError } = await supabase
        // @ts-ignore
        .from('fleetlocate_stg')
        .select('*')
        .limit(500);

      if (gpsError) throw gpsError;
      setFleetlocateData(gpsData || []);

      // Fetch chassis data
      // @ts-ignore
      const { data: chassisDataResult, error: chassisError } = await supabase
        // @ts-ignore
        .from('chassis_master')
        .select('*');

      if (chassisError) throw chassisError;
      setChassisData(chassisDataResult || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate chassis counts by type
  const chassisTypeCounts = chassisData.reduce((acc, chassis) => {
    const type = chassis.forrest_chassis_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chassisTypeData = Object.entries(chassisTypeCounts)
    .map(([size, count], index) => ({
      size,
      count: count as number,
      color: ['#2A9D8F', '#F4A261', '#E76F51', '#E9C46A', '#264653'][index % 5]
    }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 5);

  // GPS provider data from fleetlocate
  const gpsProviderData = [
    { name: 'Fleetlocate', value: fleetlocateData.length, color: '#2A9D8F' },
    { name: 'Samsara', value: 0, color: '#F4A261' },
    { name: 'BlackBerry', value: 0, color: '#E76F51' },
    { name: 'Fleetview', value: 0, color: '#E9C46A' },
    { name: 'Anytrek', value: 0, color: '#264653' },
  ].filter(provider => provider.value > 0);

  // Mock data for vendor activity
  const vendorActivityData = [
    { name: 'DCLI', active: 85, idle: 15, repair: 5 },
    { name: 'CCM', active: 63, idle: 22, repair: 8 },
    { name: 'TRAC', active: 42, idle: 12, repair: 3 },
    { name: 'FLEXIVAN', active: 38, idle: 7, repair: 4 },
  ];

  // Notifications
  const notifications = [
    { 
      id: 1, 
      title: 'Pending Validation', 
      description: '15 chassis need validation from DCLI', 
      type: 'warning',
      time: '2 hours ago' 
    },
    { 
      id: 2, 
      title: 'GPS Signal Lost', 
      description: 'Chassis CMAU1234567 has not reported in 48 hours', 
      type: 'error',
      time: '5 hours ago' 
    },
    { 
      id: 3, 
      title: 'New Invoice', 
      description: 'TRAC submitted a new invoice for April 2025', 
      type: 'info',
      time: '1 day ago' 
    },
  ];

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="dash-title">Dashboard Overview</h1>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <UploadCloud size={18} />
            Upload GPS File
          </Button>
          <Button variant="outline" className="gap-2">
            <FileCheck size={18} />
            Vendor Validation
          </Button>
          <Button className="gap-2">
            <PlusCircle size={18} />
            Add New Chassis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-stats">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Chassis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stats-value">{chassisData.length}</div>
            <div className="stats-label">Active in fleet</div>
            
            <div className="mt-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                chassisTypeData.map(item => (
                  <div key={item.size} className="flex justify-between items-center mt-2">
                    <div className="text-sm">{item.size}</div>
                    <div className="font-medium">{item.count}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-stats">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">GPS Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stats-value">{loading ? '...' : `${Math.round((fleetlocateData.length / Math.max(chassisData.length, 1)) * 100)}%`}</div>
            <div className="stats-label">Fleet visibility</div>
            
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-secondary h-2.5 rounded-full" style={{ width: `${Math.min((fleetlocateData.length / Math.max(chassisData.length, 1)) * 100, 100)}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-muted-foreground">
                  {loading ? 'Loading...' : `${fleetlocateData.length} chassis with GPS`}
                </div>
                <Badge variant="outline" className="text-xs">Fleetlocate</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-stats">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stats-value">73</div>
            <div className="stats-label">Actions this week</div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm">Uploads</div>
                <div className="font-medium">32</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">Validations</div>
                <div className="font-medium">24</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">New chassis</div>
                <div className="font-medium">17</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Fleet Location Map</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[400px] rounded-md overflow-hidden">
              <DashboardMap fleetlocateData={fleetlocateData} />
            </div>
          </CardContent>
        </Card>
        
        <ActivityLog />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium">Vendor Usage</CardTitle>
              <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange}>
                <TabsList className="grid w-[200px] grid-cols-3">
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vendorActivityData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" stackId="a" name="Active" fill="#2A9D8F" />
                  <Bar dataKey="idle" stackId="a" name="Idle" fill="#E9C46A" />
                  <Bar dataKey="repair" stackId="a" name="In Repair" fill="#E76F51" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">GPS Provider Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gpsProviderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {gpsProviderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Chassis Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityList />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
