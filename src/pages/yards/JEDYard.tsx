
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Map, MapPin, Truck, Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react';

const JEDYard = () => {
  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="dash-title">JED Yard Report</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">98</p>
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
                <p className="text-2xl font-bold">52</p>
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
                <p className="text-2xl font-bold">28</p>
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
                <p className="text-2xl font-bold">18</p>
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-muted-foreground mb-2">JED Yard Layout</div>
                  <div className="text-xs text-muted-foreground">
                    Interactive yard map with chassis locations
                  </div>
                </div>
              </div>
              
              {/* Sample yard layout */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 300">
                <rect x="50" y="50" width="300" height="200" stroke="#1A2942" strokeWidth="2" fill="transparent"/>
                <rect x="80" y="80" width="60" height="40" fill="#e2e8f0"/>
                <rect x="160" y="80" width="60" height="40" fill="#e2e8f0"/>
                <rect x="240" y="80" width="60" height="40" fill="#e2e8f0"/>
                <rect x="80" y="180" width="60" height="40" fill="#e2e8f0"/>
                <rect x="160" y="180" width="60" height="40" fill="#e2e8f0"/>
                <rect x="240" y="180" width="60" height="40" fill="#e2e8f0"/>
              </svg>
              
              {/* Sample chassis locations */}
              <div className="absolute top-[35%] left-[25%]">
                <div className="bg-green-500 w-3 h-3 rounded-full"></div>
              </div>
              <div className="absolute top-[35%] left-[45%]">
                <div className="bg-yellow-500 w-3 h-3 rounded-full"></div>
              </div>
              <div className="absolute top-[65%] left-[35%]">
                <div className="bg-red-500 w-3 h-3 rounded-full"></div>
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
                  <p className="font-medium">JEDU2345678</p>
                  <p className="text-sm text-muted-foreground">Chassis moved to Section B</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">TRCU8765432</p>
                  <p className="text-sm text-muted-foreground">Inspection completed</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">DCLU6666234</p>
                  <p className="text-sm text-muted-foreground">Reserved for export</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Reserved</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">CCMU0987654</p>
                  <p className="text-sm text-muted-foreground">Tire replacement needed</p>
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
                <TableCell className="font-medium">JEDU2345678</TableCell>
                <TableCell>40'</TableCell>
                <TableCell>Section B-08</TableCell>
                <TableCell><Badge className="bg-green-100 text-green-800">Available</Badge></TableCell>
                <TableCell className="text-muted-foreground">1 hour ago</TableCell>
                <TableCell><Badge variant="outline">Good</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">TRCU8765432</TableCell>
                <TableCell>20'</TableCell>
                <TableCell>Section A-03</TableCell>
                <TableCell><Badge className="bg-yellow-100 text-yellow-800">Reserved</Badge></TableCell>
                <TableCell className="text-muted-foreground">45 minutes ago</TableCell>
                <TableCell><Badge variant="outline">Excellent</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">DCLU6666234</TableCell>
                <TableCell>45'</TableCell>
                <TableCell>Section C-12</TableCell>
                <TableCell><Badge className="bg-red-100 text-red-800">Maintenance</Badge></TableCell>
                <TableCell className="text-muted-foreground">2 hours ago</TableCell>
                <TableCell><Badge className="bg-yellow-100 text-yellow-800">Needs Service</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">CCMU0987654</TableCell>
                <TableCell>40'</TableCell>
                <TableCell>Section B-15</TableCell>
                <TableCell><Badge className="bg-green-100 text-green-800">Available</Badge></TableCell>
                <TableCell className="text-muted-foreground">20 minutes ago</TableCell>
                <TableCell><Badge variant="outline">Good</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">FLXU3344556</TableCell>
                <TableCell>20'</TableCell>
                <TableCell>Section A-09</TableCell>
                <TableCell><Badge className="bg-blue-100 text-blue-800">In Transit</Badge></TableCell>
                <TableCell className="text-muted-foreground">10 minutes ago</TableCell>
                <TableCell><Badge variant="outline">Good</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default JEDYard;
