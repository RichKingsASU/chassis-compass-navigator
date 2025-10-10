import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, Download, Plus, FileText, AlertCircle } from "lucide-react";

interface WCCPInvoiceTrackerProps {
  onViewDetail: (record: any) => void;
}

const WCCPInvoiceTracker: React.FC<WCCPInvoiceTrackerProps> = ({ onViewDetail }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Mock data - replace with actual WCCP data when available
  const mockData: any[] = [];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // Filter data
  const filteredData = mockData.filter(record => {
    const matchesSearch = !searchQuery || 
      Object.values(record).some(value => 
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map((_, index) => `${startIndex + index}`);
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (index: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedItems(newSelected);
  };

  const getStatusBadge = (status: string) => {
    return status === 'Open' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
        Open
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
        Closed
      </Badge>
    );
  };

  const getDisputeBadge = (disputeStatus: string | null) => {
    if (!disputeStatus) return null;
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        {disputeStatus}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Invoice Tracker</h2>
          <p className="text-muted-foreground">Search smarter, find faster</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/vendors/wccp/invoices/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-2"></div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}–{endIndex} of {totalRecords} records
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => {
            setRowsPerPage(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50/50">
                <tr>
                  <th className="text-left p-3 w-12">
                    <Checkbox
                      checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">View | Dispute</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Invoice Number</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Invoice Date</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Invoice Total</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Invoice Status</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Dispute Status</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Attachments</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record, index) => {
                  const globalIndex = `${startIndex + index}`;
                  return (
                    <tr key={globalIndex} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedItems.has(globalIndex)}
                          onCheckedChange={(checked) => handleSelectItem(globalIndex, checked as boolean)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1 text-sm">
                          <button 
                            onClick={() => onViewDetail(record)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View
                          </button>
                          <span className="text-gray-400">|</span>
                          <button className="text-blue-600 hover:text-blue-800 hover:underline">
                            Dispute
                          </button>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-sm">{record.invoiceNumber}</td>
                      <td className="p-3 text-sm">{formatDate(record.invoiceDate)}</td>
                      <td className="p-3 text-sm font-medium">{formatCurrency(record.invoiceTotal)}</td>
                      <td className="p-3">{getStatusBadge(record.invoiceStatus)}</td>
                      <td className="p-3">{getDisputeBadge(record.disputeStatus)}</td>
                      <td className="p-3">
                        {record.hasAttachment && (
                          <div className="flex items-center">
                            {record.disputeStatus ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              No invoice data available. WCCP invoice integration is being configured.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {startIndex + 1}–{endIndex} of {totalRecords}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WCCPInvoiceTracker;
