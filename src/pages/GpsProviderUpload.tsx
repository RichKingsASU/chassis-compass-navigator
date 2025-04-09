
import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import GpsProviderHeader from '@/components/gps/GpsProviderHeader';
import GpsUploadTab from '@/components/gps/GpsUploadTab';
import GpsHistoryTab from '@/components/gps/GpsHistoryTab';
import GpsDataTab from '@/components/gps/GpsDataTab';
import GpsDocumentsTab from '@/components/gps/GpsDocumentsTab';

import { 
  generatePreviousUploads, 
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
  const [activeTab, setActiveTab] = useState("upload");
  
  // Generate mock data for the provider
  const previousUploads = generatePreviousUploads(providerName);
  const documents = generateDocuments(providerName);

  const handleViewData = () => {
    setActiveTab("data");
  };

  return (
    <div className="dashboard-layout">
      <GpsProviderHeader providerName={providerName} providerLogo={providerLogo} />

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Previous Uploads</TabsTrigger>
          <TabsTrigger value="data">Extracted Data</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <GpsUploadTab providerName={providerName} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <GpsHistoryTab 
            providerName={providerName} 
            previousUploads={previousUploads} 
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
