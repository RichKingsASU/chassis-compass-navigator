
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import KPICard from "@/components/ccm/KPICard";
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
import { Check, Search, Upload, FileX, Filter, MapPin, UploadCloud, FileCheck, Eye } from 'lucide-react';
import { useForm } from "react-hook-form";

const ChassisManagement = () => {
  const navigate = useNavigate();
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
        .from('assets')
        .select('*')
        .order('identifier', { ascending: true });

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
        !chassis.identifier?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Dropdown filters
    if (selectedFilters.chassisType !== 'all' && chassis.type !== selectedFilters.chassisType) {
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

  const metrics = useMemo(() => {
    const total = chassisData.length;
    const byType = chassisData.reduce((acc, c) => {
      const type = c.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topType = Object.entries(byType).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    const byClass = chassisData.reduce((acc, c) => {
      const assetClass = c.asset_class || 'Unknown';
      acc[assetClass] = (acc[assetClass] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byType: Object.keys(byType).length,
      byClass: Object.keys(byClass).length,
      topType: topType ? `${topType[0]} (${topType[1]})` : 'N/A',
    };
  }, [chassisData]);

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard 
          title="Total Chassis" 
          value={metrics.total.toString()} 
          description="In fleet" 
          icon="chart" 
        />
        <KPICard 
          title="Chassis Types" 
          value={metrics.byType.toString()} 
          description="Different types"
          icon="users" 
        />
        <KPICard 
          title="Asset Classes" 
          value={metrics.byClass.toString()} 
          description="Different classes" 
          icon="file" 
        />
        <KPICard 
          title="Most Common" 
          value={metrics.topType} 
          description="Top chassis type" 
          icon="users" 
        />
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
                  {Array.from(new Set(chassisData.map(c => c.type).filter(Boolean))).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Door Type</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Width</TableHead>
                  <TableHead>Height</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      Loading chassis data...
                    </TableCell>
                  </TableRow>
                ) : filteredChassis.length > 0 ? (
                  filteredChassis.map((chassis) => (
                    <TableRow key={chassis.id}>
                      <TableCell className="font-medium">{chassis.identifier || 'N/A'}</TableCell>
                      <TableCell>{chassis.type || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{chassis.asset_class || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{chassis.door_type || 'N/A'}</TableCell>
                      <TableCell>{chassis.length ? `${chassis.length}"` : 'N/A'}</TableCell>
                      <TableCell>{chassis.width ? `${chassis.width}"` : 'N/A'}</TableCell>
                      <TableCell>{chassis.height ? `${chassis.height}"` : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => navigate(`/chassis/${chassis.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
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
