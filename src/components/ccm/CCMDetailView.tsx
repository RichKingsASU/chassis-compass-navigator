import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CCMDetailViewProps {
  record: any;
  onBack: () => void;
}

const CCMDetailView: React.FC<CCMDetailViewProps> = ({ record, onBack }) => {
  const formatCurrency = (amount: string | number) => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
        <p className="text-muted-foreground">Review invoice information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
              <p className="text-lg font-semibold">{record.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Provider</p>
              <p className="text-lg">{record.provider}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
              <p className="text-lg">{formatDate(record.invoice_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(record.total_amount_usd)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg">{record.status}</p>
            </div>
            {record.reason_for_dispute && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Dispute Reason</p>
                <p className="text-lg">{record.reason_for_dispute}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CCMDetailView;
