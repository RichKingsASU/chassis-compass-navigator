import React, { useState } from 'react';
import { Upload, FileText, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedData } from '@/pages/ccm/NewInvoice';
import { Progress } from '@/components/ui/progress';

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
  const [allFiles, setAllFiles] = useState<File[]>([]);

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
    // Add all files to the list
    setAllFiles(prev => [...prev, ...files]);
    
    // Also categorize for backward compatibility
    let pdfFile = uploadedFiles.pdf;
    let excelFile = uploadedFiles.excel;

    files.forEach((file) => {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        pdfFile = file;
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        excelFile = file;
      }
    });

    setUploadedFiles({ pdf: pdfFile, excel: excelFile });
  };

  const removeFile = (index: number) => {
    const fileToRemove = allFiles[index];
    setAllFiles(prev => prev.filter((_, i) => i !== index));
    
    if (uploadedFiles.pdf === fileToRemove) {
      setUploadedFiles(prev => ({ ...prev, pdf: null }));
    }
    if (uploadedFiles.excel === fileToRemove) {
      setUploadedFiles(prev => ({ ...prev, excel: null }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
        description: 'Please upload at least one file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const tempUuid = crypto.randomUUID();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // Find PDF and Excel files (optional - will use first found or null)
      const pdfFile = allFiles.find(f => f.name.toLowerCase().endsWith('.pdf'));
      const excelFile = allFiles.find(f => f.name.toLowerCase().match(/\.(xlsx|xls|csv)$/));

      // Upload PDF if available
      let pdfPath = null;
      if (pdfFile) {
        pdfPath = `vendor/ccm/invoices/${year}/${month}/${tempUuid}/${pdfFile.name}`;
        setUploadProgress(30);
        const { error: pdfError } = await supabase.storage
          .from('ccm-invoices')
          .upload(pdfPath, pdfFile, { upsert: false });

        if (pdfError) throw pdfError;
      }

      // Upload Excel if available
      let excelPath = null;
      if (excelFile) {
        excelPath = `vendor/ccm/invoices/${year}/${month}/${tempUuid}/${excelFile.name}`;
        setUploadProgress(50);
        const { error: excelError } = await supabase.storage
          .from('ccm-invoices')
          .upload(excelPath, excelFile, { upsert: false });

        if (excelError) throw excelError;
      }

      setUploadProgress(70);

      const { data, error } = await supabase.functions.invoke('extract-ccm-invoice', {
        body: {
          pdf_path: pdfPath,
          excel_path: excelPath,
          invoice_id: tempUuid,
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
          Upload any type of files - PDF, Excel, images, documents, etc.
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

      {allFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold">Uploaded Files ({allFiles.length})</h4>
          {allFiles.map((file, index) => {
            const { Icon, color } = getFileIcon(file);
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
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
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Uploading and extracting...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={allFiles.length === 0 || isUploading}
        >
          Continue to Review
        </Button>
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-semibold mb-2">File Upload</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Upload any file type (PDF, Excel, CSV, images, documents, etc.)</li>
          <li>• Multiple files supported - drag and drop or browse</li>
          <li>• Maximum file size: 20MB per file</li>
        </ul>
      </div>
    </Card>
  );
};

export default InvoiceUploadStep;
