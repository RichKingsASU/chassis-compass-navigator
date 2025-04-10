
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Search, Upload, FileX, Filter, MapPin, UploadCloud, FileCheck } from 'lucide-react';
import { useForm } from "react-hook-form";

const ChassisManagement = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    size: '',
    gpsProvider: '',
    vendor: '',
    status: '',
  });
  
  // Mock data for chassis
  const chassisData = [
    {
      id: 'CMAU1234567',
      size: "40'",
      vendor: 'DCLI',
      gpsProvider: 'Samsara',
      location: 'Savannah, GA',
      lastUpdated: '2025-04-09 08:23 AM',
      status: 'active'
    },
    {
      id: 'TCLU7654321',
      size: "20'",
      vendor: 'TRAC',
      gpsProvider: 'BlackBerry',
      location: 'Charleston, SC',
      lastUpdated: '2025-04-09 07:45 AM',
      status: 'active'
    },
    {
      id: 'FSCU5555123',
      size: "45'",
      vendor: 'FLEXIVAN',
      gpsProvider: 'Fleetview',
      location: 'Atlanta, GA',
      lastUpdated: '2025-04-08 04:15 PM',
      status: 'idle'
    },
    {
      id: 'NYKU9876543',
      size: "40'",
      vendor: 'CCM',
      gpsProvider: 'Fleetlocate',
      location: 'Miami, FL',
      lastUpdated: '2025-04-08 01:30 PM',
      status: 'repair'
    },
    {
      id: 'APHU1122334',
      size: "20'",
      vendor: 'DCLI',
      gpsProvider: 'Anytrek',
      location: 'Jacksonville, FL',
      lastUpdated: '2025-04-08 10:05 AM',
      status: 'active'
    },
    {
      id: 'MSCU5544332',
      size: "40'",
      vendor: 'SCSPA',
      gpsProvider: 'Samsara',
      location: 'Norfolk, VA',
      lastUpdated: '2025-04-07 03:22 PM',
      status: 'active'
    },
    {
      id: 'OOLU8899776',
      size: "20'",
      vendor: 'WCCP',
      gpsProvider: 'BlackBerry',
      location: 'Houston, TX',
      lastUpdated: '2025-04-07 11:14 AM',
      status: 'idle'
    },
    {
      id: 'ZCSU1234987',
      size: "45'",
      vendor: 'TRAC',
      gpsProvider: 'Anytrek',
      location: 'New York, NY',
      lastUpdated: '2025-04-06 08:45 PM',
      status: 'repair'
    },
  ];
  
  const form = useForm({
    defaultValues: {
      fileType: 'csv',
      gpsProvider: '',
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Idle</Badge>;
      case 'repair':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">In Repair</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredChassis = chassisData.filter(chassis => {
    // Search term filter
    if (searchTerm && !chassis.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Dropdown filters
    if (selectedFilters.size && chassis.size !== selectedFilters.size) {
      return false;
    }
    if (selectedFilters.gpsProvider && chassis.gpsProvider !== selectedFilters.gpsProvider) {
      return false;
    }
    if (selectedFilters.vendor && chassis.vendor !== selectedFilters.vendor) {
      return false;
    }
    if (selectedFilters.status && chassis.status !== selectedFilters.status) {
      return false;
    }
    
    return true;
  });

  const onUploadSubmit = (data: any) => {
    console.log("Upload data:", data);
    setUploadOpen(false);
    // Handle file upload here
  };

  const resetFilters = () => {
    setSelectedFilters({
      size: '',
      gpsProvider: '',
      vendor: '',
      status: '',
    });
    setSearchTerm('');
  };

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="dash-title">Chassis Management</h1>
        
        <div className="flex gap-3">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UploadCloud size={18} />
                Upload GPS File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload GPS Data</DialogTitle>
                <DialogDescription>
                  Upload a file containing GPS data from your provider.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onUploadSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="fileType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Type</FormLabel>
                        <FormControl>
                          <Tabs defaultValue="csv" className="w-full" value={field.value} onValueChange={field.onChange}>
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="csv">CSV</TabsTrigger>
                              <TabsTrigger value="excel">Excel</TabsTrigger>
                              <TabsTrigger value="pdf">PDF</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gpsProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPS Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="samsara">Samsara</SelectItem>
                            <SelectItem value="blackberry">BlackBerry Radar</SelectItem>
                            <SelectItem value="fleetview">Fleetview</SelectItem>
                            <SelectItem value="fleetlocate">Fleetlocate</SelectItem>
                            <SelectItem value="anytrek">Anytrek</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <div className="mt-2 text-sm text-gray-600">Drag and drop a file here, or click to browse</div>
                    <input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      accept=".csv,.xlsx,.xls,.pdf"
                    />
                    <Button variant="outline" className="mt-2" onClick={() => document.getElementById('file-upload')?.click()}>
                      Select File
                    </Button>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Upload</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-medium">Chassis List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Chassis ID"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <FormLabel>Size</FormLabel>
              <Select 
                value={selectedFilters.size} 
                onValueChange={(value) => setSelectedFilters({...selectedFilters, size: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="20'">20'</SelectItem>
                  <SelectItem value="40'">40'</SelectItem>
                  <SelectItem value="45'">45'</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <FormLabel>GPS Provider</FormLabel>
              <Select 
                value={selectedFilters.gpsProvider} 
                onValueChange={(value) => setSelectedFilters({...selectedFilters, gpsProvider: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="Samsara">Samsara</SelectItem>
                  <SelectItem value="BlackBerry">BlackBerry</SelectItem>
                  <SelectItem value="Fleetview">Fleetview</SelectItem>
                  <SelectItem value="Fleetlocate">Fleetlocate</SelectItem>
                  <SelectItem value="Anytrek">Anytrek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <FormLabel>Vendor</FormLabel>
              <Select 
                value={selectedFilters.vendor} 
                onValueChange={(value) => setSelectedFilters({...selectedFilters, vendor: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  <SelectItem value="DCLI">DCLI</SelectItem>
                  <SelectItem value="CCM">CCM</SelectItem>
                  <SelectItem value="SCSPA">SCSPA</SelectItem>
                  <SelectItem value="WCCP">WCCP</SelectItem>
                  <SelectItem value="TRAC">TRAC</SelectItem>
                  <SelectItem value="FLEXIVAN">FLEXIVAN</SelectItem>
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="repair">In Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis ID</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>GPS Provider</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChassis.length > 0 ? (
                  filteredChassis.map((chassis) => (
                    <TableRow key={chassis.id}>
                      <TableCell className="font-medium">{chassis.id}</TableCell>
                      <TableCell>{chassis.size}</TableCell>
                      <TableCell>{chassis.vendor}</TableCell>
                      <TableCell>{chassis.gpsProvider}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-secondary" />
                          {chassis.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{chassis.lastUpdated}</TableCell>
                      <TableCell>{getStatusBadge(chassis.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FileCheck size={16} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <UploadCloud size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No chassis found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChassisManagement;
