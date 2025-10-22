import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Save, X, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, ExcelDataItem } from './types';
import InvoiceLineEditor from './InvoiceLineEditor';
import InvoiceLineItem from './InvoiceLineItem';
import { format } from 'date-fns';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onBack: () => void;
  onUpdate: () => void;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onBack,
  onUpdate
}) => {
  const [lineItems, setLineItems] = useState<ExcelDataItem[]>([]);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLineItems();
  }, [invoice.id]);

  const fetchLineItems = async () => {
    try {
      const { data, error } = await supabase
        .from('ccm_invoice_data')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our ExcelDataItem type
      const transformedData: ExcelDataItem[] = (data || []).map((item: any) => ({
        id: String(item.id),
        invoice_id: item.invoice_id,
        sheet_name: item.sheet_name,
        validated: item.validated,
        row_data: typeof item.row_data === 'object' && item.row_data !== null 
          ? item.row_data as Record<string, any>
          : {},
        created_at: item.created_at,
        column_headers: item.column_headers,
      }));

      setLineItems(transformedData);
    } catch (error) {
      console.error('Error fetching line items:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice line items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLineUpdate = async (lineId: string, updatedData: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('ccm_invoice_data')
        .update({ 
          row_data: updatedData,
          validated: true
        })
        .eq('id', Number(lineId));

      if (error) throw error;

      setLineItems(prev => 
        prev.map(item => 
          item.id === lineId 
            ? { ...item, row_data: updatedData, validated: true }
            : item
        )
      );

      setEditingLineId(null);
      toast({
        title: "Success",
        description: "Line item updated successfully",
      });
    } catch (error) {
      console.error('Error updating line item:', error);
      toast({
        title: "Error",
        description: "Failed to update line item",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!invoice.file_path) {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('ccm-invoices')
        .download(invoice.file_path);

      if (error) throw error;

      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = invoice.file_name || 'invoice_file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading invoice details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Invoice Details</h2>
            <p className="text-muted-foreground">Review and edit invoice line items</p>
          </div>
        </div>
        {invoice.file_path && (
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        )}
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Invoice #{invoice.invoice_number}
            <Badge variant={invoice.status === 'pending' ? 'secondary' : 'default'}>
              {invoice.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Provider: {invoice.provider} • Date: {format(new Date(invoice.invoice_date), 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Total Amount</p>
              <p className="text-2xl font-bold">${invoice.total_amount_usd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">File Type</p>
              <p className="text-lg">{invoice.file_type?.toUpperCase() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Line Items</p>
              <p className="text-lg">{lineItems.length}</p>
            </div>
          </div>
          {invoice.reason_for_dispute && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Dispute Reason:</p>
              <p className="text-sm text-yellow-700">{invoice.reason_for_dispute}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items ({lineItems.length})</CardTitle>
          <CardDescription>
            Review each line item and make corrections as needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No line items found for this invoice
            </div>
          ) : (
            lineItems.map((lineItem, index) => (
              <div key={lineItem.id}>
                {editingLineId === lineItem.id ? (
                  <InvoiceLineEditor
                    lineItem={lineItem}
                    onSave={(data) => handleLineUpdate(lineItem.id, data)}
                    onCancel={() => setEditingLineId(null)}
                  />
                ) : (
                  <InvoiceLineItem
                    lineItem={lineItem}
                    lineNumber={index + 1}
                    onEdit={() => setEditingLineId(lineItem.id)}
                  />
                )}
                {index < lineItems.length - 1 && <Separator className="my-4" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetailView;