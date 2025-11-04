import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
import { useToast } from '@/hooks/use-toast';
import { formatDateValue } from '@/utils/dateUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(extractedData.invoice);
  const [lineItems, setLineItems] = useState(extractedData.line_items);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleContinue = async () => {
    // Validate required fields
    if (!invoice.summary_invoice_id?.trim()) {
      toast({
        title: "Validation Error",
        description: "Summary Invoice ID is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!invoice.billing_date) {
      toast({
        title: "Validation Error",
        description: "Billing Date is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!invoice.due_date) {
      toast({
        title: "Validation Error",
        description: "Due Date is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!invoice.amount_due || invoice.amount_due <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount Due must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get authenticated user (optional for now)
      const { data: { user } } = await supabase.auth.getUser();

      // Insert invoice header into staging table
      const { data: stagingInvoice, error: stagingError } = await supabase
        .from('dcli_invoice_staging')
        .insert({
          summary_invoice_id: invoice.summary_invoice_id,
          billing_date: invoice.billing_date,
          due_date: invoice.due_date,
          billing_terms: invoice.billing_terms,
          vendor: invoice.vendor || 'DCLI',
          currency_code: invoice.currency_code || 'USD',
          amount_due: invoice.amount_due,
          account_code: invoice.account_code,
          pool: invoice.pool,
          pdf_path: extractedData.attachments.find(a => a.name.toLowerCase().endsWith('.pdf'))?.path,
          excel_path: extractedData.attachments.find(a => a.name.toLowerCase().includes('.xls'))?.path,
          created_by: user?.id || null,
          validation_status: 'pending',
          status: 'pending_validation'
        })
        .select()
        .single();

      if (stagingError) throw stagingError;

      // Insert line items into staging table
      const lineInserts = lineItems.map((item, index) => ({
        staging_invoice_id: stagingInvoice.id,
        line_index: index,
        invoice_type: item.invoice_type,
        line_invoice_number: item.line_invoice_number,
        invoice_status: item.invoice_status,
        invoice_total: item.invoice_total,
        remaining_balance: item.remaining_balance,
        dispute_status: item.dispute_status,
        attachment_count: item.attachment_count,
        chassis_out: item.chassis_out,
        container_out: item.container_out,
        date_out: item.date_out,
        container_in: item.container_in,
        date_in: item.date_in,
        raw: item.row_data
      }));

      const { error: lineError } = await supabase
        .from('dcli_invoice_line_staging')
        .insert(lineInserts);

      if (lineError) throw lineError;

      toast({
        title: "Invoice Saved Successfully",
        description: `Invoice ${invoice.summary_invoice_id} has been saved to staging.`,
      });

      // Navigate to Invoice Tracker
      setTimeout(() => {
        navigate('/vendors/dcli');
      }, 500);
      
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      
      // Provide specific error messages
      let errorMessage = error.message || "Failed to save invoice. Please try again.";
      
      if (error.message?.includes('duplicate')) {
        errorMessage = "An invoice with this ID already exists. Please check existing invoices.";
      } else if (error.message?.includes('foreign key')) {
        errorMessage = "Missing required reference data. Please contact support.";
      } else if (error.code === '23505') {
        errorMessage = "Duplicate invoice detected. This invoice may already exist.";
      }
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
            <Label htmlFor="amount_due">Amount Due</Label>
            <Input
              id="amount_due"
              type="number"
              step="0.01"
              value={Number(invoice.amount_due).toFixed(2)}
              onChange={(e) => handleInvoiceFieldChange('amount_due', parseFloat(e.target.value))}
            />
          </div>
        </div>
      </Card>

      {/* Line Items Table */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Line Items ({lineItems.length})</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Review all extracted data from the Excel file.
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
                    
                    if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                      displayValue = formatDateValue(cellValue);
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
        <Button onClick={handleContinue} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save & Complete'}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceReviewStep;
