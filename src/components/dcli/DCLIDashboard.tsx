import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DCLIFinancialPulse from './DCLIFinancialPulse';
import DCLIInvoiceTracker from './DCLIInvoiceTracker';
import DCLIInvoiceLineReview from './DCLIInvoiceLineReview';
import DCLIDetailView from './DCLIDetailView';
import { useDCLIData } from '@/hooks/useDCLIData';

const DCLIDashboard = () => {
  const { selectedRecord, setSelectedRecord } = useDCLIData();

  if (selectedRecord) {
    return (
      <DCLIDetailView 
        record={selectedRecord}
        onBack={() => setSelectedRecord(null)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DCLI Control Center</h1>
          <p className="text-muted-foreground">From Reporting to Resolution - Actionable Finance Management</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[700px] grid-cols-3">
          <TabsTrigger value="dashboard">Vendor Health</TabsTrigger>
          <TabsTrigger value="tracker">Invoice Tracker</TabsTrigger>
          <TabsTrigger value="review">Line-Item Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <DCLIFinancialPulse />
        </TabsContent>
        
        <TabsContent value="tracker" className="pt-4">
          <DCLIInvoiceTracker onViewDetail={setSelectedRecord} />
        </TabsContent>
        
        <TabsContent value="review" className="pt-4">
          <DCLIInvoiceLineReview onViewDetail={setSelectedRecord} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DCLIDashboard;