import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExtractedData } from '@/pages/ccm/NewInvoice';
import { DollarSign } from 'lucide-react';

interface InvoiceSummaryCardProps {
  extractedData: ExtractedData | null;
  currentStep: number;
}

const InvoiceSummaryCard: React.FC<InvoiceSummaryCardProps> = ({ extractedData, currentStep }) => {
  if (!extractedData || currentStep === 1) {
    return (
      <Card className="p-6 sticky top-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <p className="text-sm text-muted-foreground">
          Upload your PDF and Excel files to see invoice summary.
        </p>
      </Card>
    );
  }

  const lineItems = extractedData.line_items || [];
  const itemCount = lineItems.length;

  return (
    <Card className="p-6 sticky top-6">
      <h3 className="text-lg font-semibold mb-4">Summary</h3>

      <div className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Invoice Number</div>
          <div className="font-semibold">{extractedData.invoice.invoice_number}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Total Amount
          </div>
          <div className="text-2xl font-bold">
            ${Number(extractedData.invoice.total_amount_usd).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2">Line Items</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Count</span>
              <Badge variant="outline">{itemCount}</Badge>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2">Attachments</div>
          <div className="space-y-1">
            {(extractedData.attachments || []).map((att, idx) => (
              <div key={idx} className="text-xs truncate" title={att.path}>
                {att.name}
              </div>
            ))}
          </div>
        </div>

        {(extractedData.warnings || []).length > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-2">Warnings</div>
            <div className="space-y-1">
              {(extractedData.warnings || []).map((warning, idx) => (
                <div key={idx} className="text-xs text-yellow-600">
                  • {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default InvoiceSummaryCard;
