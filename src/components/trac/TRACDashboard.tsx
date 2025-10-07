import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';

const TRACDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">TRAC Portal Integration</h3>
              <p className="text-muted-foreground">
                TRAC invoice data integration is currently being configured.
                <br />
                Please contact your account manager for current invoice information.
              </p>
            </CardContent>
          </Card>
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
