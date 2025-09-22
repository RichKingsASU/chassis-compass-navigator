import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TMSRecord {
  row_id: number;
  shipment_number?: string;
  container_number?: string;
  carrier_name?: string;
  status?: string;
  pickup_city?: string;
  pickup_state?: string;
  delivery_city?: string;
  delivery_state?: string;
  pickup_actual_date?: string;
  delivery_actual_date?: string;
  cust_invoice_charge?: string;
  carrier_invoice_charge?: string;
  mbl?: string;
  vessel_name?: string;
}

interface TMSFiltersState {
  source: string;
  type: string;
  status: string;
}

interface TMSTableProps {
  onViewDetails: (record: TMSRecord) => void;
  selectedFilters: TMSFiltersState;
}

const TMSTable: React.FC<TMSTableProps> = ({ onViewDetails, selectedFilters }) => {
  const [data, setData] = useState<TMSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>('row_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  const recordsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, [currentPage, sortField, sortDirection, selectedFilters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = startIndex + recordsPerPage - 1;

      // Note: mg_tms table needs to be created in Supabase
      // For now, using placeholder data
      const mockData: TMSRecord[] = [
        {
          row_id: 1,
          shipment_number: 'MG001234',
          container_number: 'CMAU1234567',
          carrier_name: 'ABC Logistics',
          status: 'In Transit',
          pickup_city: 'Los Angeles',
          pickup_state: 'CA',
          delivery_city: 'Chicago',
          delivery_state: 'IL',
          pickup_actual_date: '2024-01-15',
          delivery_actual_date: '2024-01-18',
          cust_invoice_charge: '2450.00',
          carrier_invoice_charge: '2100.00'
        },
        {
          row_id: 2,
          shipment_number: 'MG001235',
          container_number: 'TCLU7654321',
          carrier_name: 'Swift Transport',
          status: 'Delivered',
          pickup_city: 'Houston',
          pickup_state: 'TX',
          delivery_city: 'Atlanta',
          delivery_state: 'GA',
          pickup_actual_date: '2024-01-14',
          delivery_actual_date: '2024-01-17',
          cust_invoice_charge: '1850.00',
          carrier_invoice_charge: '1600.00'
        }
      ];

      setData(mockData);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching TMS data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch TMS data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          TMS Data ({data.length} of {totalPages * recordsPerPage} records)
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
              {data.map((record) => (
                <TableRow key={record.row_id}>
                  <TableCell className="font-medium">
                    {record.shipment_number || record.row_id}
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
              ))}
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