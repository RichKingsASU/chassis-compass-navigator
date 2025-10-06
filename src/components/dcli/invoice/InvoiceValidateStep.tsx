import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
import ValidationDrawer from './ValidationDrawer';
import { Loader2 } from 'lucide-react';

import { Save } from 'lucide-react';

interface InvoiceValidateStepProps {
  extractedData: ExtractedData;
  onBack: () => void;
  onComplete: () => void;
  currentStep: number;
  uploadedFiles: { pdf: File | null; excel: File | null };
  onSaveDraft: () => void;
}

const InvoiceValidateStep: React.FC<InvoiceValidateStepProps> = ({ 
  extractedData, 
  onBack,
  onComplete,
  currentStep, 
  uploadedFiles,
  onSaveDraft
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const navigationState = {
    currentStep,
    extractedData,
    uploadedFiles
  };

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_dcli_invoice' as any, {
        p_summary_invoice_id: extractedData.invoice.summary_invoice_id,
        p_account_code: extractedData.invoice.account_code || '',
        p_billing_date: extractedData.invoice.billing_date,
        p_due_date: extractedData.invoice.due_date,
        p_line_items: extractedData.line_items as any,
      });

      if (error) throw error;

      const validationData = data as any;
      setValidationResult(validationData);

      if (validationData) {
        toast({
          title: 'Validation Complete',
          description: `Found ${validationData.summary.exact_matches} exact matches, ${validationData.summary.fuzzy_matches} fuzzy matches, ${validationData.summary.mismatches} mismatches.`,
        });
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation Failed',
        description: error.message || 'Failed to validate invoice.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check for duplicates
      const { data: existing, error: checkError } = await supabase
        .from('dcli_invoice' as any)
        .select('invoice_id')
        .eq('invoice_id', extractedData.invoice.summary_invoice_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast({
          title: 'Duplicate Invoice',
          description: 'An invoice with this ID already exists.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // Insert header
      const { error: headerError } = await supabase.from('dcli_invoice' as any).insert({
        invoice_id: extractedData.invoice.summary_invoice_id,
        invoice_date: extractedData.invoice.billing_date,
        billing_date: extractedData.invoice.billing_date,
        due_date: extractedData.invoice.due_date,
        amount: extractedData.invoice.amount_due,
        status: extractedData.invoice.status,
        description: `DCLI Invoice ${extractedData.invoice.summary_invoice_id}`,
      });

      if (headerError) throw headerError;

      // Insert line items
      const lineItemsToInsert = extractedData.line_items.map((item) => ({
        summary_invoice_id: extractedData.invoice.summary_invoice_id,
        line_invoice_number: item.line_invoice_number,
        invoice_type: item.invoice_type,
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
        attachments: extractedData.attachments,
      }));

      const { error: lineItemsError } = await supabase
        .from('dcli_invoice_line_item' as any)
        .insert(lineItemsToInsert);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: 'Invoice Created',
        description: `Invoice ${extractedData.invoice.summary_invoice_id} has been saved.`,
      });

      navigate(`/vendors/dcli`);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save invoice.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const readyToSave =
    validationResult &&
    validationResult.summary.mismatches === 0 &&
    validationResult.errors.length === 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Validation Results</h2>

        {isValidating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Validating against TMS data...</span>
          </div>
        ) : validationResult ? (
          <ValidationDrawer validationResult={validationResult} navigationState={navigationState} />
        ) : null}
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Review
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={onComplete}>
            Continue to Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceValidateStep;
