import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, FileText, Calendar, DollarSign } from 'lucide-react';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvoiceSubmitStepProps {
  extractedData: ExtractedData;
  onBack: () => void;
  onSaveDraft: () => void;
}

const InvoiceSubmitStep = ({ extractedData, onBack, onSaveDraft }: InvoiceSubmitStepProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalLines = extractedData.line_items.length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      toast({
        title: "Submission Complete",
        description: "Invoice has been reviewed (staging tables not configured).",
      });

      setTimeout(() => {
        navigate('/vendors/dcli');
      }, 1000);
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          DCLI staging tables are not yet configured. Data cannot be saved to database.
        </AlertDescription>
      </Alert>

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
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Line Items</p>
              <p className="text-xl font-bold">{totalLines}</p>
            </div>
          </div>
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
                  <p className="font-medium">{item.line_invoice_number || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.chassis_out || 'N/A'}
                  </p>
                </div>
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
          disabled={isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Invoice'}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceSubmitStep;
