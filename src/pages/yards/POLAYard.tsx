
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Map, MapPin, Truck, Clock, AlertTriangle, CheckCircle, Package, Bell } from 'lucide-react';
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
              
            </div>
          </CardContent>
        </Card>

        {/* News & Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bell className="h-5 w-5" />
              News & Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Holiday Closure Notice</p>
                    <p className="text-sm text-blue-700 mt-1">Pier S Yard will be closed December 25-26 for Christmas holiday</p>
                    <p className="text-xs text-blue-600 mt-1">Posted: Dec 18, 2024</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Important</Badge>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-green-900">Extended Hours</p>
                    <p className="text-sm text-green-700 mt-1">Weekend operations now available 6:00 AM - 10:00 PM</p>
                    <p className="text-xs text-green-600 mt-1">Effective: Dec 15, 2024</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-yellow-900">Maintenance Window</p>
                    <p className="text-sm text-yellow-700 mt-1">Section C will have limited access Jan 5-7 for repairs</p>
                    <p className="text-xs text-yellow-600 mt-1">Scheduled: Jan 5, 2025</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>
                </div>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="font-medium text-sm">Current Operating Hours</p>
                  <p className="text-xs text-muted-foreground mt-1">Mon-Fri: 5:00 AM - 11:00 PM</p>
                  <p className="text-xs text-muted-foreground">Sat-Sun: 6:00 AM - 10:00 PM</p>
                </div>
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
