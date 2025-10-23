import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import ValidationDrawer from './ValidationDrawer';
import { ExtractedData } from '@/pages/dcli/NewInvoice';

export interface InvoiceValidateStepProps {
  extractedData: ExtractedData;
  onBack: () => void;
  onComplete: () => void;
  currentStep: number;
  uploadedFiles: { pdf: File | null; excel: File | null };
  onSaveDraft: () => void;
}

const InvoiceValidateStep = ({
  extractedData,
  onBack,
  onComplete,
  uploadedFiles,
}: InvoiceValidateStepProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stagingId, setStagingId] = useState<string | null>(null);

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      // Insert into staging table first
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: stagingInvoice, error: stagingError } = await supabase
        .from('dcli_invoice_staging')
        .insert({
          summary_invoice_id: extractedData.invoice.summary_invoice_id,
          billing_date: extractedData.invoice.billing_date,
          due_date: extractedData.invoice.due_date,
          billing_terms: extractedData.invoice.billing_terms,
          vendor: extractedData.invoice.vendor,
          currency_code: extractedData.invoice.currency_code,
          amount_due: extractedData.invoice.amount_due,
          account_code: extractedData.invoice.account_code,
          pool: extractedData.invoice.pool,
          created_by: user?.id,
          validation_status: 'pending'
        })
        .select()
        .single();

      if (stagingError) throw stagingError;
      setStagingId(stagingInvoice.id);

      // Insert line items into staging
      const lineInserts = extractedData.line_items.map((item, index) => ({
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

      // Perform TMS validation (simplified - no heavy queries)
      const chassisNumbers = extractedData.line_items
        .map(item => item.chassis_out)
        .filter(Boolean)
        .slice(0, 5); // Limit to first 5 for performance

      // Query TMS data with limit
      const { data: tmsData, error: tmsError } = await supabase
        .from('tms_mg')
        .select('id, chassis_number, container_number, so_num, ld_num')
        .in('chassis_number', chassisNumbers)
        .limit(20);

      if (tmsError) {
        console.warn('TMS query error:', tmsError);
      }

      // Build validation results without individual updates
      const results: any[] = [];
      let exactMatches = 0;
      let fuzzyMatches = 0;
      let mismatches = 0;

      for (const lineItem of lineInserts) {
        const tmsMatch = tmsData?.find(t => 
          t.chassis_number === lineItem.chassis_out
        );

        if (tmsMatch) {
          const containerMatch = tmsMatch.container_number === lineItem.container_out;
          const confidence = containerMatch ? 90 : 60;
          
          if (confidence >= 80) {
            exactMatches++;
          } else {
            fuzzyMatches++;
          }

          results.push({
            line_id: lineItem.line_index,
            match_type: confidence >= 80 ? 'exact' : 'fuzzy',
            match_confidence: confidence,
            tms_match: tmsMatch
          });
        } else {
          mismatches++;
          results.push({
            line_id: lineItem.line_index,
            match_type: 'mismatch',
            match_confidence: 0
          });
        }
      }

      const summary = {
        total_rows: results.length,
        exact_matches: exactMatches,
        fuzzy_matches: fuzzyMatches,
        mismatches: mismatches
      };

      // Update staging invoice with validation results
      await supabase
        .from('dcli_invoice_staging')
        .update({
          validation_status: 'completed',
          validation_results: { summary, results }
        })
        .eq('id', stagingInvoice.id);

      setValidationResult({ summary, results });

      toast({
        title: "Validation Complete",
        description: `${exactMatches} exact, ${fuzzyMatches} fuzzy, ${mismatches} mismatches`,
      });
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!stagingId) {
      toast({
        title: "Error",
        description: "No staging data found",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Fetch staging data
      const { data: staging, error: stagingError } = await supabase
        .from('dcli_invoice_staging')
        .select('*')
        .eq('id', stagingId)
        .single();

      if (stagingError) throw stagingError;

      // Fetch staging line items
      const { data: lineItems, error: lineError } = await supabase
        .from('dcli_invoice_line_staging')
        .select('*')
        .eq('staging_invoice_id', stagingId);

      if (lineError) throw lineError;

      // Insert into raw table
      for (const line of lineItems || []) {
        await supabase
          .from('dcli_invoice_raw')
          .insert({
            invoice_id: stagingId,
            line_index: line.line_index,
            chassis: line.chassis_out,
            on_hire_container: line.container_out,
            off_hire_container: line.container_in,
            on_hire_date: line.date_out,
            off_hire_date: line.date_in,
            invoice_number: line.line_invoice_number,
            summary_invoice_number: staging.summary_invoice_id,
            billing_date: staging.billing_date,
            due_date: staging.due_date,
            billing_terms: staging.billing_terms,
            grand_total: line.invoice_total,
            raw: line.raw
          });
      }

      // Update staging status
      await supabase
        .from('dcli_invoice_staging')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', stagingId);

      toast({
        title: "Success",
        description: "Invoice approved and saved to raw table",
      });

      navigate('/vendors/dcli');
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const readyToSave = validationResult && 
    validationResult.summary.mismatches === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Results</CardTitle>
      </CardHeader>
      <CardContent>
        {isValidating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span>Validating against TMS data...</span>
          </div>
        ) : validationResult ? (
          <>
            <ValidationDrawer 
              validationResult={validationResult}
              navigationState={{
                currentStep: 3,
                extractedData,
                uploadedFiles
              }}
            />
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={onBack}>
                Back to Review
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save to Staging
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!readyToSave || isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Approve & Save to Raw
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default InvoiceValidateStep;
