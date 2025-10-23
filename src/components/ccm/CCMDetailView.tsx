import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface CCMDetailViewProps {
  record: any;
  onBack: () => void;
}

const CCMDetailView: React.FC<CCMDetailViewProps> = ({ record, onBack }) => {
  const navigate = useNavigate();

  const { data: lineItems, isLoading } = useQuery({
    queryKey: ['ccm-invoice-lines', record.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ccm_invoice_data')
        .select('*')
        .eq('invoice_id', record.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const formatCurrency = (amount: string | number) => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate metrics from line items
  const metrics = React.useMemo(() => {
    if (!lineItems) return { paid: 0, inProgress: 0, dispute: 0, absorbed: 0 };
    
    return lineItems.reduce((acc, item) => {
      const rowData = item.row_data as Record<string, any>;
      const status = rowData?.status?.toLowerCase() || 'in progress';
      if (status === 'paid') acc.paid++;
      else if (status === 'dispute') acc.dispute++;
      else if (status === 'absorbed') acc.absorbed++;
      else acc.inProgress++;
      return acc;
    }, { paid: 0, inProgress: 0, dispute: 0, absorbed: 0 });
  }, [lineItems]);

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'in progress';
    const variants: Record<string, { variant: string; className: string }> = {
      'paid': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      'in progress': { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'dispute': { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
      'absorbed': { variant: 'outline', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    const config = variants[statusLower] || variants['in progress'];
    return <Badge variant="outline" className={config.className}>{status || 'In Progress'}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
        <p className="text-muted-foreground">Review invoice information and line items</p>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dispute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.dispute}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absorbed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics.absorbed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
              <p className="text-lg font-semibold">{record.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Provider</p>
              <p className="text-lg">{record.provider}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
              <p className="text-lg">{formatDate(record.invoice_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(record.total_amount_usd)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg">{record.status}</p>
            </div>
            {record.reason_for_dispute && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Dispute Reason</p>
                <p className="text-lg">{record.reason_for_dispute}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items ({lineItems?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading line items...</div>
          ) : !lineItems || lineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No line items found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => {
                  const rowData = item.row_data as Record<string, any>;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {rowData?.description || rowData?.item || item.sheet_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(rowData?.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/vendors/ccm/invoice-line/${item.id}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CCMDetailView;
