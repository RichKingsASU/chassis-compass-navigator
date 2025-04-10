
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

export interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormValues) => Promise<void>;
  isUploading: boolean;
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
}
