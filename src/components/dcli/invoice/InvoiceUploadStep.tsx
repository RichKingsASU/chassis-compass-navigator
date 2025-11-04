import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, FileSpreadsheet, X, AlertCircle, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
import { Progress } from '@/components/ui/progress';
import { 
  uploadFileToInvoiceFolder, 
  checkInvoiceFolderExists, 
  extractInvoiceNumberFromFilename,
  type InvoiceAttachment 
} from '@/lib/invoiceStorage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);
  const [showExistingFolderDialog, setShowExistingFolderDialog] = useState(false);
  const [existingFolder, setExistingFolder] = useState<{ exists: boolean; files: InvoiceAttachment[]; invoice_number: string } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
    // Add all files to the list
    setAllFiles(prev => [...prev, ...files]);
    
    // Also categorize for backward compatibility
    const newFiles = { ...uploadedFiles };
    files.forEach((file) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
        newFiles.pdf = file;
      } else if (
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv') ||
        fileType.includes('spreadsheet') ||
        fileType.includes('excel') ||
        fileType.includes('csv')
      ) {
        newFiles.excel = file;
      }
    });

    setUploadedFiles(newFiles);
  };

  const removeFile = (index: number) => {
    const fileToRemove = allFiles[index];
    setAllFiles(prev => prev.filter((_, i) => i !== index));
    
    // Also update categorized files if needed
    if (uploadedFiles.pdf === fileToRemove) {
      setUploadedFiles(prev => ({ ...prev, pdf: null }));
    }
    if (uploadedFiles.excel === fileToRemove) {
      setUploadedFiles(prev => ({ ...prev, excel: null }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const getFileIcon = (file: File) => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.pdf')) return { Icon: FileText, color: 'text-red-500' };
    if (fileName.match(/\.(xlsx|xls|csv)$/)) return { Icon: FileSpreadsheet, color: 'text-green-500' };
    return { Icon: Upload, color: 'text-blue-500' };
  };

  const handleInvoiceNumberSubmit = async () => {
    if (!invoiceNumber.trim()) {
      toast({
        title: 'Invoice Number Required',
        description: 'Please enter an invoice number to organize files.',
        variant: 'destructive',
      });
      return;
    }

    // Check if folder exists
    const folderCheck = await checkInvoiceFolderExists('dcli', invoiceNumber);
    
    if (folderCheck.exists && folderCheck.files.length > 0) {
      setExistingFolder(folderCheck);
      setShowExistingFolderDialog(true);
      setShowInvoicePrompt(false);
    } else {
      // Folder doesn't exist, proceed with upload
      setShowInvoicePrompt(false);
      proceedWithUpload(false);
    }
  };

  const handleAddToExisting = () => {
    setShowExistingFolderDialog(false);
    proceedWithUpload(false);
  };

  const handleReplaceAll = () => {
    setShowExistingFolderDialog(false);
    proceedWithUpload(true);
  };

  const proceedWithUpload = async (replaceExisting: boolean) => {
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const uploadedAttachments: InvoiceAttachment[] = [];
      const progressPerFile = 80 / allFiles.length;

      // Upload all files to invoice-specific folders
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const attachment = await uploadFileToInvoiceFolder('dcli', invoiceNumber, file);
        uploadedAttachments.push(attachment);
        setUploadProgress(10 + (i + 1) * progressPerFile);
      }

      setUploadProgress(90);

      // Find PDF and Excel for extraction
      const pdfAttachment = uploadedAttachments.find(a => a.type === 'pdf');
      const excelAttachment = uploadedAttachments.find(a => a.type === 'excel');

      if (!pdfAttachment || !excelAttachment) {
        toast({
          title: 'Missing Required Files',
          description: 'At least one PDF and one Excel file are required for extraction.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      // Call extraction function with all file paths
      const { data: extractResult, error: extractError } = await supabase.functions.invoke(
        'extract-dcli-invoice',
        {
          body: {
            invoice_number: invoiceNumber,
            pdf_path: pdfAttachment.path,
            xlsx_path: excelAttachment.path,
            all_attachments: uploadedAttachments,
          },
        }
      );

      if (extractError) throw extractError;

      setUploadProgress(100);
      
      // Add attachments to extracted data
      const dataWithAttachments = {
        ...extractResult,
        attachments: uploadedAttachments,
        invoice: {
          ...extractResult.invoice,
          summary_invoice_id: invoiceNumber,
        },
      };
      
      setExtractedData(dataWithAttachments);

      toast({
        title: 'Files Uploaded',
        description: `${uploadedAttachments.length} files uploaded and organized in invoice ${invoiceNumber}.`,
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

  const handleContinue = async () => {
    if (allFiles.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload at least one file to continue.',
        variant: 'destructive',
      });
      return;
    }

    // Check if we have at least PDF and Excel
    const hasPdf = allFiles.some(f => f.name.toLowerCase().endsWith('.pdf'));
    const hasExcel = allFiles.some(f => f.name.toLowerCase().match(/\.(xlsx|xls|csv)$/));

    if (!hasPdf || !hasExcel) {
      toast({
        title: 'Missing Required Files',
        description: 'Please upload at least one PDF and one Excel/CSV file.',
        variant: 'destructive',
      });
      return;
    }

    // Try to extract invoice number from PDF filename
    const pdfFile = allFiles.find(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFile) {
      const extractedNumber = extractInvoiceNumberFromFilename(pdfFile.name);
      if (extractedNumber) {
        setInvoiceNumber(extractedNumber);
      }
    }

    // Show prompt for invoice number
    setShowInvoicePrompt(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice Documents</CardTitle>
        <CardDescription>
          Upload any type of files for the DCLI invoice
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
                onChange={handleFileInput}
              />
            </label>
          </Button>
        </div>

        {/* Uploaded Files Display */}
        {allFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Uploaded Files ({allFiles.length})</h4>
            {allFiles.map((file, index) => {
              const { Icon, color } = getFileIcon(file);
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
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
            disabled={allFiles.length === 0 || isUploading}
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
                File Upload
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Upload any file type (PDF, Excel, CSV, images, documents, etc.)</li>
                <li>Multiple files supported</li>
                <li>Drag and drop or browse to select files</li>
                <li>Files will be organized by invoice number in separate folders</li>
              </ul>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Maximum file size: 50MB per file
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Invoice Number Dialog */}
      <AlertDialog open={showInvoicePrompt} onOpenChange={setShowInvoicePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Invoice Number</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide the invoice number to organize these files properly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g., 1043381"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleInvoiceNumberSubmit}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Existing Folder Dialog */}
      <AlertDialog open={showExistingFolderDialog} onOpenChange={setShowExistingFolderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-yellow-500" />
              Invoice Folder Already Exists
            </AlertDialogTitle>
            <AlertDialogDescription>
              Invoice {existingFolder?.invoice_number} already has {existingFolder?.files.length || 0} uploaded file(s).
              What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold mb-2">Existing files:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {existingFolder?.files.slice(0, 5).map((file, idx) => (
                <li key={idx}>• {file.name} ({(file.size_bytes / 1024).toFixed(1)} KB)</li>
              ))}
              {existingFolder && existingFolder.files.length > 5 && (
                <li>• ... and {existingFolder.files.length - 5} more</li>
              )}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleAddToExisting}>
              Add Files
            </Button>
            <Button variant="destructive" onClick={handleReplaceAll}>
              Replace All
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default InvoiceUploadStep;
