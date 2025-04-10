
import React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { InvoiceFormValues } from "../schema/invoiceFormSchema";

interface PDFUploadTabProps {
  form: UseFormReturn<InvoiceFormValues>;
}

const PDFUploadTab: React.FC<PDFUploadTabProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Upload a PDF invoice that will be stored securely and linked to the invoice record
      </div>
      
      <FormField
        control={form.control}
        name="file"
        render={({ field: { onChange, value, ...fieldProps } }) => (
          <FormItem>
            <FormLabel>Upload File</FormLabel>
            <FormControl>
              <Input 
                type="file" 
                accept=".pdf,.eml,.msg,.jpg,.jpeg,.png,.gif" 
                onChange={(e) => onChange(e.target.files)}
                {...fieldProps}
              />
            </FormControl>
            <FormDescription>
              Upload PDF invoices, email attachments (.eml, .msg), or images
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PDFUploadTab;
