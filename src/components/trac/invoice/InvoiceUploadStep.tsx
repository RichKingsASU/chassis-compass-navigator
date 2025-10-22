import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload } from 'lucide-react';

interface InvoiceUploadStepProps {
  onNext: () => void;
}

const InvoiceUploadStep: React.FC<InvoiceUploadStepProps> = ({ onNext }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            TRAC invoice tables (trac_invoice, trac_invoice_data) are not configured in the database.
          </AlertDescription>
        </Alert>

        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Feature Unavailable</h3>
          <p className="text-muted-foreground mb-4">
            Configure database tables to enable TRAC invoice uploads
          </p>
          <Button disabled variant="outline">
            Select Files
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceUploadStep;
