import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['dcli-invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_invoice')
        .select('*')
        .eq('invoice_id', invoiceId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: lineItems, isLoading: linesLoading } = useQuery({
    queryKey: ['dcli-invoice-lines', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_invoice_line_item')
        .select('*')
        .eq('summary_invoice_id', invoiceId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!invoiceId
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
      const status = item.invoice_status?.toLowerCase() || 'in progress';
      if (status === 'paid' || status === 'closed') acc.paid++;
      else if (status.includes('dispute')) acc.dispute++;
      else if (status === 'absorbed') acc.absorbed++;
      else acc.inProgress++;
      return acc;
    }, { paid: 0, inProgress: 0, dispute: 0, absorbed: 0 });
  }, [lineItems]);

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'in progress';
    const variants: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'closed': 'bg-green-100 text-green-800 border-green-200',
      'open': 'bg-blue-100 text-blue-800 border-blue-200',
      'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'dispute': 'bg-red-100 text-red-800 border-red-200',
      'absorbed': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const className = variants[statusLower] || variants['in progress'];
    return <Badge variant="outline" className={className}>{status || 'In Progress'}</Badge>;
  };

  if (invoiceLoading || linesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button className="mt-4" onClick={() => navigate('/vendors/dcli')}>
            Back to DCLI Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button onClick={() => navigate('/vendors/dcli')} variant="ghost" size="sm">
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
              <p className="text-lg font-semibold">{invoice.invoice_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-lg">{invoice.description || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
              <p className="text-lg">{formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
              <p className="text-lg">{formatDate(invoice.due_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(invoice.amount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {getStatusBadge(invoice.status)}
            </div>
            {invoice.disputed && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Disputed Amount</p>
                <p className="text-lg text-red-600 font-semibold">{formatCurrency(invoice.disputed_amount)}</p>
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
          {!lineItems || lineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No line items found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line #</TableHead>
                  <TableHead>Chassis</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={item.line_invoice_number || index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.chassis || 'N/A'}</TableCell>
                    <TableCell>{item.customer_name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(item.invoice_total)}</TableCell>
                    <TableCell>
                      {getStatusBadge(item.invoice_status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/vendors/dcli/invoice-line/${item.line_invoice_number}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;
