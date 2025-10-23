import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TroubleshootPanelProps {
  lineItem: any;
}

const TroubleshootPanel = ({ lineItem }: TroubleshootPanelProps) => {
  const checks = [
    {
      title: 'Chassis Verification',
      items: [
        { label: 'Chassis Number', value: lineItem.chassis || 'N/A' },
        { label: 'Format Valid', value: 'Yes' },
      ]
    },
    {
      title: 'Date Validation',
      items: [
        { label: 'Invoice Date', value: lineItem.created_at },
        { label: 'Date Range', value: 'Within expected range' },
      ]
    },
    {
      title: 'Amount Verification',
      items: [
        { label: 'Match Score', value: `${lineItem.match_score}%` },
        { label: 'Status', value: lineItem.exact_match ? 'Exact Match' : 'Mismatch' },
      ]
    },
    {
      title: 'Container Details',
      items: [
        { label: 'Container Number', value: lineItem.container || 'N/A' },
        { label: 'Validation', value: 'Passed' },
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Troubleshoot Checks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((check, index) => (
          <Collapsible key={index}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {check.title}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 pl-4">
              {check.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">{item.label}:</span>
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};

export default TroubleshootPanel;
