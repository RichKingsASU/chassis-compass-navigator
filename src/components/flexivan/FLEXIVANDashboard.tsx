import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FLEXIVANFinancialPulse from './FLEXIVANFinancialPulse';
import FLEXIVANInvoiceTracker from './FLEXIVANInvoiceTracker';
import FLEXIVANDetailView from './FLEXIVANDetailView';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';
import { useFLEXIVANData } from '@/hooks/useFLEXIVANData';

const FLEXIVANDashboard = () => {
  const { selectedRecord, setSelectedRecord } = useFLEXIVANData();

  if (selectedRecord) {
    return (
      <FLEXIVANDetailView 
        record={selectedRecord}
        onBack={() => setSelectedRecord(null)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FLEXIVAN Control Center</h1>
          <p className="text-muted-foreground">From Reporting to Resolution - Actionable Finance Management</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-2">
          <TabsTrigger value="dashboard">Vendor Health</TabsTrigger>
          <TabsTrigger value="tracker">Invoice Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <FLEXIVANFinancialPulse />
          
          {/* Important Notices */}
          <ImportantNotices />
          
          {/* Contact Information and Resources */}
          <ContactsAndResources />
        </TabsContent>
        
        <TabsContent value="tracker" className="pt-4">
          <FLEXIVANInvoiceTracker onViewDetail={setSelectedRecord} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FLEXIVANDashboard;
