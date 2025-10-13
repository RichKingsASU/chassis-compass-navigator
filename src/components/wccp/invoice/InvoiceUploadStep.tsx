import React, { useState } from 'react';
import { Upload, FileText, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceData {
  summary_invoice_id: string;
  billing_date: string;
  due_date: string;
  billing_terms: string;
  vendor: string;
  currency_code: string;
  amount_due: number;
  status: string;
  account_code?: string;
}

export interface LineItem {
  invoice_type: string;
  line_invoice_number: string;
  invoice_status: string;
  invoice_total: number;
  remaining_balance: number;
  dispute_status: string | null;
  attachment_count: number;
  chassis: string;
  container_out: string;
  date_out: string;
  container_in: string;
  date_in: string;
  row_data?: Record<string, any>;
}

export interface ExtractedData {
  invoice: InvoiceData;
  line_items: LineItem[];
  attachments: Array<{ name: string; path: string }>;
  warnings: string[];
  source_hash: string;
  excel_headers?: string[];
}

interface InvoiceUploadStepProps {
  uploadedFiles: { pdf: File | null; excel: File | null };
  setUploadedFiles: React.Dispatch<React.SetStateAction<{ pdf: File | null; excel: File | null }>>;
  onComplete: () => void;
  setExtractedData: (data: ExtractedData) => void;
}

const InvoiceUploadStep: React.FC<InvoiceUploadStepProps> = ({
  uploadedFiles,
  setUploadedFiles,
  onComplete,
  setExtractedData,
}) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    let pdfFile = uploadedFiles.pdf;
    let excelFile = uploadedFiles.excel;

    files.forEach((file) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type;
      
      // Detect PDF files
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        pdfFile = file;
      }
      // Detect Excel/CSV files
      else if (
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel' ||
        fileType === 'text/csv' ||
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv')
      ) {
        excelFile = file;
      }
      // If type can't be determined, assign in order
      else if (!pdfFile) {
        pdfFile = file;
      } else if (!excelFile) {
        excelFile = file;
      }
    });

    setUploadedFiles({ pdf: pdfFile, excel: excelFile });
  };

  const removeFile = (type: 'pdf' | 'excel') => {
    setUploadedFiles((prev) => ({ ...prev, [type]: null }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleContinue = async () => {
    if (!uploadedFiles.pdf || !uploadedFiles.excel) {
      toast({
        title: 'Missing Files',
        description: 'Please upload exactly two files.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique invoice ID
      const tempUuid = crypto.randomUUID();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // Upload to WCCP-specific bucket
      const pdfPath = `vendor/wccp/invoices/${year}/${month}/${tempUuid}/${uploadedFiles.pdf.name}`;
      setUploadProgress(30);
      const { error: pdfError } = await supabase.storage
        .from('wccp-invoices')
        .upload(pdfPath, uploadedFiles.pdf, { upsert: false });

      if (pdfError) throw pdfError;

      // Upload Excel
      const excelPath = `vendor/wccp/invoices/${year}/${month}/${tempUuid}/${uploadedFiles.excel.name}`;
      setUploadProgress(50);
      const { error: excelError } = await supabase.storage
        .from('wccp-invoices')
        .upload(excelPath, uploadedFiles.excel, { upsert: false });

      if (excelError) throw excelError;

      setUploadProgress(70);

      // Call extraction edge function
      const { data, error } = await supabase.functions.invoke('extract-wccp-invoice', {
        body: {
          pdf_path: pdfPath,
          xlsx_path: excelPath,
          tenant_id: 'default',
          uploader_user_id: 'current_user',
        },
      });

      if (error) throw error;

      setUploadProgress(100);
      setExtractedData(data);

      toast({
        title: 'Files Uploaded',
        description: 'Invoice data extracted successfully.',
      });

      onComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload files.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const bothFilesUploaded = uploadedFiles.pdf && uploadedFiles.excel;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Invoice Files</h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-semibold mb-2">Drop your files here</p>
        <p className="text-sm text-muted-foreground mb-4">
          Upload exactly two files (any format)
        </p>
        <label htmlFor="file-input">
          <Button variant="outline" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
        <input
          id="file-input"
          type="file"
          className="hidden"
          multiple
          onChange={handleFileInput}
        />
      </div>

      {/* File chips */}
      <div className="mt-6 space-y-3">
        {uploadedFiles.pdf && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">{uploadedFiles.pdf.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadedFiles.pdf.size)} • PDF
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFile('pdf')}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {uploadedFiles.excel && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">{uploadedFiles.excel.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadedFiles.excel.size)} • Excel
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFile('excel')}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Uploading and extracting...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!bothFilesUploaded || isUploading}
        >
          Continue to Review
        </Button>
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-semibold mb-2">What files are accepted?</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Any file format is accepted</li>
          <li>• Upload exactly two files</li>
          <li>• Maximum file size: 20MB per file</li>
        </ul>
      </div>
    </Card>
  );
};

export default InvoiceUploadStep;
