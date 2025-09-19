
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CCMInvoiceManager from './CCMInvoiceManager';
import DashboardKPIs from './dashboard/DashboardKPIs';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';
import RecentActivity from './dashboard/RecentActivity';

const CCMDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Management</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          {/* KPI Section */}
          <DashboardKPIs />
          
          {/* Important Notices */}
          <ImportantNotices />
          
          {/* Contact Information and Resources */}
          <ContactsAndResources />
          
          {/* Recent Transactions/Activity */}
          <RecentActivity />
        </TabsContent>
        
        <TabsContent value="invoices" className="pt-4">
          <CCMInvoiceManager />
        </TabsContent>
        
        <TabsContent value="reports" className="pt-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Reports & Analytics</h3>
            <p className="text-muted-foreground">Advanced reporting features coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CCMDashboard;
