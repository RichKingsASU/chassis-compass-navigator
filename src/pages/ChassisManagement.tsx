
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chassisData, setChassisData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    chassisType: 'all',
    lessor: 'all',
    region: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchChassisData();
  }, []);

  const fetchChassisData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mcl_master_chassis_list')
        .select('*')
        .order('forrest_chz', { ascending: true });

      if (error) throw error;

      setChassisData(data || []);
    } catch (error) {
      console.error('Error fetching chassis data:', error);
      toast({
        title: "Error",
        description: "Failed to load chassis data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const form = useForm({
    defaultValues: {
      fileType: 'csv',
      gpsProvider: '',
    },
  });

  const filteredChassis = chassisData.filter(chassis => {
    // Search term filter
    if (searchTerm && 
        !chassis.forrest_chz?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !chassis.serial?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Dropdown filters
    if (selectedFilters.chassisType !== 'all' && chassis.forrest_chassis_type !== selectedFilters.chassisType) {
      return false;
    }
    if (selectedFilters.lessor !== 'all' && chassis.lessor !== selectedFilters.lessor) {
      return false;
    }
    if (selectedFilters.region !== 'all' && chassis.region !== selectedFilters.region) {
      return false;
    }
    if (selectedFilters.status !== 'all' && chassis.chassis_status !== selectedFilters.status) {
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
      chassisType: 'all',
      lessor: 'all',
      region: 'all',
      status: 'all',
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
              <FormLabel>Chassis Type</FormLabel>
              <Select 
                value={selectedFilters.chassisType} 
                onValueChange={(value) => setSelectedFilters({...selectedFilters, chassisType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Array.from(new Set(chassisData.map(c => c.forrest_chassis_type).filter(Boolean))).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <FormLabel>Lessor</FormLabel>
              <Select 
                value={selectedFilters.lessor} 
                onValueChange={(value) => setSelectedFilters({...selectedFilters, lessor: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Lessors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lessors</SelectItem>
                  {Array.from(new Set(chassisData.map(c => c.lessor).filter(Boolean))).map(lessor => (
                    <SelectItem key={lessor} value={lessor}>{lessor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <FormLabel>Region</FormLabel>
              <Select 
                value={selectedFilters.region} 
                onValueChange={(value) => setSelectedFilters({...selectedFilters, region: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {Array.from(new Set(chassisData.map(c => c.region).filter(Boolean))).map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
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
                  {Array.from(new Set(chassisData.map(c => c.chassis_status).filter(Boolean))).map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis ID</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Lessor</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Plate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                      Loading chassis data...
                    </TableCell>
                  </TableRow>
                ) : filteredChassis.length > 0 ? (
                  filteredChassis.map((chassis) => (
                    <TableRow key={chassis.id}>
                      <TableCell className="font-medium">{chassis.forrest_chz || 'N/A'}</TableCell>
                      <TableCell>{chassis.serial || 'N/A'}</TableCell>
                      <TableCell>{chassis.forrest_chassis_type || 'N/A'}</TableCell>
                      <TableCell>{chassis.lessor || 'N/A'}</TableCell>
                      <TableCell>{chassis.region || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{chassis.chassis_status || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>{chassis.chassis_category || 'N/A'}</TableCell>
                      <TableCell>
                        {chassis.daily_rate ? `$${Number(chassis.daily_rate).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {chassis.plate_state && chassis.plate_nbr 
                          ? `${chassis.plate_state} ${chassis.plate_nbr}` 
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
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
