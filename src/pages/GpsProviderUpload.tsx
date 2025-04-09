
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  FileCheck, 
  MapPin, 
  Clock, 
  Tag,
  Info,
  Download,
  Search,
  FileText,
  Calendar,
  Trash2,
  Eye
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface GpsProviderUploadProps {
  providerName: string;
  providerLogo?: string;
}

const GpsProviderUpload: React.FC<GpsProviderUploadProps> = ({ providerName, providerLogo }) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data for previous uploads
  const previousUploads = [
    {
      id: 1,
      filename: `${providerName}_export_20250409.csv`,
      uploadDate: "2025-04-09 08:23 AM",
      chassisCount: 45,
      status: "processed"
    },
    {
      id: 2,
      filename: `${providerName}_export_20250408.csv`,
      uploadDate: "2025-04-08 10:15 AM",
      chassisCount: 42,
      status: "processed"
    },
    {
      id: 3,
      filename: `${providerName}_export_20250407.csv`,
      uploadDate: "2025-04-07 09:30 AM",
      chassisCount: 44,
      status: "processed"
    },
  ];

  // Mock data for extracted GPS data
  const extractedData = [
    {
      chassisId: "CMAU1234567",
      timestamp: "2025-04-09 07:53 AM",
      location: "Savannah, GA",
      coordinates: "32.0835° N, 81.0998° W",
      speed: "0 mph",
      notes: "Parked at terminal"
    },
    {
      chassisId: "TCLU7654321",
      timestamp: "2025-04-09 07:42 AM",
      location: "Savannah, GA",
      coordinates: "32.0883° N, 81.1024° W",
      speed: "5 mph",
      notes: "Moving in yard"
    },
    {
      chassisId: "FSCU5555123",
      timestamp: "2025-04-09 07:38 AM",
      location: "Savannah, GA",
      coordinates: "32.0923° N, 81.1054° W",
      speed: "25 mph",
      notes: "In transit"
    },
    {
      chassisId: "NYKU9876543",
      timestamp: "2025-04-09 07:29 AM",
      location: "Savannah, GA",
      coordinates: "32.1027° N, 81.1135° W",
      speed: "45 mph",
      notes: "On highway"
    },
    {
      chassisId: "APHU1122334",
      timestamp: "2025-04-09 07:15 AM",
      location: "Savannah, GA",
      coordinates: "32.1233° N, 81.1278° W",
      speed: "0 mph",
      notes: "Parked at yard"
    },
  ];

  // Mock data for documents
  const documents = [
    {
      id: 1,
      filename: `${providerName}_Manual_2025.pdf`,
      uploadDate: "2025-04-09",
      fileType: "manual",
      size: "2.4 MB",
      tags: ["manual", "documentation", "2025"]
    },
    {
      id: 2,
      filename: `${providerName}_APISpec_v2.pdf`,
      uploadDate: "2025-03-25",
      fileType: "api",
      size: "1.1 MB",
      tags: ["api", "technical", "spec"]
    },
    {
      id: 3,
      filename: `${providerName}_Installation_Guide.pdf`,
      uploadDate: "2025-02-18",
      fileType: "guide",
      size: "3.7 MB",
      tags: ["installation", "guide"]
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Processing</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handlePreviewDocument = (document: any) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    
    return (
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          {providerLogo && (
            <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-white p-1">
              <img src={providerLogo} alt={`${providerName} logo`} className="max-w-full max-h-full" />
            </div>
          )}
          <h1 className="dash-title">{providerName} GPS Upload</h1>
        </div>
      </div>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Previous Uploads</TabsTrigger>
          <TabsTrigger value="data">Extracted Data</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
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
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2 text-gray-600">Drag and drop your {providerName} export file here</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    or
                  </div>
                  <div className="mt-2">
                    <Input
                      type="file"
                      id="file-upload"
                      accept=".csv,.xlsx,.xls,.pdf"
                      className="hidden"
                    />
                    <Button onClick={() => document.getElementById('file-upload')?.click()}>
                      Select File
                    </Button>
                  </div>
                </div>
                
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
                  <Button size="lg" className="gap-2">
                    <FileCheck size={18} />
                    Process Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Previous Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Chassis Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previousUploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium">{upload.filename}</TableCell>
                        <TableCell>{upload.uploadDate}</TableCell>
                        <TableCell>{upload.chassisCount}</TableCell>
                        <TableCell>{getStatusBadge(upload.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab("data")}>
                              View Data
                            </Button>
                            <Button variant="ghost" size="sm">
                              Download
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
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Extracted GPS Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{data.chassisId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-muted-foreground" />
                            {data.timestamp}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-secondary" />
                            {data.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{data.coordinates}</TableCell>
                        <TableCell>{data.speed}</TableCell>
                        <TableCell>{data.notes}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Tag size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-lg font-medium">{providerName} Documents</CardTitle>
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <Button className="gap-2">
                    <Upload size={16} />
                    Upload New Document
                  </Button>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText size={16} className="text-muted-foreground" />
                            {doc.filename}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-muted-foreground" />
                              {doc.uploadDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.fileType}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {doc.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No documents found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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

export default GpsProviderUpload;
