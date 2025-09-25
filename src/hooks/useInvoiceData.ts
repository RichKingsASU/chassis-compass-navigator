
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, ExcelDataItem } from '@/components/ccm/invoice/types';

export const useInvoiceData = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [excelData, setExcelData] = useState<ExcelDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [excelLoading, setExcelLoading] = useState(true);
  const { toast } = useToast();

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
          if (['xlsx', 'xls', 'xlsb', 'csv'].includes(ext || '')) fileType = 'excel';
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
      console.log("Fetching Excel data...");
      const { data, error } = await supabase
        .from('ccm_invoice_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error in Supabase query:", error);
        throw error;
      }

      console.log("Excel data fetched:", data?.length || 0, "rows");
      
      // Transform data to include validated field if it doesn't exist and ensure row_data is properly typed
      const formattedData = (data || []).map(item => ({
        ...item,
        validated: item.validated === undefined ? false : item.validated,
        row_data: typeof item.row_data === 'string' 
          ? JSON.parse(item.row_data) 
          : item.row_data as Record<string, any>
      })) as ExcelDataItem[];

      setExcelData(formattedData);
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

  const handleFileDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('invoices')
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

  // Initial data fetch
  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    excelData,
    loading,
    excelLoading,
    fetchInvoices,
    fetchExcelData,
    handleStatusChange,
    handleFileDownload
  };
};
