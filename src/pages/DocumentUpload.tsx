
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Download, 
  Trash2, 
  Search, 
  Calendar, 
  Tag, 
  FileText
} from 'lucide-react';
import { Input } from "@/components/ui/input";

const DocumentUpload = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data for documents
  const documents = [
    {
      id: 1,
      filename: "DCLI_Invoice_April2025.pdf",
      uploadDate: "2025-04-09",
      type: "Invoice",
      vendor: "DCLI",
      size: "1.2 MB",
      tags: ["invoice", "april-2025"]
    },
    {
      id: 2,
      filename: "CCM_Statement_Mar2025.pdf",
      uploadDate: "2025-03-15",
      type: "Statement",
      vendor: "CCM",
      size: "852 KB",
      tags: ["statement", "march-2025"]
    },
    {
      id: 3,
      filename: "TRAC_ContractRenewal_2025.pdf",
      uploadDate: "2025-01-10",
      type: "Contract",
      vendor: "TRAC",
      size: "3.1 MB",
      tags: ["contract", "2025"]
    },
    {
      id: 4,
      filename: "FLEXIVAN_Report_Q1_2025.pdf",
      uploadDate: "2025-04-01",
      type: "Report",
      vendor: "FLEXIVAN",
      size: "5.7 MB",
      tags: ["report", "q1-2025"]
    },
    {
      id: 5,
      filename: "Samsara_GPSData_Mar2025.csv",
      uploadDate: "2025-04-02",
      type: "GPS Data",
      vendor: "Samsara",
      size: "12.4 MB",
      tags: ["gps", "march-2025"]
    },
    {
      id: 6,
      filename: "BlackBerry_GPSData_Apr2025.csv",
      uploadDate: "2025-04-05",
      type: "GPS Data",
      vendor: "BlackBerry",
      size: "8.2 MB",
      tags: ["gps", "april-2025"]
    },
  ];

  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    
    return (
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h1 className="dash-title">Document Upload</h1>
        
        <div className="flex gap-3">
          <Button className="gap-2">
            <Upload size={18} />
            Upload New Document
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-medium">Document Repository</CardTitle>
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
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="w-full mb-6 grid grid-cols-5">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="gps">GPS Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vendor</TableHead>
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
                          <TableCell>{doc.type}</TableCell>
                          <TableCell>{doc.vendor}</TableCell>
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
                              <Button variant="ghost" size="sm">
                                <Download size={16} />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Tag size={16} />
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
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No documents found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="invoices">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments
                      .filter(doc => doc.type === "Invoice")
                      .map((doc) => (
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
                          <TableCell>{doc.vendor}</TableCell>
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
                              <Button variant="ghost" size="sm">
                                <Download size={16} />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Tag size={16} />
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
            </TabsContent>
            
            {/* Similar Tables for other tabs would go here */}
            <TabsContent value="reports">
              <div className="text-center py-8 text-muted-foreground">
                Filter to view Reports
              </div>
            </TabsContent>
            
            <TabsContent value="contracts">
              <div className="text-center py-8 text-muted-foreground">
                Filter to view Contracts
              </div>
            </TabsContent>
            
            <TabsContent value="gps">
              <div className="text-center py-8 text-muted-foreground">
                Filter to view GPS Data
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
