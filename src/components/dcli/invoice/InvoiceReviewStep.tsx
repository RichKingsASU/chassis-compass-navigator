import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { ExtractedData } from '@/pages/dcli/NewInvoice';

interface InvoiceReviewStepProps {
  extractedData: ExtractedData;
  setExtractedData: (data: ExtractedData) => void;
  onComplete: () => void;
  onBack: () => void;
  setHasUnsavedChanges: (value: boolean) => void;
}

const InvoiceReviewStep: React.FC<InvoiceReviewStepProps> = ({
  extractedData,
  setExtractedData,
  onComplete,
  onBack,
  setHasUnsavedChanges,
}) => {
  const [invoice, setInvoice] = useState(extractedData.invoice);
  const [lineItems, setLineItems] = useState(extractedData.line_items);

  useEffect(() => {
    setHasUnsavedChanges(true);
    return () => setHasUnsavedChanges(false);
  }, []);

  const handleInvoiceFieldChange = (field: string, value: any) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
    setExtractedData({
      ...extractedData,
      invoice: { ...invoice, [field]: value },
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

  const validateLineItem = (item: any) => {
    const warnings = [];
    if (!item.chassis_out) warnings.push('Missing chassis');
    if (!item.container_out) warnings.push('Missing container');
    if (item.invoice_total < 0) warnings.push('Negative total');
    if (!item.date_out || !item.date_in) warnings.push('Missing dates');
    return warnings;
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.row_data?.["Grand Total"] || 0), 0);
  const delta = Math.abs(totalAmount - Number(invoice.amount_due));

  return (
    <div className="space-y-6">
      {/* Header Fields */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Invoice Header</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="summary_invoice_id">Summary Invoice ID</Label>
            <Input
              id="summary_invoice_id"
              value={invoice.summary_invoice_id}
              onChange={(e) => handleInvoiceFieldChange('summary_invoice_id', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="billing_date">Billing Date</Label>
            <Input
              id="billing_date"
              type="date"
              value={invoice.billing_date}
              onChange={(e) => handleInvoiceFieldChange('billing_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={invoice.due_date}
              onChange={(e) => handleInvoiceFieldChange('due_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="billing_terms">Billing Terms</Label>
            <Input
              id="billing_terms"
              value={invoice.billing_terms}
              onChange={(e) => handleInvoiceFieldChange('billing_terms', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <Select value={invoice.vendor} onValueChange={(v) => handleInvoiceFieldChange('vendor', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DCLI">DCLI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount_due">Amount Due</Label>
            <Input
              id="amount_due"
              type="number"
              step="0.01"
              value={invoice.amount_due}
              onChange={(e) => handleInvoiceFieldChange('amount_due', parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={invoice.status} onValueChange={(v) => handleInvoiceFieldChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="currency_code">Currency</Label>
            <Input
              id="currency_code"
              value={invoice.currency_code}
              onChange={(e) => handleInvoiceFieldChange('currency_code', e.target.value)}
            />
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
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Line Items - Full Data Review ({lineItems.length})</h2>
          {delta > 0.01 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Delta: ${delta.toFixed(2)}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Review all extracted data from the Excel file. Scroll horizontally to see all columns.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {extractedData?.excel_headers?.map((header, idx) => (
                  <th key={idx} className="text-left p-2 font-medium whitespace-nowrap min-w-[120px] sticky top-0 bg-muted/50">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-muted/50">
                  {extractedData?.excel_headers?.map((header, colIndex) => {
                    const cellValue = item.row_data?.[header];
                    let displayValue = '—';
                    
                    if (cellValue !== undefined && cellValue !== null) {
                      // Format dates if they look like Excel serial numbers
                      if (typeof cellValue === 'number' && cellValue > 40000 && cellValue < 50000) {
                        const date = new Date((cellValue - 25569) * 86400 * 1000);
                        displayValue = date.toLocaleDateString();
                      } else {
                        displayValue = String(cellValue);
                      }
                    }
                    
                    return (
                      <td key={colIndex} className="p-2 whitespace-nowrap border-r last:border-r-0">
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
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Upload
        </Button>
        <Button onClick={onComplete}>Continue to Validate</Button>
      </div>
    </div>
  );
};

export default InvoiceReviewStep;
