
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CCMInvoiceManager from './CCMInvoiceManager';
import DashboardKPIs from './dashboard/DashboardKPIs';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';
import RecentActivity from './dashboard/RecentActivity';
import DocumentUpload from './DocumentUpload';

const CCMDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Management</TabsTrigger>
          <TabsTrigger value="reports">Upload Document</TabsTrigger>
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
          <DocumentUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CCMDashboard;
