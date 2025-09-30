import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, Download, Plus } from "lucide-react";
import { useDCLIData } from '@/hooks/useDCLIData';

interface DCLIInvoiceTrackerProps {
  onViewDetail: (record: any) => void;
}

const DCLIInvoiceTracker: React.FC<DCLIInvoiceTrackerProps> = ({ onViewDetail }) => {
  const { invoiceData, loading } = useDCLIData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': { variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
      'Pending': { variant: 'secondary', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      'On Hold': { variant: 'destructive', color: 'bg-red-100 text-red-800 border-red-200' },
      'Completed': { variant: 'outline', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Completed'];
    
    return (
      <Badge className={config.color}>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return '$0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0' : `$${numAmount.toLocaleString()}`;
  };

  // Filter data based on search and filters
  const filteredData = invoiceData.filter(record => {
    const matchesSearch = !searchQuery || 
      Object.values(record).some(value => 
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || record.reservation_status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || record.motor_carrier_name === carrierFilter;
    
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  // Get unique values for filters
  const uniqueStatuses = [...new Set(invoiceData.map(r => r.reservation_status).filter(Boolean))];
  const uniqueCarriers = [...new Set(invoiceData.map(r => r.motor_carrier_name).filter(Boolean))];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Invoice Tracker</h2>
          <p className="text-muted-foreground">Search smarter, find faster</p>
        </div>
        <div className="flex gap-2">
          <Button>
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
                placeholder="Search chassis, container, booking..."
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
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Carriers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                {uniqueCarriers.map(carrier => (
                  <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {invoiceData.length} records
        </p>
        <div className="text-sm text-muted-foreground">
          Total Value: {formatCurrency(filteredData.reduce((sum, record) => {
            const amount = parseFloat(record.amount || '0');
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0))}
        </div>
      </div>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Asset Info</th>
                  <th className="text-left p-4 font-medium">Carrier</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Dates</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((record, index) => (
                  <tr key={index} className="border-b hover:bg-muted/25 transition-colors">
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {record.chassis || 'No Chassis'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Container: {record.container || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Serial: {record.serial_number || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {record.motor_carrier_name || 'Unknown Carrier'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          SCAC: {record.motor_carrier_scac || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {getStatusBadge(record.reservation_status)}
                        {record.request_status && (
                          <div className="text-xs text-muted-foreground">
                            Request: {record.request_status}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-xs">
                        <div>Out: {formatDate(record.date_out)}</div>
                        <div>In: {formatDate(record.date_in)}</div>
                        {record.days_out && (
                          <div className="text-muted-foreground">
                            {record.days_out} days out
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-xs">
                        <div>{record.pick_up_location || 'N/A'}</div>
                        <div className="text-muted-foreground">
                          {record.region || 'Unknown Region'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(record)}
                        className="hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                No records found matching your criteria
              </div>
              <Button variant="outline" className="mt-4" onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCarrierFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DCLIInvoiceTracker;