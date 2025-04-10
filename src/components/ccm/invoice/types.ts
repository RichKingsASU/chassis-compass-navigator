
export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  provider: string;
  total_amount_usd: number;
  status?: string;
  fileType?: string;
  reason_for_dispute?: string;
  created_at: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  tags?: string[];
}

export interface ExcelDataItem {
  id: string;
  invoice_id: string;
  sheet_name: string;
  row_data: Record<string, any>;
  created_at: string;
  validated: boolean;
}

export interface InvoiceFilters {
  selectedVendor: string;
  selectedStatus: string;
  selectedFileType: string;
  searchQuery: string;
}
