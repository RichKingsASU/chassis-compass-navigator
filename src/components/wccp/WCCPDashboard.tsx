import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WCCPFinancialPulse from './WCCPFinancialPulse';
import WCCPInvoiceTracker from './WCCPInvoiceTracker';
import WCCPDetailView from './WCCPDetailView';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';
import { useWCCPData } from '@/hooks/useWCCPData';

const WCCPDashboard = () => {
  const { selectedRecord, setSelectedRecord } = useWCCPData();

  if (selectedRecord) {
    return (
      <WCCPDetailView 
        record={selectedRecord}
        onBack={() => setSelectedRecord(null)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WCCP Control Center</h1>
          <p className="text-muted-foreground">From Reporting to Resolution - Actionable Finance Management</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-2">
          <TabsTrigger value="dashboard">Vendor Health</TabsTrigger>
          <TabsTrigger value="tracker">Invoice Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <WCCPFinancialPulse />
          
          {/* Important Notices */}
          <ImportantNotices />
          
          {/* Contact Information and Resources */}
          <ContactsAndResources />
        </TabsContent>
        
        <TabsContent value="tracker" className="pt-4">
          <WCCPInvoiceTracker onViewDetail={setSelectedRecord} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WCCPDashboard;
