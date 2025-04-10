
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileSpreadsheet } from 'lucide-react';
import { UseFormReturn } from "react-hook-form";
import { InvoiceFormValues } from '../schema/invoiceFormSchema';
import PDFUploadTab from './PDFUploadTab';
import ExcelUploadTab from './ExcelUploadTab';

interface InvoiceUploadTabsProps {
  form: UseFormReturn<InvoiceFormValues>;
  activeTab: "pdf" | "excel";
  handleTabChange: (value: string) => void;
}

const InvoiceUploadTabs: React.FC<InvoiceUploadTabsProps> = ({
  form,
  activeTab,
  handleTabChange
}) => {
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pdf" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          PDF File
        </TabsTrigger>
        <TabsTrigger value="excel" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Excel File
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pdf" className="mt-4">
        <PDFUploadTab form={form} />
      </TabsContent>
      
      <TabsContent value="excel" className="mt-4">
        <ExcelUploadTab form={form} />
      </TabsContent>
    </Tabs>
  );
};

export default InvoiceUploadTabs;
