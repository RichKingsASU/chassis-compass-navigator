
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Upload, 
  FileType, 
  Calendar, 
  Download, 
  Eye, 
  Trash2,
  Tag,
  CalendarCheck
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface VendorUploadProps {
  vendorName: string;
  vendorLogo?: string;
}

const VendorUpload: React.FC<VendorUploadProps> = ({ vendorName, vendorLogo }) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  
  // Mock data for uploaded documents
  const documents = [
    {
      id: 1,
      filename: `${vendorName}_Invoice_April2025.pdf`,
      uploadDate: "2025-04-09",
      usagePeriod: "Apr 1-30, 2025",
      fileType: "invoice",
      size: "1.2 MB"
    },
    {
      id: 2,
      filename: `${vendorName}_Statement_Mar2025.pdf`,
      uploadDate: "2025-03-15",
      usagePeriod: "Mar 1-31, 2025",
      fileType: "statement",
      size: "852 KB"
    },
    {
      id: 3,
      filename: `${vendorName}_ContractRenewal_2025.pdf`,
      uploadDate: "2025-01-10",
      usagePeriod: "Jan 1-Dec 31, 2025",
      fileType: "contract",
      size: "3.1 MB"
    },
  ];

  const handlePreviewDocument = (document: any) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          {vendorLogo && (
            <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-white p-1">
              <img src={vendorLogo} alt={`${vendorName} logo`} className="max-w-full max-h-full" />
            </div>
          )}
          <h1 className="dash-title">{vendorName} Document Upload</h1>
        </div>
      </div>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
          <TabsTrigger value="documents">Uploaded Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Upload {vendorName} Document</CardTitle>
              <CardDescription>
                Upload invoices, statements, contracts, or other documents from {vendorName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <FileType size={28} className="mb-2 text-primary" />
                    <div className="font-medium">CSV File</div>
                    <div className="text-xs text-muted-foreground">For data-only uploads</div>
                  </div>
                  
                  <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <FileType size={28} className="mb-2 text-primary" />
                    <div className="font-medium">PDF File</div>
                    <div className="text-xs text-muted-foreground">For invoices and contracts</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FormLabel className="mb-2 block">Document Type</FormLabel>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="statement">Statement</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="report">Usage Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <FormLabel className="mb-2 block">Usage Period</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input type="date" />
                      </div>
                      <div>
                        <Input type="date" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2 text-gray-600">Drag and drop your {vendorName} document here</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    or
                  </div>
                  <div className="mt-2">
                    <Input
                      type="file"
                      id="file-upload"
                      accept=".csv,.pdf"
                      className="hidden"
                    />
                    <Button onClick={() => document.getElementById('file-upload')?.click()}>
                      Select File
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button className="gap-2">
                    <Upload size={18} />
                    Upload Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">{vendorName} Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Usage Period</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.filename}</TableCell>
                        <TableCell>{doc.uploadDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-muted-foreground" />
                            {doc.usagePeriod}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.fileType}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handlePreviewDocument(doc)}>
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Connect to Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FormLabel className="mb-2 block">Select Document</FormLabel>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map(doc => (
                          <SelectItem key={doc.id} value={doc.id.toString()}>{doc.filename}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <FormLabel className="mb-2 block">Validation Period</FormLabel>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apr1-15">Apr 1-15, 2025</SelectItem>
                        <SelectItem value="apr16-30">Apr 16-30, 2025</SelectItem>
                        <SelectItem value="apr1-30">Apr 1-30, 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button className="gap-2 w-full">
                      <CalendarCheck size={18} />
                      Connect to Validation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview: {selectedDocument?.filename}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-md h-[500px] flex items-center justify-center">
            <div className="text-center">
              <FileType size={48} className="mx-auto mb-4 text-muted-foreground" />
              <div className="text-muted-foreground">
                Document preview would be displayed here in a real application
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2 mr-auto">
              <Button variant="outline" size="sm" className="gap-1">
                <Tag size={14} />
                Add Tag
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download size={14} />
                Download
              </Button>
            </div>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorUpload;
