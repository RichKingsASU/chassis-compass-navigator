import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, DollarSign, Clock, BarChart3 } from 'lucide-react';
import TMSTable from '@/components/tms/TMSTable';
import TMSFilters from '@/components/tms/TMSFilters';
import TMSDetailView from '@/components/tms/TMSDetailView';

const MercuryGate = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{source: string; type: string; status: string}>({
    source: '',
    type: '',
    status: ''
  });

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record);
    setShowDetailView(true);
  };

  const handleBackToTable = () => {
    setShowDetailView(false);
    setSelectedRecord(null);
  };

  if (showDetailView && selectedRecord) {
    return (
      <TMSDetailView 
        record={selectedRecord} 
        onBack={handleBackToTable}
      />
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="dash-title">Mercury Gate TMS</h1>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Data View</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">2,847</p>
                    <p className="text-xs text-muted-foreground">Total Shipments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">$2.4M</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">94.2%</p>
                    <p className="text-xs text-muted-foreground">On-Time Delivery</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-xs text-muted-foreground">Active Carriers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Shipment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">In Transit</p>
                      <p className="text-sm text-muted-foreground">Currently moving</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">1,245</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-muted-foreground">Completed today</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">892</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">Pending Pickup</p>
                      <p className="text-sm text-muted-foreground">Awaiting carrier</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">287</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">Issues</p>
                      <p className="text-sm text-muted-foreground">Require attention</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">23</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Top Carriers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">ABC Logistics</p>
                      <p className="text-sm text-muted-foreground">ABCL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">342 loads</p>
                      <p className="text-sm text-muted-foreground">98.5% OTD</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Swift Transport</p>
                      <p className="text-sm text-muted-foreground">SWFT</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">289 loads</p>
                      <p className="text-sm text-muted-foreground">96.2% OTD</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Express Freight</p>
                      <p className="text-sm text-muted-foreground">EXPR</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">234 loads</p>
                      <p className="text-sm text-muted-foreground">94.8% OTD</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="space-y-6">
            <TMSFilters 
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
            />
            <TMSTable 
              onViewDetails={handleViewDetails}
              selectedFilters={selectedFilters}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MercuryGate;