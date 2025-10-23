import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
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
  const [allFiles, setAllFiles] = useState<File[]>([]);

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

  const handleContinue = async () => {
    if (allFiles.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload at least one file to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Find PDF and Excel files from all uploaded files
      const pdfFile = allFiles.find(f => f.name.toLowerCase().endsWith('.pdf'));
      const excelFile = allFiles.find(f => f.name.toLowerCase().match(/\.(xlsx|xls|csv)$/));

      if (!pdfFile || !excelFile) {
        toast({
          title: 'Missing Required Files',
          description: 'Please upload at least one PDF and one Excel/CSV file.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      // Upload PDF
      const pdfFileName = `dcli/${Date.now()}_${pdfFile.name}`;
      setUploadProgress(20);
      const { data: pdfData, error: pdfError } = await supabase.storage
        .from('invoices')
        .upload(pdfFileName, pdfFile);

      if (pdfError) throw pdfError;

      // Upload Excel
      const excelFileName = `dcli/${Date.now()}_${excelFile.name}`;
      setUploadProgress(40);
      const { data: excelData, error: excelError } = await supabase.storage
        .from('invoices')
        .upload(excelFileName, excelFile);

      if (excelError) throw excelError;

      setUploadProgress(60);

      // Call extraction function
      const { data: extractResult, error: extractError } = await supabase.functions.invoke(
        'extract-dcli-invoice',
        {
          body: {
            pdf_path: pdfData.path,
            xlsx_path: excelData.path,
          },
        }
      );

      if (extractError) throw extractError;

      setUploadProgress(100);
      setExtractedData(extractResult);

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
