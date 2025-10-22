import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import GpsProviderHeader from '@/components/gps/GpsProviderHeader';
import GpsDashboardTab from '@/components/gps/GpsDashboardTab';
import GpsUploadTab from '@/components/gps/GpsUploadTab';
import GpsHistoryTab from '@/components/gps/GpsHistoryTab';
import GpsDataTab from '@/components/gps/GpsDataTab';
import GpsDocumentsTab from '@/components/gps/GpsDocumentsTab';
import { generateDocuments } from '@/components/gps/mockData';
import { useFleetlocateData } from '@/hooks/useFleetlocateData';
import { Card, CardContent } from '@/components/ui/card';

const Fleetlocate = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: fleetlocateData, isLoading } = useFleetlocateData();
  
  const documents = generateDocuments("Fleetlocate");

  const handleViewData = () => {
    setActiveTab("data");
  };

  return (
    <div className="dashboard-layout">
      <GpsProviderHeader providerName="Fleetlocate" />

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Previous Uploads</TabsTrigger>
          <TabsTrigger value="data">Extracted Data</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <GpsDashboardTab providerName="Fleetlocate" />
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-6">
          <GpsUploadTab providerName="Fleetlocate" />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <GpsHistoryTab 
            providerName="Fleetlocate"
            onViewData={handleViewData}
          />
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Loading data...</p>
              </CardContent>
            </Card>
          ) : (
            <GpsDataTab extractedData={fleetlocateData || []} />
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <GpsDocumentsTab 
            providerName="Fleetlocate" 
            documents={documents} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fleetlocate;
