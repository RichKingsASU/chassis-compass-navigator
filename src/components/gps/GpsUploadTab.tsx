import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileType, Upload, FileCheck, Info, X, CalendarIcon, Eye, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface SheetPreview {
  sheetName: string;
  headers: string[];
  rows: any[][];
  totalRows: number;
  approved: boolean;
}

interface PreviewData {
  sheets: SheetPreview[];
}

const GpsUploadTab = ({ providerName }: { providerName: string }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dataDate, setDataDate] = useState<Date>();
  const [notes, setNotes] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
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

  const processFiles = async (files: File[]) => {
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
    
    // Auto-preview first file if it's CSV or Excel
    if (validFiles.length > 0) {
      const firstFile = validFiles[0];
      const extension = firstFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
        await parseAndPreview(firstFile);
      }
    }
  };

  const parseAndPreview = async (file: File) => {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const sheets: SheetPreview[] = [];
      
      if (extension === 'csv') {
        const text = await file.text();
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const dataRows = rows.slice(1, 11); // Preview first 10 rows
        
        sheets.push({
          sheetName: file.name,
          headers,
          rows: dataRows,
          totalRows: rows.length - 1,
          approved: false
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        
        // Parse all sheets
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          
          if (jsonData.length > 0) {
            sheets.push({
              sheetName,
              headers: jsonData[0] || [],
              rows: jsonData.slice(1, 11), // Preview first 10 rows
              totalRows: jsonData.length - 1,
              approved: false
            });
          }
        });
      }
      
      setPreviewData({ sheets });
      setShowPreview(true);
      setCurrentPreviewIndex(0);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Parse error",
        description: "Failed to preview file content",
        variant: "destructive"
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setPreviewData(null);
      setShowPreview(false);
      setCurrentPreviewIndex(0);
    }
  };

  const toggleSheetApproval = (index: number) => {
    if (!previewData) return;
    
    const updatedSheets = [...previewData.sheets];
    updatedSheets[index].approved = !updatedSheets[index].approved;
    setPreviewData({ sheets: updatedSheets });
  };

  const approveAllSheets = () => {
    if (!previewData) return;
    
    const updatedSheets = previewData.sheets.map(sheet => ({
      ...sheet,
      approved: true
    }));
    setPreviewData({ sheets: updatedSheets });
  };

  const getApprovedCount = () => {
    return previewData?.sheets.filter(s => s.approved).length || 0;
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

    if (!dataDate) {
      toast({
        title: "Date required",
        description: "Please select the GPS data date",
        variant: "destructive"
      });
      return;
    }

    const approvedCount = getApprovedCount();
    if (approvedCount === 0) {
      toast({
        title: "No sheets approved",
        description: "Please approve at least one sheet before uploading",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const bucketName = 'gps-uploads';

    try {
      for (const file of selectedFiles) {
        const fileName = `${providerName}/${Date.now()}-${file.name}`;
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        
        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Calculate row count for approved sheets only
        let rowCount = 0;
        if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
          const extension = file.name.split('.').pop()?.toLowerCase();

          if (extension === 'csv') {
            const text = await file.text();
            const parsedData = text.split('\n').map(row => row.split(','));
            rowCount = parsedData.length - 1;
          } else if (extension === 'xlsx' || extension === 'xls') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            
            // Only count rows from approved sheets
            previewData?.sheets.forEach((sheetPreview, index) => {
              if (sheetPreview.approved) {
                const sheet = workbook.Sheets[workbook.SheetNames[index]];
                const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                rowCount += Math.max(0, parsedData.length - 1);
              }
            });
          }
        }

        // Create upload record in database
        const { data: uploadRecord, error: dbError } = await supabase
          .from('gps_uploads')
          .insert({
            provider: providerName,
            file_name: file.name,
            file_path: uploadData.path,
            file_type: fileExtension,
            data_date: format(dataDate, 'yyyy-MM-dd'),
            notes: notes || null,
            status: 'uploaded',
            row_count: rowCount
          })
          .select()
          .single();

        if (dbError) throw dbError;
      }

      toast({
        title: "Upload successful",
        description: `${approvedCount} sheet(s) uploaded successfully`
      });

      // Reset form
      setSelectedFiles([]);
      setDataDate(undefined);
      setNotes('');
      setPreviewData(null);
      setShowPreview(false);
      setCurrentPreviewIndex(0);
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
                  <div className="flex gap-2">
                    {(file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => parseAndPreview(file)}
                      >
                        <Eye size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid gap-4 border rounded-lg p-4 bg-muted/30">
            <div className="font-medium">Upload Details</div>
            
            <div className="grid gap-2">
              <Label htmlFor="data-date">GPS Data Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dataDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataDate ? format(dataDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataDate}
                    onSelect={setDataDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                The date this GPS data represents
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this upload..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Data Preview with Sheet Navigation */}
          {showPreview && previewData && previewData.sheets.length > 0 && (
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="font-medium">
                    {previewData.sheets.length > 1 
                      ? `Sheet ${currentPreviewIndex + 1} of ${previewData.sheets.length}: ${previewData.sheets[currentPreviewIndex].sheetName}`
                      : 'Data Preview'
                    }
                  </div>
                  {previewData.sheets.length > 1 && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                        disabled={currentPreviewIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPreviewIndex(Math.min(previewData.sheets.length - 1, currentPreviewIndex + 1))}
                        disabled={currentPreviewIndex === previewData.sheets.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getApprovedCount()} of {previewData.sheets.length} sheet(s) approved
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant={previewData.sheets[currentPreviewIndex].approved ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSheetApproval(currentPreviewIndex)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {previewData.sheets[currentPreviewIndex].approved ? 'Approved' : 'Approve This Sheet'}
                </Button>
                {previewData.sheets.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={approveAllSheets}
                  >
                    Approve All Sheets
                  </Button>
                )}
              </div>
              
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {previewData.sheets[currentPreviewIndex].headers.map((header, i) => (
                        <th key={i} className="text-left p-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.sheets[currentPreviewIndex].rows.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        {row.map((cell, j) => (
                          <td key={j} className="p-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Showing first 10 of {previewData.sheets[currentPreviewIndex].totalRows} rows in this sheet
              </div>
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
                    <li>Preview and approve each sheet before processing</li>
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
              disabled={selectedFiles.length === 0 || isUploading || !dataDate || getApprovedCount() === 0}
            >
              <FileCheck size={18} />
              {isUploading ? 'Uploading...' : `Process Upload (${getApprovedCount()} Approved Sheet${getApprovedCount() !== 1 ? 's' : ''})`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsUploadTab;
