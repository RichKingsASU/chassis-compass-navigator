import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VendorDetailViewProps {
  record: any;
  onBack: () => void;
  vendorName: string;
  vendorKey: string;
}

const VendorDetailView: React.FC<VendorDetailViewProps> = ({ 
  record, 
  onBack, 
  vendorName, 
  vendorKey 
}) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoiceData();
  }, [record, vendorKey]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      
      // Fetch invoice from vendor-specific table
      const tableName = `${vendorKey}_invoices`;
      const { data: invoiceData, error: invoiceError } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('invoice_id', record.invoice_id || record.invoiceId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch related line items from vendor-specific activity table
      const activityTableName = `${vendorKey}_activity`;
      const { data: activityData, error: activityError } = await supabase
        .from(activityTableName as any)
        .select('*')
        .or(`chassis.eq.${record.chassis || ''},container.eq.${record.container || ''}`);

      if (activityError) throw activityError;
      setLineItems(activityData || []);

    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'open' || statusLower === 'active') {
      return <Badge variant="default">{status}</Badge>;
    } else if (statusLower === 'closed' || statusLower === 'completed') {
      return <Badge variant="secondary">{status}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tracker
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Invoice Details</h1>
          <p className="text-muted-foreground">
            {invoice?.invoice_id || 'N/A'}
          </p>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Summary
            </span>
            {getStatusBadge(invoice?.status || 'Unknown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Invoice Number</div>
              <div className="text-lg font-semibold">{invoice?.invoice_id || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Invoice Date</div>
              <div className="text-lg font-semibold">{formatDate(invoice?.invoice_date)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Due Date</div>
              <div className="text-lg font-semibold">{formatDate(invoice?.due_date)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-lg font-semibold">{formatCurrency(invoice?.amount)}</div>
            </div>
          </div>
          {invoice?.description && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="text-sm mt-1">{invoice.description}</div>
            </div>
          )}
          {invoice?.disputed && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <div className="font-semibold text-destructive">Disputed Invoice</div>
                {invoice?.disputed_amount && (
                  <div className="text-sm text-muted-foreground">
                    Disputed Amount: {formatCurrency(invoice.disputed_amount)}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Date Out</TableHead>
                  <TableHead>Date In</TableHead>
                  <TableHead>Days Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location In</TableHead>
                  <TableHead>Location Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No line items found for this invoice
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.chassis || 'N/A'}</TableCell>
                      <TableCell>{item.container || 'N/A'}</TableCell>
                      <TableCell>{item.asset_type || 'N/A'}</TableCell>
                      <TableCell>{formatDate(item.date_out)}</TableCell>
                      <TableCell>{formatDate(item.date_in)}</TableCell>
                      <TableCell>{item.days_out || 0} days</TableCell>
                      <TableCell>{getStatusBadge(item.reservation_status || 'Unknown')}</TableCell>
                      <TableCell className="text-sm">{item.location_in || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{item.pick_up_location || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorDetailView;