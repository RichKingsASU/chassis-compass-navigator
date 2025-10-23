import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import InvoiceUploadStep from '@/components/flexivan/invoice/InvoiceUploadStep';
import InvoiceSummaryCard from '@/components/flexivan/invoice/InvoiceSummaryCard';
import InvoiceReviewStep from '@/components/flexivan/invoice/InvoiceReviewStep';

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
}

export interface LineItem {
  invoice_status?: string;
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
  { id: 2, name: 'Review', description: 'Prefill & Edit' },
  { id: 3, name: 'Validate', description: 'Match Data' },
  { id: 4, name: 'Submit', description: 'Review & Submit' },
];

const NewInvoice = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<{ pdf: File | null; excel: File | null }>({
    pdf: null,
    excel: null,
  });
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const progressPercentage = (currentStep / steps.length) * 100;

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirm) return;
    }
    navigate('/vendors/flexivan');
  };

  const handleStepComplete = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1 && currentStep !== 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoice Tracker
            </Button>
          </div>
          <h1 className="text-3xl font-bold">New FLEXIVAN Invoice</h1>
        </div>
      </div>

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

      <div className="container mx-auto px-4 py-8 max-w-[1800px]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                onSaveDraft={handleSaveDraft}
              />
            )}
            {currentStep === 3 && extractedData && (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">Validation step - Coming soon</p>
              </div>
            )}
            {currentStep === 4 && extractedData && (
              <div className="text-center p-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">Submit step - Coming soon</p>
              </div>
            )}
          </div>

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
