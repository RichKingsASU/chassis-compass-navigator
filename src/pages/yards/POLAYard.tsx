
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Map, MapPin, Truck, Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import pierSGeofence from '@/assets/pier-s-geofence.png';

const POLAYard = () => {
  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="dash-title">Pier S Yard Report</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">142</p>
                <p className="text-xs text-muted-foreground">Total Chassis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">87</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">35</p>
                <p className="text-xs text-muted-foreground">Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">20</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Yard Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Map className="h-5 w-5" />
              Yard Layout
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="relative w-full h-full bg-slate-100 overflow-hidden rounded-md">
              {/* Pier S Geofence Image */}
              <img 
                src={pierSGeofence} 
                alt="Pier S Yard Layout with Geofence Boundary"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Overlay with chassis locations */}
              <div className="absolute inset-0 bg-black/10">
                {/* Sample chassis locations positioned on the actual layout */}
                <div className="absolute top-[40%] left-[30%]" title="CMAU1234567 - Available">
                  <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
                </div>
                <div className="absolute top-[45%] left-[45%]" title="TCLU7654321 - Reserved">
                  <div className="bg-yellow-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
                </div>
                <div className="absolute top-[35%] left-[60%]" title="FSCU5555123 - Maintenance">
                  <div className="bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
                </div>
                <div className="absolute top-[50%] left-[35%]" title="NYKU9876543 - Available">
                  <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
                </div>
                <div className="absolute top-[42%] left-[55%]" title="APHU1122334 - In Transit">
                  <div className="bg-blue-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                <div className="text-xs font-medium mb-2">Chassis Status</div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-yellow-500 w-3 h-3 rounded-full"></div>
                    <span>Reserved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-red-500 w-3 h-3 rounded-full"></div>
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-500 w-3 h-3 rounded-full"></div>
                    <span>In Transit</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">CMAU1234567</p>
                  <p className="text-sm text-muted-foreground">Chassis moved to Section A</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">TCLU7654321</p>
                  <p className="text-sm text-muted-foreground">Maintenance completed</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">FSCU5555123</p>
                  <p className="text-sm text-muted-foreground">Reserved for pickup</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Reserved</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">NYKU9876543</p>
                  <p className="text-sm text-muted-foreground">Inspection required</p>
                </div>
                <Badge className="bg-red-100 text-red-800">Alert</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Chassis Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Chassis Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis ID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">CMAU1234567</TableCell>
                <TableCell>40'</TableCell>
                <TableCell>Section A-12</TableCell>
                <TableCell><Badge className="bg-green-100 text-green-800">Available</Badge></TableCell>
                <TableCell className="text-muted-foreground">2 hours ago</TableCell>
                <TableCell><Badge variant="outline">Good</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">TCLU7654321</TableCell>
                <TableCell>20'</TableCell>
                <TableCell>Section B-05</TableCell>
                <TableCell><Badge className="bg-yellow-100 text-yellow-800">Reserved</Badge></TableCell>
                <TableCell className="text-muted-foreground">1 hour ago</TableCell>
                <TableCell><Badge variant="outline">Good</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">FSCU5555123</TableCell>
                <TableCell>45'</TableCell>
                <TableCell>Section C-08</TableCell>
                <TableCell><Badge className="bg-red-100 text-red-800">Maintenance</Badge></TableCell>
                <TableCell className="text-muted-foreground">3 hours ago</TableCell>
                <TableCell><Badge className="bg-yellow-100 text-yellow-800">Needs Repair</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">NYKU9876543</TableCell>
                <TableCell>40'</TableCell>
                <TableCell>Section A-07</TableCell>
                <TableCell><Badge className="bg-green-100 text-green-800">Available</Badge></TableCell>
                <TableCell className="text-muted-foreground">30 minutes ago</TableCell>
                <TableCell><Badge variant="outline">Excellent</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">APHU1122334</TableCell>
                <TableCell>20'</TableCell>
                <TableCell>Section B-15</TableCell>
                <TableCell><Badge className="bg-blue-100 text-blue-800">In Transit</Badge></TableCell>
                <TableCell className="text-muted-foreground">15 minutes ago</TableCell>
                <TableCell><Badge variant="outline">Good</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default POLAYard;
