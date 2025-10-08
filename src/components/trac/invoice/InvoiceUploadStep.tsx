import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedData } from '@/pages/trac/NewInvoice';
import { Progress } from '@/components/ui/progress';

interface InvoiceUploadStepProps {
  uploadedFiles: { pdf: File | null; excel: File | null };
  setUploadedFiles: React.Dispatch<React.SetStateAction<{ pdf: File | null; excel: File | null }>>;
  onComplete: () => void;
  setExtractedData: React.Dispatch<React.SetStateAction<ExtractedData | null>>;
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    const newFiles = { ...uploadedFiles };

    files.forEach((file) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      console.log('Processing file:', fileName, 'Type:', fileType);

      if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
        newFiles.pdf = file;
        console.log('PDF file detected:', fileName);
      } else if (
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv') ||
        fileType.includes('spreadsheet') ||
        fileType.includes('excel') ||
        fileType.includes('csv')
      ) {
        newFiles.excel = file;
        console.log('Data file detected:', fileName);
      } else {
        console.log('File type not recognized:', fileName, fileType);
        toast({
          title: 'File type not supported',
          description: `${file.name} is not a PDF, Excel, or CSV file`,
          variant: 'destructive',
        });
      }
    });

    setUploadedFiles(newFiles);
  };

  const removeFile = (type: 'pdf' | 'excel') => {
    setUploadedFiles((prev) => ({ ...prev, [type]: null }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const handleContinue = async () => {
    if (!uploadedFiles.pdf || !uploadedFiles.excel) {
      toast({
        title: 'Missing Files',
        description: 'Please upload both PDF and Excel files to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload PDF to storage
      const pdfFileName = `trac_invoices/${Date.now()}_${uploadedFiles.pdf.name}`;
      setUploadProgress(20);
      const { data: pdfData, error: pdfError } = await supabase.storage
        .from('invoice-files')
        .upload(pdfFileName, uploadedFiles.pdf);

      if (pdfError) throw pdfError;

      // Upload Excel to storage
      const excelFileName = `trac_invoices/${Date.now()}_${uploadedFiles.excel.name}`;
      setUploadProgress(40);
      const { data: excelData, error: excelError } = await supabase.storage
        .from('invoice-files')
        .upload(excelFileName, uploadedFiles.excel);

      if (excelError) throw excelError;

      setUploadProgress(60);

      // For TRAC, we'll use a simplified extraction (you can create a TRAC-specific edge function later)
      // For now, we'll create a basic extracted data structure
      const mockExtractedData: ExtractedData = {
        invoice: {
          summary_invoice_id: `TRAC-${Date.now()}`,
          billing_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          billing_terms: 'Net 30',
          vendor: 'TRAC',
          currency_code: 'USD',
          amount_due: 0,
          status: 'pending',
        },
        line_items: [],
        attachments: [
          { name: uploadedFiles.pdf.name, path: pdfData.path },
          { name: uploadedFiles.excel.name, path: excelData.path },
        ],
        warnings: ['Please review and complete invoice details in the next step'],
        source_hash: '',
        excel_headers: [],
      };

      setUploadProgress(100);
      setExtractedData(mockExtractedData);

      toast({
        title: 'Upload Successful',
        description: 'Files uploaded successfully. Please review the invoice details.',
      });

      onComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice Documents</CardTitle>
        <CardDescription>
          Upload both PDF and Excel files for the TRAC invoice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drag and Drop Area */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">Drag and drop files here</p>
          <p className="text-sm text-muted-foreground mb-4">or</p>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              Browse Files
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileInput}
              />
            </label>
          </Button>
        </div>

        {/* Uploaded Files Display */}
        {(uploadedFiles.pdf || uploadedFiles.excel) && (
          <div className="space-y-3">
            <h4 className="font-semibold">Uploaded Files</h4>
            {uploadedFiles.pdf && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-sm">{uploadedFiles.pdf.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFiles.pdf.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('pdf')}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {uploadedFiles.excel && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">{uploadedFiles.excel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFiles.excel.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('excel')}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-muted-foreground">
              Uploading files... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleContinue}
            disabled={!uploadedFiles.pdf || !uploadedFiles.excel || isUploading}
            size="lg"
          >
            {isUploading ? 'Processing...' : 'Continue to Review'}
          </Button>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Required Files
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>PDF invoice document</li>
                <li>Excel (.xlsx, .xls) or CSV file with invoice line items</li>
              </ul>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Maximum file size: 50MB per file
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceUploadStep;
