import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DCLIFinancialPulse from './DCLIFinancialPulse';
import DCLIInvoiceTracker from './DCLIInvoiceTracker';
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
          <h1 className="text-3xl font-bold tracking-tight">DCLI Finance Flow</h1>
          <p className="text-muted-foreground">Empowering Partnership Through Transparency</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="dashboard">Financial Pulse</TabsTrigger>
          <TabsTrigger value="tracker">Invoice Tracker</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <DCLIFinancialPulse />
        </TabsContent>
        
        <TabsContent value="tracker" className="pt-4">
          <DCLIInvoiceTracker onViewDetail={setSelectedRecord} />
        </TabsContent>
        
        <TabsContent value="analytics" className="pt-4">
          <div className="text-center text-muted-foreground py-12">
            Analytics view coming soon - focusing on actionable insights and trends
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DCLIDashboard;