import React from 'react';
import CCMDashboard from '../../components/ccm/CCMDashboard';
import CCMInvoiceManager from '../../components/ccm/CCMInvoiceManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
const CCM = () => {
  return <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">CCM Portal</h2>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-4">
        
        
        <TabsContent value="dashboard" className="space-y-4">
          <CCMDashboard />
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CCM Invoice Management</CardTitle>
              <CardDescription>Upload, manage and track your CCM invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <CCMInvoiceManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};
export default CCM;