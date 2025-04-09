
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Search, 
  FileCheck,
  Upload,
  Truck,
  Calendar,
  Route,
  FileText,
  Filter,
  FileX
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormLabel,
} from "@/components/ui/form";

const TMSData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    source: '',
    type: '',
    status: '',
  });
  
  // Mock data for TMS data
  const tmsData = [
    {
      id: 'TMS-1001',
      source: 'McLeod',
      type: 'Order',
      referenceId: 'ORD-5678',
      timestamp: '2025-04-09 08:23 AM',
      details: 'Delivery to Charleston, SC',
      status: 'active'
    },
    {
      id: 'TMS-1002',
      source: 'Trimble',
      type: 'Dispatch',
      referenceId: 'DSP-8765',
      timestamp: '2025-04-09 07:45 AM',
      details: 'Pickup from Savannah, GA',
      status: 'pending'
    },
    {
      id: 'TMS-1003',
      source: 'MercuryGate',
      type: 'Shipment',
      referenceId: 'SHP-9012',
      timestamp: '2025-04-08 04:15 PM',
      details: 'Atlanta to Miami route',
      status: 'completed'
    },
    {
      id: 'TMS-1004',
      source: 'McLeod',
      type: 'Order',
      referenceId: 'ORD-3456',
      timestamp: '2025-04-08 01:30 PM',
      details: 'Port pickup - Jacksonville',
      status: 'pending'
    },
    {
      id: 'TMS-1005',
      source: 'Oracle TMS',
      type: 'Invoice',
      referenceId: 'INV-7890',
      timestamp: '2025-04-08 10:05 AM',
      details: 'Billing for delivery #DSP-8765',
      status: 'active'
    },
    {
      id: 'TMS-1006',
      source: 'Trimble',
      type: 'Dispatch',
      referenceId: 'DSP-6543',
      timestamp: '2025-04-07 03:22 PM',
      details: 'Intermodal transfer - Norfolk',
      status: 'completed'
    },
    {
      id: 'TMS-1007',
      source: 'MercuryGate',
      type: 'Shipment',
      referenceId: 'SHP-7654',
      timestamp: '2025-04-07 11:14 AM',
      details: 'Houston to Dallas route',
      status: 'active'
    },
    {
      id: 'TMS-1008',
      source: 'Oracle TMS',
      type: 'Invoice',
      referenceId: 'INV-8901',
      timestamp: '2025-04-06 08:45 PM',
      details: 'Billing for delivery #DSP-6543',
      status: 'pending'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredData = tmsData.filter(data => {
    // Search term filter
    if (
      searchTerm && 
      !data.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !data.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !data.details.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    // Dropdown filters
    if (selectedFilters.source && data.source !== selectedFilters.source) {
      return false;
    }
    if (selectedFilters.type && data.type !== selectedFilters.type) {
      return false;
    }
    if (selectedFilters.status && data.status !== selectedFilters.status) {
      return false;
    }
    
    return true;
  });

  const resetFilters = () => {
    setSelectedFilters({
      source: '',
      type: '',
      status: '',
    });
    setSearchTerm('');
  };

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="dash-title">TMS Data Integration</h1>
        </div>
        
        <div className="flex gap-3">
          <Button className="gap-2">
            <Upload size={18} />
            Import TMS Data
          </Button>
          <Button variant="outline" className="gap-2">
            <Route size={18} />
            Link to Chassis
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-4 mb-6">
          <TabsTrigger value="all">All Data</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="dispatches">Dispatches</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-lg font-medium">Transportation Management System Data</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ID or Reference"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" className="gap-2" onClick={resetFilters}>
                    <FileX size={16} />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <FormLabel>Source System</FormLabel>
                  <Select 
                    value={selectedFilters.source} 
                    onValueChange={(value) => setSelectedFilters({...selectedFilters, source: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sources</SelectItem>
                      <SelectItem value="McLeod">McLeod</SelectItem>
                      <SelectItem value="Trimble">Trimble</SelectItem>
                      <SelectItem value="MercuryGate">MercuryGate</SelectItem>
                      <SelectItem value="Oracle TMS">Oracle TMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <FormLabel>Data Type</FormLabel>
                  <Select 
                    value={selectedFilters.type} 
                    onValueChange={(value) => setSelectedFilters({...selectedFilters, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="Order">Order</SelectItem>
                      <SelectItem value="Dispatch">Dispatch</SelectItem>
                      <SelectItem value="Shipment">Shipment</SelectItem>
                      <SelectItem value="Invoice">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    value={selectedFilters.status} 
                    onValueChange={(value) => setSelectedFilters({...selectedFilters, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TMS ID</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((data) => (
                        <TableRow key={data.id}>
                          <TableCell className="font-medium">{data.id}</TableCell>
                          <TableCell>{data.source}</TableCell>
                          <TableCell>
                            {data.type === 'Order' && <FileText size={14} className="mr-1 inline" />}
                            {data.type === 'Dispatch' && <Truck size={14} className="mr-1 inline" />}
                            {data.type === 'Shipment' && <Route size={14} className="mr-1 inline" />}
                            {data.type === 'Invoice' && <FileCheck size={14} className="mr-1 inline" />}
                            {data.type}
                          </TableCell>
                          <TableCell>{data.referenceId}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            <Calendar size={14} className="mr-1 inline text-muted-foreground" />
                            {data.timestamp}
                          </TableCell>
                          <TableCell>{data.details}</TableCell>
                          <TableCell>{getStatusBadge(data.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <FileCheck size={16} />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Truck size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                          No TMS data found matching your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-md">
                <div className="text-center">
                  <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Order data will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dispatches">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-md">
                <div className="text-center">
                  <Truck size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Dispatch data will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shipments">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-md">
                <div className="text-center">
                  <Route size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Shipment data will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TMSData;
