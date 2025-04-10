
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { invoiceFormSchema, InvoiceFormValues, InvoiceFormProps } from './schema/invoiceFormSchema';
import InvoiceUploadTabs from './components/InvoiceUploadTabs';
import InvoiceMetadataFields from './components/InvoiceMetadataFields';
import InvoiceFormFooter from './components/InvoiceFormFooter';

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

  const handleCancel = () => {
    setOpenDialog(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <InvoiceUploadTabs 
          form={form}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
        />
        
        <InvoiceMetadataFields form={form} />
        
        <InvoiceFormFooter 
          isUploading={isUploading}
          onCancel={handleCancel}
        />
      </form>
    </Form>
  );
};

export default InvoiceUploadForm;
