import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';
import TRACFinancialPulse from './TRACFinancialPulse';
import TRACInvoiceTracker from './TRACInvoiceTracker';

const TRACDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Vendor Health</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <TRACFinancialPulse />
          <TRACInvoiceTracker />
          <ImportantNotices />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <ContactsAndResources />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TRACDashboard;
