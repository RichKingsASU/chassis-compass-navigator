
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileType, Upload, FileCheck, Info, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GpsUploadTab = ({ providerName }: { providerName: string }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['.csv', '.xlsx', '.xls', '.pdf'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only CSV, Excel, and PDF files are accepted",
        variant: "destructive"
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const bucketName = `gps-${providerName.toLowerCase().replace(/\s+/g, '-')}`;

    try {
      for (const file of selectedFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (error) throw error;
      }

      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} file(s) uploaded successfully`
      });

      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Upload GPS Data File</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <FileType size={28} className="mb-2 text-primary" />
              <div className="font-medium">CSV File</div>
              <div className="text-xs text-muted-foreground">Most common format</div>
            </div>
            
            <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <FileType size={28} className="mb-2 text-primary" />
              <div className="font-medium">Excel File</div>
              <div className="text-xs text-muted-foreground">XLSX or XLS format</div>
            </div>
            
            <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <FileType size={28} className="mb-2 text-primary" />
              <div className="font-medium">PDF File</div>
              <div className="text-xs text-muted-foreground">For scanned documents</div>
            </div>
          </div>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-2">Drag and drop your {providerName} export file here</div>
            <div className="mt-1 text-sm text-muted-foreground">
              or
            </div>
            <div className="mt-2">
              <Input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls,.pdf"
                className="hidden"
                onChange={handleFileSelect}
                multiple
              />
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                Select File
              </Button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Selected Files:</div>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FileType size={20} className="text-primary" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-muted/30 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Upload Instructions</div>
                <div className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Log into your {providerName} dashboard</li>
                    <li>Navigate to the Reports or Exports section</li>
                    <li>Select "GPS Data Export" and choose the date range</li>
                    <li>Download the file and upload it here</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              <FileCheck size={18} />
              {isUploading ? 'Uploading...' : 'Process Upload'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsUploadTab;
