
import React from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
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
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: new Date().toISOString().split('T')[0],
      provider: "CCM",
      total_amount_usd: 0,
      status: "pending",
      reason_for_dispute: "",
    },
  });

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Upload className="h-4 w-4 mr-2" /> 
          Upload Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Invoice</DialogTitle>
          <DialogDescription>
            Complete the form below to upload a new invoice
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="file"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload File</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept=".pdf,.xlsx,.csv,.eml,.msg,.jpg,.jpeg,.png,.gif" 
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload PDF invoices, Excel/CSV spreadsheets, email attachments (.eml, .msg), or images
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
