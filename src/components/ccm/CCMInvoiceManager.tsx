
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Upload, 
  FileType, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Download, 
  Edit, 
  Trash2, 
  CalendarIcon,
  Search,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Mail,
  Image
} from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface Invoice {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  status: 'pending' | 'approved' | 'disputed' | 'review';
  fileType: 'pdf' | 'excel' | 'email' | 'image';
  notes: string;
}

const mockInvoices: Invoice[] = [
  { 
    id: "INV-001", 
    date: "2025-04-05", 
    vendor: "CCM", 
    amount: 4320.00, 
    status: "pending", 
    fileType: "pdf",
    notes: "Monthly chassis rental"
  },
  { 
    id: "INV-002", 
    date: "2025-04-02", 
    vendor: "CCM", 
    amount: 2150.00, 
    status: "approved", 
    fileType: "excel",
    notes: "Maintenance charges"
  },
  { 
    id: "INV-003", 
    date: "2025-03-28", 
    vendor: "CCM", 
    amount: 3785.00, 
    status: "disputed", 
    fileType: "email",
    notes: "Disputing excess usage charges"
  },
  { 
    id: "INV-004", 
    date: "2025-03-15", 
    vendor: "CCM", 
    amount: 1920.00, 
    status: "approved", 
    fileType: "pdf",
    notes: "Regional fees"
  },
  { 
    id: "INV-005", 
    date: "2025-03-10", 
    vendor: "CCM", 
    amount: 2750.00, 
    status: "review", 
    fileType: "pdf",
    notes: "Under review by accounting"
  },
  { 
    id: "INV-006", 
    date: "2025-02-28", 
    vendor: "CCM", 
    amount: 3150.00, 
    status: "approved", 
    fileType: "image",
    notes: "Approved with comments"
  },
  { 
    id: "INV-007", 
    date: "2025-02-15", 
    vendor: "CCM", 
    amount: 1850.00, 
    status: "disputed", 
    fileType: "excel",
    notes: "Disputing late fees - documentation provided"
  }
];

const CCMInvoiceManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'disputed':
        return <Badge className="bg-red-500">Disputed</Badge>;
      case 'review':
        return <Badge className="bg-blue-500">Under Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getFileTypeIcon = (fileType: string) => {
    switch(fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-purple-500" />;
      default:
        return <FileType className="h-5 w-5" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const vendorMatch = selectedVendor === 'all' || invoice.vendor === selectedVendor;
    const statusMatch = selectedStatus === 'all' || invoice.status === selectedStatus;
    const fileTypeMatch = selectedFileType === 'all' || invoice.fileType === selectedFileType;
    const searchMatch = searchQuery === '' || 
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      invoice.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    return vendorMatch && statusMatch && fileTypeMatch && searchMatch;
  });

  const handleStatusChange = (invoiceId: string, newStatus: 'pending' | 'approved' | 'disputed' | 'review') => {
    setInvoices(prevInvoices => 
      prevInvoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Upload Invoice Documents</CardTitle>
          <CardDescription>Drag and drop your invoice files or click to browse</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">Drag files here or click to browse</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Upload PDF invoices, Excel/CSV spreadsheets, email attachments (.eml, .msg), or images
              </p>
              
              <Button className="mt-4">
                <Upload className="h-4 w-4 mr-2" /> 
                Select Files
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm font-medium mt-2">PDF Invoices</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium mt-2">Excel/CSV</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium mt-2">Email Attachments</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium mt-2">Images</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Invoices List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-medium">Invoice Management</CardTitle>
              <CardDescription>Manage and track all your invoice documents</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                <Input 
                  type="search"
                  placeholder="Search invoices..." 
                  className="w-full md:w-[200px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-filter">Vendor</Label>
                <Select 
                  value={selectedVendor} 
                  onValueChange={setSelectedVendor}
                >
                  <SelectTrigger id="vendor-filter">
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    <SelectItem value="CCM">CCM</SelectItem>
                    <SelectItem value="DCLI">DCLI</SelectItem>
                    <SelectItem value="TRAC">TRAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file-type-filter">File Type</Label>
                <Select 
                  value={selectedFileType} 
                  onValueChange={setSelectedFileType}
                >
                  <SelectTrigger id="file-type-filter">
                    <SelectValue placeholder="Select a file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All File Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel/CSV</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>File Type</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No invoices found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>{invoice.vendor}</TableCell>
                        <TableCell>${invoice.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 p-0">
                                <div className="flex items-center gap-1">
                                  {getStatusBadge(invoice.status)}
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'pending')}>
                                <Badge className="bg-amber-500 mr-2">Pending</Badge> Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'approved')}>
                                <Badge className="bg-green-500 mr-2">Approved</Badge> Approved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'disputed')}>
                                <Badge className="bg-red-500 mr-2">Disputed</Badge> Disputed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'review')}>
                                <Badge className="bg-blue-500 mr-2">Review</Badge> Under Review
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getFileTypeIcon(invoice.fileType)}
                            <span className="ml-2 capitalize">{invoice.fileType}</span>
                          </div>
                        </TableCell>
                        <TableCell>{invoice.notes}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Notes</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CCMInvoiceManager;
