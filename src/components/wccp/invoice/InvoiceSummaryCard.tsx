import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExtractedData } from './InvoiceUploadStep';

interface InvoiceSummaryCardProps {
  extractedData: ExtractedData | null;
  currentStep: number;
}

const InvoiceSummaryCard: React.FC<InvoiceSummaryCardProps> = ({
  extractedData,
  currentStep,
}) => {
  if (!extractedData) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload files to see invoice summary
          </p>
        </CardContent>
      </Card>
    );
  }

  const { invoice, line_items } = extractedData;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Invoice Number</p>
          <p className="font-semibold">{invoice.summary_invoice_id}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Vendor</p>
          <p className="font-semibold">{invoice.vendor}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Billing Date</p>
          <p className="font-semibold">{invoice.billing_date}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Due Date</p>
          <p className="font-semibold">{invoice.due_date}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="font-semibold text-lg">
            {invoice.currency_code} ${invoice.amount_due.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Line Items</p>
          <p className="font-semibold">{line_items.length}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge variant="secondary">{invoice.status}</Badge>
        </div>

        {currentStep >= 2 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Progress</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Files uploaded</span>
              </div>
              {currentStep >= 2 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Data extracted</span>
                </div>
              )}
              {currentStep >= 3 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Review complete</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceSummaryCard;
