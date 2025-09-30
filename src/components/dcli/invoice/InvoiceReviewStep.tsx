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

  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.invoice_total || 0), 0);
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

      {/* Line Items Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Line Items ({lineItems.length})</h2>
          {delta > 0.01 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Delta: ${delta.toFixed(2)}
            </Badge>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Line Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Chassis Out</TableHead>
                <TableHead>Container Out</TableHead>
                <TableHead>Date Out</TableHead>
                <TableHead>Date In</TableHead>
                <TableHead>Warnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, idx) => {
                const warnings = validateLineItem(item);
                return (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">{item.invoice_type}</TableCell>
                    <TableCell className="text-xs">{item.line_invoice_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.invoice_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.invoice_total}
                        onChange={(e) =>
                          handleLineItemChange(idx, 'invoice_total', parseFloat(e.target.value))
                        }
                        className="w-24 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.chassis_out}
                        onChange={(e) => handleLineItemChange(idx, 'chassis_out', e.target.value)}
                        className="w-32 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.container_out}
                        onChange={(e) => handleLineItemChange(idx, 'container_out', e.target.value)}
                        className="w-32 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="datetime-local"
                        value={item.date_out?.slice(0, 16)}
                        onChange={(e) => handleLineItemChange(idx, 'date_out', e.target.value)}
                        className="w-44 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="datetime-local"
                        value={item.date_in?.slice(0, 16)}
                        onChange={(e) => handleLineItemChange(idx, 'date_in', e.target.value)}
                        className="w-44 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      {warnings.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {warnings.map((w, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {w}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
