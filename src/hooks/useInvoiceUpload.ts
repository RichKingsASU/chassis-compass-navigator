
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseExcelFile } from '@/utils/excelParser';
import { z } from "zod";

// Define form schema for invoice upload
export const invoiceFormSchema = z.object({
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

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const useInvoiceUpload = (fetchInvoices: () => Promise<void>, fetchExcelData: () => Promise<void>, activeTab: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsUploading(true);
    
    try {
      const file = data.file[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${Date.now()}_${data.invoice_number}.${fileExt}`;
      const filePath = `ccm_invoices/${fileName}`;
      
      console.log("Uploading file to path:", filePath);
      
      // Parse tags if provided
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      
      // 1. Upload file to storage - USING THE CORRECT BUCKET NAME
      const { data: uploadedFile, error: uploadError } = await supabase.storage
        .from('invoices')  // Changed from 'invoice_files' to 'invoices'
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      console.log("File uploaded successfully:", uploadedFile);
      
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
        
      if (insertError) {
        console.error("Invoice insert error:", insertError);
        throw new Error(`Failed to save invoice data: ${insertError.message}`);
      }

      console.log("Invoice inserted successfully:", insertedInvoice);

      // 3. If it's an Excel file, parse the data
      if (data.file_type === 'excel' && ['xlsx', 'xls', 'csv'].includes(fileExt)) {
        try {
          console.log("Starting Excel parsing for invoice:", insertedInvoice.id);
          await parseExcelFile(file, insertedInvoice.id);
          
          // Refresh Excel data if we're on the Excel data tab
          if (activeTab === 'excel-data') {
            await fetchExcelData();
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
        description: error instanceof Error ? error.message : "Failed to upload invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    openDialog,
    setOpenDialog,
    onSubmit
  };
};
