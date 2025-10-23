import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { ExtractedData } from '@/pages/ccm/NewInvoice';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InvoiceReviewStepProps {
  extractedData: ExtractedData;
  setExtractedData: (data: ExtractedData) => void;
  onComplete: () => void;
  onBack: () => void;
  setHasUnsavedChanges: (value: boolean) => void;
  onSaveDraft: () => void;
}

const InvoiceReviewStep: React.FC<InvoiceReviewStepProps> = ({
  extractedData,
  setExtractedData,
  onComplete,
  onBack,
  setHasUnsavedChanges,
  onSaveDraft,
}) => {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState(extractedData.invoice);
  const [lineItems, setLineItems] = useState(extractedData.line_items);

  useEffect(() => {
    setHasUnsavedChanges(true);
    return () => setHasUnsavedChanges(false);
  }, []);

  const handleInvoiceFieldChange = (field: string, value: any) => {
    const updatedInvoice = { ...invoice, [field]: value };
    setInvoice(updatedInvoice);
    setExtractedData({
      ...extractedData,
      invoice: updatedInvoice,
    });
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
    setExtractedData({
      ...extractedData,
      line_items: updated,
    });
  };

  const handleContinue = async () => {
    try {
      // Save invoice header to ccm_invoice table
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('ccm_invoice')
        .insert({
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          provider: invoice.provider,
          total_amount_usd: invoice.total_amount_usd,
          status: invoice.status,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Save line items to ccm_invoice_data table
      const lineItemsToInsert = lineItems.map(item => ({
        invoice_id: invoiceData.id,
        sheet_name: 'Sheet1',
        row_data: item.row_data || {},
        validated: false,
      }));

      const { error: lineItemsError } = await supabase
        .from('ccm_invoice_data')
        .insert(lineItemsToInsert);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: "Data Saved",
        description: "Invoice data saved successfully.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving invoice data:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Fields */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Invoice Header</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="invoice_number">Invoice Number</Label>
            <Input
              id="invoice_number"
              value={invoice.invoice_number || ''}
              onChange={(e) => handleInvoiceFieldChange('invoice_number', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="invoice_date">Invoice Date</Label>
            <Input
              id="invoice_date"
              type="date"
              value={invoice.invoice_date || ''}
              onChange={(e) => handleInvoiceFieldChange('invoice_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select value={invoice.provider || "CCM"} onValueChange={(v) => handleInvoiceFieldChange('provider', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CCM">CCM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="total_amount_usd">Total Amount (USD)</Label>
            <Input
              id="total_amount_usd"
              type="number"
              step="0.01"
              value={invoice.total_amount_usd || 0}
              onChange={(e) => handleInvoiceFieldChange('total_amount_usd', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={invoice.status || "pending"} onValueChange={(v) => handleInvoiceFieldChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Attachments */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Attachments</h2>
        <div className="space-y-2">
          {extractedData.attachments.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{att.name}</Badge>
              <span className="text-muted-foreground">{att.path}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Line Items Table - Full Excel Data */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Line Items - Full Data Review ({lineItems.length})</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Review all extracted data from the Excel file. Scroll horizontally to see all columns.
        </p>
        <div className="overflow-auto border rounded-lg w-full" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '500px' }}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted">
                {extractedData?.excel_headers?.map((header, idx) => (
                  <th key={idx} className="text-left p-3 font-semibold whitespace-nowrap min-w-[180px] bg-muted">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-muted/30">
                  {extractedData?.excel_headers?.map((header, colIndex) => {
                    const cellValue = item.row_data?.[header];
                    let displayValue = '—';
                    
                    // Check if value exists and is not empty
                    if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                      // Format dates if they look like Excel serial numbers
                      if (typeof cellValue === 'number' && cellValue > 40000 && cellValue < 50000) {
                        const date = new Date((cellValue - 25569) * 86400 * 1000);
                        displayValue = date.toLocaleDateString();
                      } else if (typeof cellValue === 'number' && cellValue === 0) {
                        displayValue = '0';
                      } else {
                        displayValue = String(cellValue);
                      }
                    }
                    
                    return (
                      <td key={colIndex} className="p-3 whitespace-nowrap border-r last:border-r-0 text-sm">
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSaveDraft}>
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleContinue}>Continue to Validate</Button>
      </div>
    </div>
  );
};

export default InvoiceReviewStep;
