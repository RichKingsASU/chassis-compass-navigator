import React, { useState, useMemo } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import GpsProviderHeader from '@/components/gps/GpsProviderHeader';
import GpsDashboardTab from '@/components/gps/GpsDashboardTab';
import GpsUploadTab from '@/components/gps/GpsUploadTab';
import GpsHistoryTab from '@/components/gps/GpsHistoryTab';
import GpsDataTab from '@/components/gps/GpsDataTab';
import GpsDocumentsTab from '@/components/gps/GpsDocumentsTab';

import { useAnytrekData } from '@/hooks/useAnytrekData';
import { useFleetlocateData } from '@/hooks/useFleetlocateData';
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
  
  // Fetch data based on provider
  const { data: anytrekData, isLoading: isAnytrekLoading } = useAnytrekData();
  const { data: fleetlocateData, isLoading: isFleetlocateLoading } = useFleetlocateData();
  
  // Determine which data to use based on provider
  const isAnytrek = providerName.toLowerCase() === 'anytrek';
  const rawGpsData = isAnytrek ? anytrekData : fleetlocateData;
  const isLoading = isAnytrek ? isAnytrekLoading : isFleetlocateLoading;
  
  // Transform data to match GpsData interface
  const transformedGpsData = useMemo(() => {
    if (!rawGpsData) return [];
    
    return rawGpsData.map(record => ({
      chassisId: record.vehicle || record.asset_id || 'N/A',
      timestamp: record.timestamp || 'N/A',
      location: record.location || record.address || 'N/A',
      coordinates: record.latitude && record.longitude 
        ? `${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)}`
        : 'N/A',
      speed: record.speed ? `${record.speed} mph` : '0 mph',
      notes: record.notes || `Status: ${record.status || 'N/A'}${record.dwell_time ? `, Dwell: ${record.dwell_time}` : ''}`,
    }));
  }, [rawGpsData]);
  
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
          <GpsDashboardTab providerName={providerName} />
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
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <GpsDataTab extractedData={transformedGpsData} />
          )}
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
