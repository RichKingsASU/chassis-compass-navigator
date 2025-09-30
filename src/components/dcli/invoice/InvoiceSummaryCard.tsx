import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExtractedData } from '@/pages/dcli/NewInvoice';
import { DollarSign, FileText, AlertCircle } from 'lucide-react';

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

  const totalAmount = extractedData.line_items.reduce(
    (sum, item) => sum + Number(item.invoice_total || 0),
    0
  );
  const itemCount = extractedData.line_items.length;
  const openCount = extractedData.line_items.filter((item) => item.invoice_status === 'Open').length;
  const closedCount = extractedData.line_items.filter(
    (item) => item.invoice_status === 'Closed'
  ).length;

  const delta = Math.abs(totalAmount - Number(extractedData.invoice.amount_due));
  const hasDelta = delta > 0.01;

  return (
    <Card className="p-6 sticky top-6">
      <h3 className="text-lg font-semibold mb-4">Summary</h3>

      <div className="space-y-4">
        {/* Invoice ID */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">Invoice ID</div>
          <div className="font-semibold">{extractedData.invoice.summary_invoice_id}</div>
        </div>

        {/* Amount Due */}
        <div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Amount Due
          </div>
          <div className="text-2xl font-bold">
            ${Number(extractedData.invoice.amount_due).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Line Items Total */}
        <div>
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Line Items Total
          </div>
          <div className="text-xl font-semibold">
            ${totalAmount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Delta Alert */}
        {hasDelta && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              Amount Mismatch
            </div>
            <div className="text-sm">
              Delta: ${delta.toFixed(2)}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2">Line Items</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Count</span>
              <Badge variant="outline">{itemCount}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Open</span>
              <Badge variant="default">{openCount}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Closed</span>
              <Badge variant="secondary">{closedCount}</Badge>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2">Attachments</div>
          <div className="space-y-1">
            {extractedData.attachments.map((att, idx) => (
              <div key={idx} className="text-xs truncate" title={att.path}>
                {att.name}
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        {extractedData.warnings.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-2">Warnings</div>
            <div className="space-y-1">
              {extractedData.warnings.map((warning, idx) => (
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
