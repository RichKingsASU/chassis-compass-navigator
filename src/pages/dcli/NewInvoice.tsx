import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import InvoiceUploadStep from '@/components/dcli/invoice/InvoiceUploadStep';
import InvoiceReviewStep from '@/components/dcli/invoice/InvoiceReviewStep';
import InvoiceSummaryCard from '@/components/dcli/invoice/InvoiceSummaryCard';

export interface InvoiceData {
  summary_invoice_id: string;
  billing_date: string;
  due_date: string;
  billing_terms: string;
  vendor: string;
  currency_code: string;
  amount_due: number;
  status: string;
  account_code?: string;
  pool?: string;
}

export interface LineItem {
  invoice_type: string;
  line_invoice_number: string;
  invoice_status: string;
  invoice_total: number;
  remaining_balance: number;
  dispute_status: string | null;
  attachment_count: number;
  chassis_out: string;
  container_out: string;
  date_out: string;
  container_in: string;
  date_in: string;
  row_data?: Record<string, any>;
}

export interface ExtractedData {
  invoice: InvoiceData;
  line_items: LineItem[];
  attachments: Array<{ name: string; path: string }>;
  warnings: string[];
  source_hash: string;
  excel_headers?: string[];
}

const steps = [
  { id: 1, name: 'Upload', description: 'PDF + Excel' },
  { id: 2, name: 'Review', description: 'Review & Save' },
];

const NewInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Restore state from navigation if returning from invoice line details
  const savedState = location.state as { currentStep?: number; extractedData?: ExtractedData; uploadedFiles?: { pdf: File | null; excel: File | null } } | null;
  
  const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 1);
  const [uploadedFiles, setUploadedFiles] = useState<{ pdf: File | null; excel: File | null }>(
    savedState?.uploadedFiles || { pdf: null, excel: null }
  );
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(savedState?.extractedData || null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const progressPercentage = (currentStep / steps.length) * 100;

  const handleBack = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    navigate('/vendors/dcli');
  };

  const handleStepComplete = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      // If we have extracted data and we're going back to step 1,
      // skip step 1 since data is already uploaded
      if (currentStep === 2 && extractedData) {
        // Don't go back to upload if we already have data
        toast({
          title: "Already Uploaded",
          description: "Files are already uploaded. Use 'Back to Invoice Tracker' to start over.",
        });
        return;
      }
      setCurrentStep(currentStep - 1);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoice Tracker
            </Button>
          </div>
          <h1 className="text-3xl font-bold">New Invoice</h1>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Progress value={progressPercentage} className="mb-4" />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  index < steps.length - 1 ? 'border-r' : ''
                }`}
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <div className="font-semibold">{step.name}</div>
                <div className="text-sm text-muted-foreground">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-[1800px]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Form - Takes 3/4 of space */}
          <div className="lg:col-span-3">
            {currentStep === 1 && (
              <InvoiceUploadStep
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                onComplete={handleStepComplete}
                setExtractedData={setExtractedData}
              />
            )}
            {currentStep === 2 && extractedData && (
              <InvoiceReviewStep
                extractedData={extractedData}
                setExtractedData={setExtractedData}
              onComplete={handleStepComplete}
              onBack={handleStepBack}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
            )}
          </div>

          {/* Right: Summary - Takes 1/4 of space */}
          <div className="lg:col-span-1">
            <InvoiceSummaryCard
              extractedData={extractedData}
              currentStep={currentStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoice;
