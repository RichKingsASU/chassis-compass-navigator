import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WCCPInvoiceTrackerProps {
  onViewDetail: (record: any) => void;
}

const WCCPInvoiceTracker = ({ onViewDetail }: WCCPInvoiceTrackerProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoice Management</h2>
          <p className="text-muted-foreground">
            Track, validate, and manage WCCP invoices
          </p>
        </div>
        <Button onClick={() => navigate('/vendors/wccp/invoices/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            WCCP Invoice Data
          </CardTitle>
          <CardDescription>
            WCCP invoice data integration is currently being configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Please contact your account manager for current invoice information.
          </p>
          <p className="text-sm text-muted-foreground">
            Once configured, you'll be able to upload, track, and manage WCCP invoices here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WCCPInvoiceTracker;
