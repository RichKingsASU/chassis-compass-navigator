import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import InvoiceUploadStep from '@/components/wccp/invoice/InvoiceUploadStep';
import InvoiceSummaryCard from '@/components/wccp/invoice/InvoiceSummaryCard';
import { ExtractedData } from '@/components/wccp/invoice/InvoiceUploadStep';

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

  const progressPercentage = (currentStep / steps.length) * 100;

  const handleBack = () => {
    navigate('/vendors/wccp');
  };

  const handleStepComplete = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
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
              Back to WCCP Portal
            </Button>
          </div>
          <h1 className="text-3xl font-bold">New WCCP Invoice</h1>
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
