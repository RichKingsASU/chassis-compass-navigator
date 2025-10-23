
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Search, 
  Upload,
  Route,
  FileText,
  FileX,
  Truck
} from 'lucide-react';

// Import our components with improved type definitions
import TMSFilters from '@/components/tms/TMSFilters';
import TMSTable from '@/components/tms/TMSTable';
import TMSTabPlaceholder from '@/components/tms/TMSTabPlaceholder';
import { TMSFiltersState } from '@/hooks/useTMSData';

const TMSData = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<TMSFiltersState>({
    source: '',
    type: '',
    status: '',
    searchTerm: '',
  });

  /**
   * Resets all filters to their default state
   */
  const resetFilters = (): void => {
    setSelectedFilters({
      source: '',
      type: '',
      status: '',
      searchTerm: '',
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
              <TMSFilters 
                selectedFilters={selectedFilters} 
                setSelectedFilters={setSelectedFilters} 
              />
              <TMSTable 
                onViewDetails={() => {}} 
                selectedFilters={{ ...selectedFilters, searchTerm }} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <TMSTabPlaceholder icon={FileText} message="Order data will be displayed here" />
        </TabsContent>
        
        <TabsContent value="dispatches">
          <TMSTabPlaceholder icon={Truck} message="Dispatch data will be displayed here" />
        </TabsContent>
        
        <TabsContent value="shipments">
          <TMSTabPlaceholder icon={Route} message="Shipment data will be displayed here" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TMSData;
