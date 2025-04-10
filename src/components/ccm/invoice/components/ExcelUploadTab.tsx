
import React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { InvoiceFormValues } from "../schema/invoiceFormSchema";

interface ExcelUploadTabProps {
  form: UseFormReturn<InvoiceFormValues>;
}

const ExcelUploadTab: React.FC<ExcelUploadTabProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Upload an Excel file (.xlsx or .xls) containing structured invoice data. 
        The system will parse the file and store the data in the database.
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
                accept=".xlsx,.xls,.csv" 
                onChange={(e) => onChange(e.target.files)}
                {...fieldProps}
              />
            </FormControl>
            <FormDescription>
              Upload Excel (.xlsx, .xls) or CSV spreadsheets
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ExcelUploadTab;
