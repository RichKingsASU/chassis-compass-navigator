
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CCMInvoiceManager from './CCMInvoiceManager';
import DashboardKPIs from './dashboard/DashboardKPIs';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';
import RecentActivity from './dashboard/RecentActivity';
import DocumentUpload from './DocumentUpload';

import DataView from './DataView';

const CCMDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[800px] grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Management</TabsTrigger>
          <TabsTrigger value="dataview">Data View</TabsTrigger>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
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
        
        <TabsContent value="dataview" className="pt-4">
          <DataView />
        </TabsContent>
        
        <TabsContent value="upload" className="pt-4">
          <DocumentUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CCMDashboard;
