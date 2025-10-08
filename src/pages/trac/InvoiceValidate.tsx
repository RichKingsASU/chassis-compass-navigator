import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import ValidationDrawer from '@/components/dcli/invoice/ValidationDrawer';

const InvoiceValidate = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      
      const { data: invoiceHeader, error: invoiceError } = await supabase
        .from('trac_invoice')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceHeader);

      const { data: lineData, error: dataError } = await supabase
        .from('trac_invoice_data')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (dataError) throw dataError;
      setInvoiceData(lineData || []);
      
      // Auto-run validation after loading
      await runValidation(invoiceHeader, lineData || []);
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async (invoiceHeader?: any, lineItems?: any[]) => {
    setIsValidating(true);
    try {
      const invoiceToValidate = invoiceHeader || invoice;
      const linesToValidate = lineItems || invoiceData;

      // Query TMS data for validation
      const chassisNumbers = linesToValidate
        .map((item: any) => item.row_data?.chassis_norm || item.row_data?.Chassis)
        .filter(Boolean);

      const { data: tmsMatches, error: tmsError } = await supabase
        .from('mg_tms')
        .select('*')
        .in('chassis_norm', chassisNumbers);

      if (tmsError) throw tmsError;

      // Perform validation matching
      const validatedRows = linesToValidate.map((lineItem: any) => {
        const chassis = lineItem.row_data?.chassis_norm || lineItem.row_data?.Chassis;
        const container = lineItem.row_data?.container_norm || lineItem.row_data?.Container;
        const tmsMatch = tmsMatches?.find(tms => tms.chassis_norm === chassis);

        if (!tmsMatch) {
          return {
            line_invoice_number: lineItem.id || 'N/A',
            chassis: chassis || 'N/A',
            container: container || 'N/A',
            match_confidence: 0,
            match_type: 'mismatch' as const,
            tms_match: null
          };
        }

        // Calculate match confidence based on field matches
        let matchScore = 0;
        let totalFields = 0;
        const matchReasons = [];

        // Compare chassis
        if (chassis) {
          totalFields++;
          if (tmsMatch.chassis_norm === chassis) {
            matchScore++;
            matchReasons.push('Chassis match');
          }
        }

        // Compare container
        if (container) {
          totalFields++;
          if (tmsMatch.container_norm === container) {
            matchScore++;
            matchReasons.push('Container match');
          }
        }

        const matchPercentage = totalFields > 0 ? Math.round((matchScore / totalFields) * 100) : 0;
        
        return {
          line_invoice_number: lineItem.id || 'N/A',
          chassis: chassis || 'N/A',
          container: container || 'N/A',
          match_confidence: matchPercentage,
          match_type: matchPercentage === 100 ? 'exact' : matchPercentage >= 50 ? 'fuzzy' : 'mismatch' as const,
          tms_match: {
            ld_num: tmsMatch.ld_num || '',
            so_num: tmsMatch.so_num || '',
            shipment_number: tmsMatch.id || '',
            chassis_number: tmsMatch.chassis_norm || '',
            container_number: tmsMatch.container_norm || '',
            pickup_actual_date: tmsMatch.pickup_actual_date || '',
            delivery_actual_date: tmsMatch.delivery_actual_date || '',
            carrier_name: tmsMatch.carrier_name || '',
            customer_name: tmsMatch.customer_name || '',
            confidence: matchPercentage,
            match_reasons: matchReasons
          }
        };
      });

      const exactMatches = validatedRows.filter(r => r.match_type === 'exact').length;
      const fuzzyMatches = validatedRows.filter(r => r.match_type === 'fuzzy').length;
      const mismatches = validatedRows.filter(r => r.match_type === 'mismatch').length;

      const result = {
        summary: {
          total_rows: validatedRows.length,
          exact_matches: exactMatches,
          fuzzy_matches: fuzzyMatches,
          mismatches: mismatches
        },
        rows: validatedRows,
        errors: mismatches > 0 ? [`${mismatches} line items have validation issues`] : []
      };

      setValidationResult(result);

      toast({
        title: 'Validation Complete',
        description: `Found ${exactMatches} exact matches, ${fuzzyMatches} fuzzy matches, ${mismatches} mismatches.`,
      });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button onClick={() => navigate('/vendors/trac')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/vendors/trac')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoice Tracker
          </Button>
          <h1 className="text-3xl font-bold">Validate Invoice</h1>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="relative max-w-4xl mx-auto">
            {/* Progress Bar Background */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
            {/* Progress Bar Fill - Dark portion (completed steps) */}
            <div className="absolute top-5 left-0 h-1 bg-[hsl(215,25%,27%)] rounded-full" style={{ width: '50%' }} />
            {/* Progress Bar Fill - Teal portion (current) */}
            <div className="absolute top-5 left-0 h-1 bg-gradient-to-r from-[hsl(215,25%,27%)] via-[hsl(215,25%,27%)] to-teal-500 rounded-full" style={{ width: '75%' }} />
            
            <div className="relative flex items-start justify-between">
              {/* Step 1 - Upload (Complete) */}
              <div className="flex flex-col items-center" style={{ width: '25%' }}>
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Upload</div>
                  <div className="text-xs text-muted-foreground">PDF + Excel</div>
                </div>
              </div>
              
              {/* Step 2 - Review (Complete) */}
              <div className="flex flex-col items-center" style={{ width: '25%' }}>
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Review</div>
                  <div className="text-xs text-muted-foreground">Prefill & Edit</div>
                </div>
              </div>
              
              {/* Step 3 - Validate (Current) */}
              <div className="flex flex-col items-center" style={{ width: '25%' }}>
                <div className="w-10 h-10 rounded-full bg-[hsl(215,25%,27%)] text-white flex items-center justify-center mb-2 font-bold">
                  3
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Validate</div>
                  <div className="text-xs text-muted-foreground">Match Data</div>
                </div>
              </div>
              
              {/* Step 4 - Submit */}
              <div className="flex flex-col items-center" style={{ width: '25%' }}>
                <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2 font-bold">
                  4
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm text-muted-foreground">Submit</div>
                  <div className="text-xs text-muted-foreground">Review & Submit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isValidating ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-lg">Validating against TMS data...</span>
              </div>
            ) : validationResult ? (
              <ValidationDrawer 
                validationResult={validationResult} 
                navigationState={{
                  currentStep: 3,
                  extractedData: {
                    invoice: invoice,
                    line_items: invoiceData,
                    attachments: []
                  },
                  uploadedFiles: { pdf: null, excel: null }
                }} 
              />
            ) : null}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => navigate(`/vendors/trac/invoices/${invoiceId}/review`)}>
            Back to Review
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => runValidation()}>
              Re-run Validation
            </Button>
            <Button onClick={() => navigate(`/vendors/trac/invoices/${invoiceId}/submit`)}>
              Continue to Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceValidate;
