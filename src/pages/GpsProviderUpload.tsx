
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

import { 
  extractedGpsData, 
  generateDocuments 
} from '@/components/gps/mockData';

interface GpsProviderUploadProps {
  providerName: string;
  providerLogo?: string;
}

/**
 * GPS Provider Upload page component
 * This component displays tabs for uploading GPS data, viewing history,
 * browsing extracted data, and managing documents
 */
const GpsProviderUpload: React.FC<GpsProviderUploadProps> = ({ providerName, providerLogo }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Generate mock data for documents
  const documents = generateDocuments(providerName);

  const handleViewData = () => {
    setActiveTab("data");
  };

  return (
    <div className="dashboard-layout">
      <GpsProviderHeader providerName={providerName} providerLogo={providerLogo} />

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Previous Uploads</TabsTrigger>
          <TabsTrigger value="data">Extracted Data</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <GpsDashboardTab />
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-6">
          <GpsUploadTab providerName={providerName} onUploadSuccess={() => setActiveTab('data')} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <GpsHistoryTab 
            providerName={providerName}
            onViewData={handleViewData}
          />
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6">
          <GpsDataTab extractedData={extractedGpsData} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <GpsDocumentsTab 
            providerName={providerName} 
            documents={documents} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GpsProviderUpload;
