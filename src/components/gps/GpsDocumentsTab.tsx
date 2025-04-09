
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Upload, Eye, Download, Trash2, FileText, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Document {
  id: number;
  filename: string;
  uploadDate: string;
  fileType: string;
  size: string;
  tags: string[];
}

interface GpsDocumentsTabProps {
  providerName: string;
  documents: Document[];
}

const GpsDocumentsTab: React.FC<GpsDocumentsTabProps> = ({ providerName, documents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const handlePreviewDocument = (document: Document) => {
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
    <>
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

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview: {selectedDocument?.filename}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-md h-[500px] flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
              <div className="text-muted-foreground">
                Document preview would be displayed here in a real application
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2 mr-auto">
              <Button variant="outline" size="sm" className="gap-1">
                <Upload size={14} />
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
    </>
  );
};

export default GpsDocumentsTab;
