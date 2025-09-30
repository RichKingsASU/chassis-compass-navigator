import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle, X, File, Image, FileType, CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DocumentUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>();
  const [totalAmount, setTotalAmount] = useState('');
  const [provider, setProvider] = useState('CCM');
  const [status, setStatus] = useState('pending');
  const [reasonForDispute, setReasonForDispute] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext || '')) return <Image className="h-5 w-5 text-blue-500" />;
    if (['pdf'].includes(ext || '')) return <FileText className="h-5 w-5 text-red-500" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileType className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !invoiceNumber || !invoiceDate || !totalAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const fileName = `${Date.now()}_${invoiceNumber}.${fileExt}`;
        const filePath = `ccm_invoices/${fileName}`;
        
        console.log("Starting file upload:", { fileName, filePath, fileSize: file.size, fileType: file.type });
        
        // Upload file to Supabase storage
        const { data: uploadedFile, error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error("File upload error details:", {
            error: uploadError,
            message: uploadError.message,
            filePath,
            fileName,
            fileSize: file.size
          });
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        if (!uploadedFile) {
          console.error("No upload data returned but no error");
          throw new Error(`File upload failed for ${file.name} - no data returned`);
        }

        console.log("File uploaded successfully:", uploadedFile);

        // Parse tags if provided
        const tagsArray = tags 
          ? tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          : [];

        // Insert invoice data into the database
        const { data: insertedInvoice, error: insertError } = await supabase
          .from('ccm_invoice')
          .insert({
            invoice_number: invoiceNumber,
            invoice_date: format(invoiceDate, 'yyyy-MM-dd'),
            provider: provider,
            total_amount_usd: parseFloat(totalAmount),
            status: status,
            reason_for_dispute: reasonForDispute || null,
            file_path: filePath,
            file_name: file.name,
            file_type: fileExt,
            tags: tagsArray.length > 0 ? tagsArray : null,
          })
          .select()
          .single();
          
        if (insertError) {
          console.error("Invoice insert error:", insertError);
          throw new Error(`Failed to save invoice data for ${file.name}: ${insertError.message}`);
        }

        console.log("Invoice inserted successfully:", insertedInvoice);
        return insertedInvoice;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${selectedFiles.length} file(s) and created invoice records.`,
      });

      // Reset form
      setSelectedFiles([]);
      setInvoiceNumber('');
      setInvoiceDate(undefined);
      setTotalAmount('');
      setProvider('CCM');
      setStatus('pending');
      setReasonForDispute('');
      setTags('');

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Invoice Document Upload
          </CardTitle>
          <CardDescription>
            Upload invoice documents with drag-and-drop. All files will be stored as invoice records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-gray-300",
              selectedFiles.length > 0 ? "border-green-500 bg-green-50" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFiles.length === 0 ? (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Drop your invoice files here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">{selectedFiles.length} file(s) selected</span>
                </div>
                <div className="grid gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload-additional"
                    accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                  />
                  <Button asChild variant="outline" size="sm">
                    <label htmlFor="file-upload-additional" className="cursor-pointer">
                      Add More Files
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Information Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number *</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Invoice Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !invoiceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={setInvoiceDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-amount">Total Amount (USD) *</Label>
              <Input
                id="total-amount"
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="urgent, monthly, maintenance"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason-dispute">Reason for Dispute (if applicable)</Label>
            <Input
              id="reason-dispute"
              value={reasonForDispute}
              onChange={(e) => setReasonForDispute(e.target.value)}
              placeholder="Enter dispute reason if status is disputed"
            />
          </div>

          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFiles.length || !invoiceNumber || !invoiceDate || !totalAmount || isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Invoice${selectedFiles.length > 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;