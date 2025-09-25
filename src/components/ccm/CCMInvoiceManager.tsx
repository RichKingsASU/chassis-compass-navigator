
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceTable from './invoice/InvoiceTable';
import InvoiceFilters from './invoice/InvoiceFilters';
import StorageBucketWarning from './invoice/StorageBucketWarning';
import ExcelDataTable from './invoice/ExcelDataTable';
import InvoiceDetailView from './invoice/InvoiceDetailView';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { useInvoiceFilters } from './invoice/useInvoiceFilters';
import { Invoice } from './invoice/types';

const CCMInvoiceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Custom hooks
  const { 
    invoices, 
    excelData, 
    loading, 
    excelLoading, 
    fetchInvoices, 
    fetchExcelData, 
    handleStatusChange, 
    handleFileDownload 
  } = useInvoiceData();
  
  const {
    filters,
    setSelectedVendor,
    setSelectedStatus,
    setSelectedFileType,
    setSearchQuery,
    filteredInvoices
  } = useInvoiceFilters(invoices);

  // Fetch Excel data when active tab changes
  useEffect(() => {
    if (activeTab === "excel-data") {
      console.log("Tab changed to excel-data, fetching data...");
      fetchExcelData();
    }
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleViewInvoiceDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleBackToList = () => {
    setSelectedInvoice(null);
    fetchInvoices(); // Refresh the list
  };

  // If an invoice is selected, show the detail view
  if (selectedInvoice) {
    return (
      <InvoiceDetailView 
        invoice={selectedInvoice}
        onBack={handleBackToList}
        onUpdate={fetchInvoices}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="invoices">Invoice Documents</TabsTrigger>
          <TabsTrigger value="excel-data">Excel Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices">
          {/* Invoices List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-medium">Invoice Management</CardTitle>
                  <CardDescription>Manage and track all your invoice documents</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Filters */}
                <InvoiceFilters 
                  selectedVendor={filters.selectedVendor}
                  setSelectedVendor={setSelectedVendor}
                  selectedStatus={filters.selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  selectedFileType={filters.selectedFileType}
                  setSelectedFileType={setSelectedFileType}
                  searchQuery={filters.searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                
                {/* Table */}
                <InvoiceTable 
                  invoices={filteredInvoices}
                  loading={loading}
                  handleStatusChange={handleStatusChange}
                  handleFileDownload={handleFileDownload}
                  onViewDetail={handleViewInvoiceDetail}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="excel-data">
          <ExcelDataTable 
            data={excelData}
            loading={excelLoading}
            onRefresh={fetchExcelData}
          />
        </TabsContent>
      </Tabs>

      {/* Storage Bucket Warning */}
      <StorageBucketWarning />
    </div>
  );
};

export default CCMInvoiceManager;
