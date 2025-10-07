import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FLEXIVANFinancialPulse from './FLEXIVANFinancialPulse';
import FLEXIVANInvoiceTracker from './FLEXIVANInvoiceTracker';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';

const FLEXIVANDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <FLEXIVANFinancialPulse />
          <div className="grid gap-6 md:grid-cols-1">
            <ImportantNotices />
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <FLEXIVANInvoiceTracker />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <ContactsAndResources />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FLEXIVANDashboard;
