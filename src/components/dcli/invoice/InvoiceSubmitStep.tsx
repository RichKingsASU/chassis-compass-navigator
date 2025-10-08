import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertTriangle, FileText, Calendar, DollarSign } from 'lucide-react';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Save } from 'lucide-react';

interface InvoiceSubmitStepProps {
  extractedData: ExtractedData;
  onBack: () => void;
  onSaveDraft: () => void;
}

const InvoiceSubmitStep = ({ extractedData, onBack, onSaveDraft }: InvoiceSubmitStepProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalLines = extractedData.line_items.length;
  const validatedLines = extractedData.line_items.filter(item => 
    item.dispute_status === null || item.dispute_status === 'resolved'
  ).length;
  const pendingLines = totalLines - validatedLines;
  const completionRate = Math.round((validatedLines / totalLines) * 100);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert invoice summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('dcli_invoice_staging')
        .update({
          status: 'submitted',
        })
        .eq('summary_invoice_id', extractedData.invoice.summary_invoice_id)
        .select()
        .single();

      if (summaryError) throw summaryError;

      // Insert line items with user comments
      const lineItemsToInsert = extractedData.line_items.map(item => ({
        ...item,
        summary_invoice_id: extractedData.invoice.summary_invoice_id,
        invoice_status: item.dispute_status ? 'disputed' : 'approved',
        user_comments: comments || null,
        submitted_at: new Date().toISOString(),
        submitted_by: user?.email || 'unknown',
      }));

      const { error: lineItemsError } = await supabase
        .from('dcli_invoice_line_item')
        .insert(lineItemsToInsert);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: "Invoice Submitted Successfully",
        description: `${totalLines} line items submitted. Completion rate: ${completionRate}%`,
      });

      navigate('/vendors/dcli');
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Final Review & Submit</h2>
        
        {/* Invoice Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Invoice ID</p>
            <p className="font-semibold">{extractedData.invoice.summary_invoice_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billing Date</p>
            <p className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {extractedData.invoice.billing_date}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ${extractedData.invoice.amount_due.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline">{extractedData.invoice.status}</Badge>
          </div>
        </div>

        {/* Validation Summary */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Validation Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Validated</p>
                <p className="text-xl font-bold">{validatedLines}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingLines}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings if not 100% */}
        {completionRate < 100 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Incomplete Validation
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {pendingLines} line item{pendingLines !== 1 ? 's' : ''} have not been fully validated. 
                  You can still submit this invoice, but please document your decision below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Comments */}
        <div className="space-y-2">
          <Label htmlFor="comments">
            Submission Comments {completionRate < 100 && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            id="comments"
            placeholder="Document any decisions made, reasons for submitting with incomplete validation, or other relevant notes..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            These comments will be saved with the invoice for audit trail purposes.
          </p>
        </div>
      </Card>

      {/* Line Items Preview */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Line Items ({totalLines})</h3>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {extractedData.line_items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                <div>
                  <p className="font-medium">{item.line_invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.chassis_out || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.dispute_status ? 'destructive' : 'default'}>
                  {item.dispute_status || 'Validated'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onSaveDraft}>
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (completionRate < 100 && !comments.trim())}
          className="min-w-32"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Invoice'}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceSubmitStep;
