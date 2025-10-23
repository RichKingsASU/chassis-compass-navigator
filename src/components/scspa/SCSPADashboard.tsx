import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';

const SCSPADashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SCSPA Control Center</h1>
          <p className="text-muted-foreground">From Reporting to Resolution - Actionable Finance Management</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-2">
          <TabsTrigger value="dashboard">Vendor Health</TabsTrigger>
          <TabsTrigger value="tracker">Invoice Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">SCSPA Portal Integration</h3>
              <p className="text-muted-foreground">
                SCSPA invoice data integration is currently being configured.
                <br />
                Please contact your account manager for current invoice information.
              </p>
            </CardContent>
          </Card>
          
          {/* Important Notices */}
          <ImportantNotices />
          
          {/* Contact Information and Resources */}
          <ContactsAndResources />
        </TabsContent>
        
        <TabsContent value="tracker" className="pt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Invoice tracking will be available once SCSPA data integration is complete.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SCSPADashboard;
