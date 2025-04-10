
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import InvoiceUploadForm from './invoice/InvoiceUploadForm';
import InvoiceTable from './invoice/InvoiceTable';
import InvoiceFilters from './invoice/InvoiceFilters';
import StorageBucketWarning from './invoice/StorageBucketWarning';
import ExcelDataTable from './invoice/ExcelDataTable';
import { Invoice } from './invoice/types';
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseExcelFile } from '@/utils/excelParser';

// Define form schema for invoice upload
const invoiceFormSchema = z.object({
  invoice_number: z.string().min(1, { message: "Invoice number is required" }),
  invoice_date: z.string().min(1, { message: "Invoice date is required" }),
  provider: z.string().default("CCM"),
  total_amount_usd: z.coerce.number().min(0, { message: "Amount must be a positive number" }),
  status: z.string().default("pending"),
  reason_for_dispute: z.string().optional(),
  file: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "File is required",
  }),
  file_type: z.enum(["pdf", "excel"]).default("pdf"),
  tags: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const CCMInvoiceManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [excelLoading, setExcelLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("invoices");
  const { toast } = useToast();

  // Fetch invoices from Supabase
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fetch Excel data when active tab changes
  useEffect(() => {
    if (activeTab === "excel-data") {
      fetchExcelData();
    }
  }, [activeTab]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ccm_invoice')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform and set invoice data
      const formattedInvoices = data.map(invoice => {
        let fileType = 'pdf';
        if (invoice.file_name) {
          const ext = invoice.file_name.split('.').pop()?.toLowerCase();
          if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') fileType = 'excel';
          else if (ext === 'eml' || ext === 'msg') fileType = 'email';
          else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) fileType = 'image';
        }
        
        return {
          ...invoice,
          fileType,
          invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : '',
          status: invoice.status || (invoice.reason_for_dispute ? 'disputed' : 'pending')
        };
      });

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExcelData = async () => {
    setExcelLoading(true);
    try {
      const { data, error } = await supabase
        .from('ccm_invoice_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setExcelData(data || []);
    } catch (error) {
      console.error('Error fetching Excel data:', error);
      toast({
        title: "Error",
        description: "Failed to load Excel data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExcelLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ccm_invoice')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
        )
      );

      toast({
        title: "Status Updated",
        description: `Invoice status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsUploading(true);
    
    try {
      const file = data.file[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${Date.now()}_${data.invoice_number}.${fileExt}`;
      const filePath = `ccm_invoices/${fileName}`;
      
      // Parse tags if provided
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      
      // 1. Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('invoice_files')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // 2. Insert invoice data into the database
      const { data: insertedInvoice, error: insertError } = await supabase
        .from('ccm_invoice')
        .insert({
          invoice_number: data.invoice_number,
          invoice_date: data.invoice_date,
          provider: data.provider,
          total_amount_usd: data.total_amount_usd,
          status: data.status,
          reason_for_dispute: data.reason_for_dispute,
          file_path: filePath,
          file_name: file.name,
          file_type: fileExt,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single();
        
      if (insertError) throw insertError;

      // 3. If it's an Excel file, parse the data
      if (data.file_type === 'excel' && ['xlsx', 'xls', 'csv'].includes(fileExt)) {
        try {
          await parseExcelFile(file, insertedInvoice.id);
          // Refresh Excel data if we're on the Excel data tab
          if (activeTab === 'excel-data') {
            fetchExcelData();
          }
        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError);
          toast({
            title: "Warning",
            description: "Invoice was uploaded but there was an error parsing the Excel data.",
            variant: "destructive",
          });
        }
      }
      
      // 4. Refresh the invoices list
      await fetchInvoices();
      
      toast({
        title: "Success",
        description: `Invoice ${data.invoice_number} uploaded successfully`,
      });
      
      // Reset form and close dialog
      setOpenDialog(false);
      
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to upload invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('invoice_files')
        .download(filePath);
        
      if (error) throw error;
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const vendorMatch = selectedVendor === 'all' || invoice.provider === selectedVendor;
    const statusMatch = selectedStatus === 'all' || invoice.status === selectedStatus;
    const fileTypeMatch = selectedFileType === 'all' || invoice.fileType === selectedFileType;
    const searchMatch = searchQuery === '' || 
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      invoice.reason_for_dispute?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return vendorMatch && statusMatch && fileTypeMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <InvoiceUploadForm 
        onSubmit={onSubmit}
        isUploading={isUploading}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
      />
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  selectedVendor={selectedVendor}
                  setSelectedVendor={setSelectedVendor}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  selectedFileType={selectedFileType}
                  setSelectedFileType={setSelectedFileType}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                
                {/* Table */}
                <InvoiceTable 
                  invoices={filteredInvoices}
                  loading={loading}
                  handleStatusChange={handleStatusChange}
                  handleFileDownload={handleFileDownload}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="excel-data">
          <ExcelDataTable 
            data={excelData}
            loading={excelLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Storage Bucket Warning */}
      <StorageBucketWarning />
    </div>
  );
};

export default CCMInvoiceManager;
