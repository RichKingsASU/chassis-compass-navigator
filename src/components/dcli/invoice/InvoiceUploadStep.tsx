import React, { useState } from 'react';
import { Upload, FileText, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
import {
  xlsxFileToCsvBlob,
  makeFolderPath,
  uploadToBucket,
  callExtractInvoice,
} from '@/lib/invoiceClient';

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
  const [isProcessing, setIsProcessing] = useState(false);

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
      if (file.type === 'application/pdf') {
        pdfFile = file;
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
      ) {
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

  async function handleNext() {
    const { pdf, excel } = uploadedFiles;
    if (!pdf || !excel) {
      toast({ title: 'Missing files', description: 'Please upload both PDF and Excel file.', variant: 'destructive' });
      return;
    }

    try {
      setIsProcessing(true);

      // convert Excel to CSV if needed
      let csvBlob: Blob;
      if (/\.(xlsx?|xlsb)$/i.test(excel.name)) {
        csvBlob = await xlsxFileToCsvBlob(excel);
      } else {
        // already CSV
        csvBlob = excel;
      }

      // folder path
      const folder = makeFolderPath({vendor: 'dcli'});

      // upload pdf & csv
      const pdfPath = `${folder}/invoice.pdf`;
      const csvPath = `${folder}/lines.csv`;

      await uploadToBucket({ bucket: 'invoices', path: pdfPath, file: pdf, contentType: 'application/pdf' });
      await uploadToBucket({ bucket: 'invoices', path: csvPath, file: csvBlob, contentType: 'text/csv' });

      // call extraction
      const extraction = await callExtractInvoice({pdfPath, csvPath, requireJwt: true});

      // map extraction into your ExtractedData shape
      const extracted: ExtractedData = {
        invoice: {
          summary_invoice_id: extraction.invoice_id ?? '',
          billing_date: extraction.Header.Invoice_Date ?? '',
          due_date: extraction.Header.Due_Date ?? '',
          billing_terms: '',
          vendor: extraction.Header.Vendor ?? '',
          currency_code: extraction.Header.Currency ?? '',
          amount_due: extraction.totals?.header_total ?? 0,
          status: extraction.status ?? '',
        },
        line_.items: (extraction.Line_Items ?? []).map((item: any) => ({
            invoice_type: '',
            line_invoice_number: '',
            invoice_status: '',
            invoice_total: item.Total_Charge,
            remaining_balance: 0,
            dispute_status: null,
            attachment_count: 0,
            chassis_out: '',
            container_out: '',
            date_out: '',
            container_in: '',
            date_in: '',
            row_data: item.Extra,
        })),
        attachments: [],
        warnings: [],
        source_hash: '',
        excel_headers: []
      };

      setExtractedData(extracted);

      onComplete();
    } catch (err: any) {
      console.error('Extraction failed:', err);
      toast({
        title: 'Extraction Error',
        description: err.message || 'Failed to extract invoice data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }

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
          Upload exactly two files: PDF and Excel
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
          accept=".pdf,.xlsx,.xls"
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
              disabled={isProcessing}
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
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!bothFilesUploaded || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Continue to Review'}
        </Button>
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-semibold mb-2">What files are accepted?</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• PDF: Vendor invoice with summary details</li>
          <li>• Excel: Line-item details (.xlsx or .xls)</li>
          <li>• Maximum file size: 20MB per file</li>
        </ul>
      </div>
    </Card>
  );
};

export default InvoiceUploadStep;
