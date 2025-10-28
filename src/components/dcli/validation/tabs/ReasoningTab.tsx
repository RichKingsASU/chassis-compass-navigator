import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ReasoningTabProps {
  checks?: Record<string, any>;
}

const ReasoningTab: React.FC<ReasoningTabProps> = ({ checks }) => {
  if (!checks) {
    return <div className="text-muted-foreground">No validation checks available</div>;
  }

  const checkLabels: Record<string, string> = {
    chassis_match: 'Chassis Match',
    container_match: 'Container Match',
    has_contract: 'Has Contract',
    date_sane: 'Date Validation',
    invoice_consistent: 'Invoice Consistency',
    rated_consistent: 'Rate Consistency',
    exact_pickup_date_match: 'Exact Pickup Date Match',
    exact_return_date_match: 'Exact Return Date Match',
    dup_move_exact: 'Duplicate Move (Exact)',
    dup_move_partial: 'Duplicate Move (Partial)',
    scac_misuse: 'SCAC Validation',
  };

  return (
    <div className="space-y-2">
      {Object.entries(checks).map(([key, value]) => {
        const label = checkLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const isPassed = value === true;
        const isFailed = value === false;
        
        if (typeof value !== 'boolean' && value !== null) {
          return null;
        }

        return (
          <Card key={key}>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium">{label}</span>
              {isPassed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : isFailed ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <span className="text-muted-foreground text-sm">N/A</span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ReasoningTab;
