
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invoiceFormSchema, InvoiceFormValues, InvoiceFormProps } from './schema/invoiceFormSchema';
import PDFUploadTab from './components/PDFUploadTab';
import ExcelUploadTab from './components/ExcelUploadTab';
import InvoiceMetadataFields from './components/InvoiceMetadataFields';

const InvoiceUploadForm: React.FC<InvoiceFormProps> = ({
  onSubmit,
  isUploading,
  openDialog,
  setOpenDialog
}) => {
  const [activeTab, setActiveTab] = useState<"pdf" | "excel">("pdf");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: new Date().toISOString().split('T')[0],
      provider: "CCM",
      total_amount_usd: 0,
      status: "pending",
      reason_for_dispute: "",
      file_type: "pdf",
      tags: "",
    },
  });

  const watchFileType = form.watch("file_type");
  
  // Update the active tab when file_type changes
  React.useEffect(() => {
    setActiveTab(watchFileType as "pdf" | "excel");
  }, [watchFileType]);

  // Update the file_type when active tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as "pdf" | "excel");
    form.setValue("file_type", value as "pdf" | "excel");
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Upload className="h-4 w-4 mr-2" /> 
          Upload Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Invoice</DialogTitle>
          <DialogDescription>
            Complete the form below to upload a new invoice document
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <InvoiceMetadataFields form={form} />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceUploadForm;
