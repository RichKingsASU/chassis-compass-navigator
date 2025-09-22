
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Download, Edit, Trash2, ChevronDown, Eye } from "lucide-react";
import StatusBadge from './StatusBadge';
import FileTypeIcon from './FileTypeIcon';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

import { Invoice } from './types';

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  handleStatusChange: (invoiceId: string, newStatus: string) => void;
  handleFileDownload: (filePath: string, fileName: string) => void;
  onViewDetail?: (invoice: Invoice) => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  loading,
  handleStatusChange,
  handleFileDownload,
  onViewDetail
}) => {
  return (
    <div className="space-y-4">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No invoices found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </TableCell>
                  <TableCell>{invoice.invoice_number || 'N/A'}</TableCell>
                  <TableCell>{invoice.provider || 'CCM'}</TableCell>
                  <TableCell>${invoice.total_amount_usd?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || '0.00'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0">
                          <div className="flex items-center gap-1">
                            <StatusBadge status={invoice.status || 'pending'} />
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
                      <FileTypeIcon fileType={invoice.fileType || 'pdf'} />
                      <span className="ml-2 capitalize">{invoice.fileType || 'pdf'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{invoice.reason_for_dispute || '-'}</TableCell>
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
                        {onViewDetail && (
                          <DropdownMenuItem onClick={() => onViewDetail(invoice)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                        )}
                        {invoice.file_path && (
                          <DropdownMenuItem onClick={() => handleFileDownload(invoice.file_path || '', invoice.file_name || 'download')}>
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
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
      
      {invoices.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default InvoiceTable;
