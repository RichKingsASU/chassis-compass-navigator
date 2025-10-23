import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorFinancialPulse from './VendorFinancialPulse';
import VendorInvoiceTracker from './VendorInvoiceTracker';
import ImportantNotices from './dashboard/ImportantNotices';
import ContactsAndResources from './dashboard/ContactsAndResources';
import VendorDetailView from './VendorDetailView';

interface VendorDashboardProps {
  vendorName: string;
  vendorKey: string;
  onViewDetail: (record: any) => void;
  selectedRecord?: any;
  onBack?: () => void;
  showSupportTab?: boolean;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ 
  vendorName, 
  vendorKey, 
  onViewDetail, 
  selectedRecord, 
  onBack,
  showSupportTab = true 
}) => {
  // If a record is selected, show the detail view
  if (selectedRecord && onBack) {
    return (
      <VendorDetailView 
        record={selectedRecord}
        onBack={onBack}
        vendorName={vendorName}
        vendorKey={vendorKey}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{vendorName} Control Center</h1>
          <p className="text-muted-foreground">From Reporting to Resolution - Actionable Finance Management</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-2">
          <TabsTrigger value="dashboard">Vendor Health</TabsTrigger>
          <TabsTrigger value="tracker">Invoice Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <VendorFinancialPulse vendorKey={vendorKey} />
          
          {/* Important Notices */}
          <ImportantNotices />
          
          {/* Contact Information and Resources */}
          <ContactsAndResources />
        </TabsContent>
        
        <TabsContent value="tracker" className="pt-4">
          <VendorInvoiceTracker 
            vendorKey={vendorKey} 
            onViewDetail={onViewDetail} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;