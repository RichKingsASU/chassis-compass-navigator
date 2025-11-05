import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useTMSData, TMSDataItem, TMSFiltersState } from "@/hooks/useTMSData";

interface TMSTableProps {
  onViewDetails: (record: TMSDataItem) => void;
  selectedFilters: TMSFiltersState;
}

const TMSTable: React.FC<TMSTableProps> = ({ onViewDetails, selectedFilters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('created_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const recordsPerPage = 20;

  const { data: tmsResult, isLoading: loading, error } = useTMSData(
    selectedFilters, 
    currentPage, 
    recordsPerPage
  );

  const data = tmsResult?.data || [];
  const totalPages = tmsResult?.totalPages || 1;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered') || statusLower.includes('complete')) {
      return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
    } else if (statusLower.includes('transit') || statusLower.includes('active')) {
      return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
    } else if (statusLower.includes('pending') || statusLower.includes('scheduled')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: string) => {
    if (!amount) return '-';
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading TMS data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          TMS Data ({data.length} records, Page {currentPage} of {totalPages})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('shipment_number')} className="p-0 h-auto font-medium">
                    Shipment # <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('container_number')} className="p-0 h-auto font-medium">
                    Container # <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('carrier_name')} className="p-0 h-auto font-medium">
                    Carrier <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('pickup_actual_date')} className="p-0 h-auto font-medium">
                    Pickup Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('delivery_actual_date')} className="p-0 h-auto font-medium">
                    Delivery Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No TMS data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((record, index) => (
                  <TableRow key={record.id || index}>
                    <TableCell className="font-medium">
                      {record.shipment_number ? `LD${record.shipment_number}` : (record.id ? `LD${record.id}` : '-')}
                    </TableCell>
                    <TableCell>{record.container_number || '-'}</TableCell>
                    <TableCell>{record.carrier_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {record.pickup_city && record.pickup_state 
                        ? `${record.pickup_city}, ${record.pickup_state}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.delivery_city && record.delivery_state 
                        ? `${record.delivery_city}, ${record.delivery_state}`
                        : '-'}
                    </TableCell>
                    <TableCell>{formatDate(record.pickup_actual_date)}</TableCell>
                    <TableCell>{formatDate(record.delivery_actual_date)}</TableCell>
                    <TableCell>{formatCurrency(record.cust_invoice_charge)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(record)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TMSTable;