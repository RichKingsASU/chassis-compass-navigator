import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TRACFinancialPulse from './TRACFinancialPulse';
import TRACInvoiceTracker from './TRACInvoiceTracker';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';

const TRACDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">Vendor Health</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Tracker</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6 mt-6">
          <TRACFinancialPulse />
          <ImportantNotices />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <TRACInvoiceTracker />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <ContactsAndResources />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TRACDashboard;
