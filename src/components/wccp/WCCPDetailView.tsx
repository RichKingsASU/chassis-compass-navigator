import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

interface WCCPDetailViewProps {
  record: any;
  onBack: () => void;
}

const WCCPDetailView = ({ record, onBack }: WCCPDetailViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
          <p className="text-muted-foreground">View detailed invoice information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WCCP Invoice Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed invoice view will be available once WCCP data integration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WCCPDetailView;
