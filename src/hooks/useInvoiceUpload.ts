
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
      
      // 1. Upload file to CCM-specific storage bucket
      console.log("Starting file upload:", { fileName, filePath, fileSize: file.size, fileType: file.type });
      
      const { data: uploadedFile, error: uploadError } = await supabase.storage
        .from('ccm-invoices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error("File upload error details:", {
          error: uploadError,
          message: uploadError.message,
          filePath,
          fileName,
          fileSize: file.size
        });
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      if (!uploadedFile) {
        console.error("No upload data returned but no error");
        throw new Error("File upload failed - no data returned");
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

      // 3. Call the extraction edge function to process the invoice
      try {
        console.log("Calling CCM invoice extraction edge function");
        
        const extractionPayload: any = {
          invoice_id: insertedInvoice.id,
        };

        // Add file paths based on file type
        if (data.file_type === 'pdf' || fileExt === 'pdf') {
          extractionPayload.pdf_path = filePath;
        } else if (data.file_type === 'excel' || ['xlsx', 'xls', 'csv', 'xlsb'].includes(fileExt)) {
          extractionPayload.excel_path = filePath;
        }

        const { data: extractedData, error: extractError } = await supabase.functions.invoke(
          'extract-ccm-invoice',
          {
            body: extractionPayload
          }
        );

        if (extractError) {
          console.error('Extraction error:', extractError);
          toast({
            title: "Warning",
            description: "Invoice was uploaded but extraction failed. You may need to manually enter the data.",
            variant: "destructive",
          });
        } else {
          console.log("Extraction successful:", extractedData);
          
          // Store extracted line items in ccm_invoice_data table
          if (extractedData?.line_items && extractedData.line_items.length > 0) {
            const lineItemsToInsert = extractedData.line_items.map((item: any) => ({
              invoice_id: insertedInvoice.id,
              sheet_name: 'Sheet1',
              row_data: item.row_data || item,
              validated: false,
            }));

            const { error: lineItemsError } = await supabase
              .from('ccm_invoice_data')
              .insert(lineItemsToInsert);

            if (lineItemsError) {
              console.error('Error saving line items:', lineItemsError);
            } else {
              console.log(`Saved ${lineItemsToInsert.length} line items to database`);
            }
          }

          // Update invoice with extracted total if available
          if (extractedData?.invoice?.total_amount_usd) {
            const { error: updateError } = await supabase
              .from('ccm_invoice')
              .update({ total_amount_usd: extractedData.invoice.total_amount_usd })
              .eq('id', insertedInvoice.id);

            if (updateError) {
              console.error('Error updating invoice total:', updateError);
            }
          }
        }
      } catch (extractError) {
        console.error('Error during extraction:', extractError);
        // Don't fail the whole upload if extraction fails
      }
      
      // 4. Refresh the data based on active tab
      await fetchInvoices();
      
      // Always fetch Excel data after Excel file upload
      if (data.file_type === 'excel') {
        await fetchExcelData();
      }
      
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
