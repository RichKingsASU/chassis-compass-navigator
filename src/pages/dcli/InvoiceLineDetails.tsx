import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ValidationDrawer from '@/components/dcli/invoice/ValidationDrawer';
import { useToast } from '@/hooks/use-toast';

const InvoiceLineDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lineId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState<any>(null);

  useEffect(() => {
    const fetchValidationData = async () => {
      if (!lineId) return;

      try {
        setLoading(true);
        
        // Query dcli_invoice_staging for validation results containing this line
        const { data, error } = await supabase
          .from('dcli_invoice_staging')
          .select('validation_results')
          .not('validation_results', 'is', null);

        if (error) throw error;

        // Find the invoice that contains this line item
        let foundValidation = null;
        for (const invoice of data || []) {
          const results = invoice.validation_results as any;
          if (results?.rows) {
            const matchingRow = results.rows.find((row: any) => 
              row.line_invoice_number === lineId
            );
            if (matchingRow) {
              // Create a filtered validation result for just this line
              foundValidation = {
                summary: {
                  exact_matches: matchingRow.match_type === 'exact' ? 1 : 0,
                  fuzzy_matches: matchingRow.match_type === 'fuzzy' ? 1 : 0,
                  mismatches: matchingRow.match_type === 'mismatch' ? 1 : 0,
                  total_rows: 1,
                },
                rows: [matchingRow],
                errors: results.errors || [],
              };
              break;
            }
          }
        }

        setValidationData(foundValidation);

        if (!foundValidation) {
          toast({
            title: "Line Not Found",
            description: "This line item has not been validated yet.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Error fetching validation data:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load validation data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchValidationData();
  }, [lineId, toast]);

  const navigateBack = () => {
    navigate('/vendors/dcli/invoices/new', { replace: false });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={navigateBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Invoice Line Validation</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Item #{lineId}</CardTitle>
        </CardHeader>
        <CardContent>
          {validationData ? (
            <ValidationDrawer 
              validationResult={validationData} 
              navigationState={location.state}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No validation data found for this line item. Please validate the invoice first.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDetails;
