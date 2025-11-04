import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for managing invoice file storage with organized folder structure
 */

export interface InvoiceAttachment {
  name: string;
  path: string;
  type: 'pdf' | 'excel' | 'email' | 'image' | 'document' | 'other';
  uploaded_at: string;
  size_bytes: number;
}

export interface ExistingFolder {
  exists: boolean;
  files: InvoiceAttachment[];
  invoice_number: string;
}

/**
 * Generate standardized folder path for invoice files
 * Format: vendor/invoiceNumber/
 */
export function generateInvoiceFolderPath(vendor: string, invoiceNumber: string): string {
  return `${vendor.toLowerCase()}/${invoiceNumber}/`;
}

/**
 * Get subfolder path for specific file types
 */
export function getSubfolderPath(vendor: string, invoiceNumber: string, fileType: 'pdf' | 'excel' | 'supporting_docs'): string {
  const basePath = generateInvoiceFolderPath(vendor, invoiceNumber);
  return `${basePath}${fileType}/`;
}

/**
 * Determine file type from filename and MIME type
 */
export function determineFileType(file: File): InvoiceAttachment['type'] {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (fileName.endsWith('.pdf') || mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (fileName.match(/\.(xlsx|xls|csv)$/) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'excel';
  }
  if (fileName.match(/\.(eml|msg)$/) || mimeType.includes('message')) {
    return 'email';
  }
  if (fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || mimeType.includes('image')) {
    return 'image';
  }
  if (fileName.match(/\.(doc|docx|txt|rtf)$/)) {
    return 'document';
  }
  return 'other';
}

/**
 * Check if invoice folder exists and return existing files
 */
export async function checkInvoiceFolderExists(
  vendor: string,
  invoiceNumber: string
): Promise<ExistingFolder> {
  try {
    const folderPath = generateInvoiceFolderPath(vendor, invoiceNumber);
    
    const { data: files, error } = await supabase.storage
      .from('invoices')
      .list(folderPath, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      console.error('Error checking folder:', error);
      return { exists: false, files: [], invoice_number: invoiceNumber };
    }

    // If no files found, folder doesn't exist
    if (!files || files.length === 0) {
      return { exists: false, files: [], invoice_number: invoiceNumber };
    }

    // Convert storage files to attachment format
    const attachments: InvoiceAttachment[] = await Promise.all(
      files.map(async (file) => {
        const fullPath = `${folderPath}${file.name}`;
        return {
          name: file.name,
          path: fullPath,
          type: determineFileTypeFromName(file.name),
          uploaded_at: file.created_at || new Date().toISOString(),
          size_bytes: file.metadata?.size || 0,
        };
      })
    );

    return {
      exists: true,
      files: attachments,
      invoice_number: invoiceNumber,
    };
  } catch (error) {
    console.error('Error in checkInvoiceFolderExists:', error);
    return { exists: false, files: [], invoice_number: invoiceNumber };
  }
}

/**
 * Helper to determine file type from filename (for existing files)
 */
function determineFileTypeFromName(fileName: string): InvoiceAttachment['type'] {
  const name = fileName.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.match(/\.(xlsx|xls|csv)$/)) return 'excel';
  if (name.match(/\.(eml|msg)$/)) return 'email';
  if (name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) return 'image';
  if (name.match(/\.(doc|docx|txt|rtf)$/)) return 'document';
  return 'other';
}

/**
 * Upload file to invoice-specific folder
 */
export async function uploadFileToInvoiceFolder(
  vendor: string,
  invoiceNumber: string,
  file: File,
  subfolder?: 'pdf' | 'excel' | 'supporting_docs'
): Promise<InvoiceAttachment> {
  const fileType = determineFileType(file);
  
  // Determine the upload path
  let uploadPath: string;
  if (subfolder) {
    uploadPath = getSubfolderPath(vendor, invoiceNumber, subfolder);
  } else {
    // Auto-determine subfolder based on file type
    if (fileType === 'pdf') {
      uploadPath = getSubfolderPath(vendor, invoiceNumber, 'pdf');
    } else if (fileType === 'excel') {
      uploadPath = getSubfolderPath(vendor, invoiceNumber, 'excel');
    } else {
      uploadPath = getSubfolderPath(vendor, invoiceNumber, 'supporting_docs');
    }
  }

  const fileName = `${Date.now()}_${file.name}`;
  const fullPath = `${uploadPath}${fileName}`;

  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload ${file.name}: ${error.message}`);
  }

  return {
    name: file.name,
    path: data.path,
    type: fileType,
    uploaded_at: new Date().toISOString(),
    size_bytes: file.size,
  };
}

/**
 * Get all attachments for an invoice from the database
 */
export async function getInvoiceAttachments(
  vendor: string,
  invoiceNumber: string
): Promise<InvoiceAttachment[]> {
  try {
    const { data, error } = await supabase
      .from('dcli_invoice_staging')
      .select('attachments')
      .eq('summary_invoice_id', invoiceNumber)
      .eq('vendor', vendor.toUpperCase())
      .single();

    if (error || !data) {
      console.error('Error fetching attachments:', error);
      return [];
    }

    return (data.attachments as unknown as InvoiceAttachment[]) || [];
  } catch (error) {
    console.error('Error in getInvoiceAttachments:', error);
    return [];
  }
}

/**
 * Extract invoice number from PDF filename or content (placeholder for future implementation)
 */
export function extractInvoiceNumberFromFilename(fileName: string): string | null {
  // Try to extract invoice number from filename
  // Common patterns: Invoice_123456.pdf, 123456_Invoice.pdf, DCLI-123456.pdf
  const patterns = [
    /invoice[_-]?(\d{6,})/i,
    /(\d{6,})[_-]?invoice/i,
    /[_-](\d{6,})[_-\.]/i,
  ];

  for (const pattern of patterns) {
    const match = fileName.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Delete all files in an invoice folder
 */
export async function deleteInvoiceFolder(vendor: string, invoiceNumber: string): Promise<void> {
  const folderPath = generateInvoiceFolderPath(vendor, invoiceNumber);
  
  // List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from('invoices')
    .list(folderPath);

  if (listError || !files) {
    throw new Error(`Failed to list files for deletion: ${listError?.message}`);
  }

  // Delete all files
  const filePaths = files.map(file => `${folderPath}${file.name}`);
  
  if (filePaths.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from('invoices')
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Failed to delete files: ${deleteError.message}`);
    }
  }
}
