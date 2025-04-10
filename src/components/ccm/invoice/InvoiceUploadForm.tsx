
import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";

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

interface InvoiceUploadFormProps {
  onSubmit: (data: InvoiceFormValues) => Promise<void>;
  isUploading: boolean;
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
}

const InvoiceUploadForm: React.FC<InvoiceUploadFormProps> = ({
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
              
              <FormField
                control={form.control}
                name="file_type"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <TabsContent value="pdf" className="mt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Upload a PDF invoice that will be stored securely and linked to the invoice record
                </div>
              </TabsContent>
              
              <TabsContent value="excel" className="mt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Upload an Excel file (.xlsx or .xls) containing structured invoice data. 
                  The system will parse the file and store the data in the database.
                </div>
              </TabsContent>
            </Tabs>
            
            <FormField
              control={form.control}
              name="invoice_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="total_amount_usd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason_for_dispute"
              render={({ field }) => (
                <FormItem className={form.watch("status") !== "disputed" ? "hidden" : ""}>
                  <FormLabel>Reason for Dispute</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe the reason for dispute" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tags separated by commas" {...field} />
                  </FormControl>
                  <FormDescription>
                    Add tags to organize your invoices (e.g. "Q2, 2025, California")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload File</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept={activeTab === "pdf" ? 
                        ".pdf,.eml,.msg,.jpg,.jpeg,.png,.gif" : 
                        ".xlsx,.xls,.csv"} 
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormDescription>
                    {activeTab === "pdf" 
                      ? "Upload PDF invoices, email attachments (.eml, .msg), or images" 
                      : "Upload Excel (.xlsx, .xls) or CSV spreadsheets"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
