import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const InvoiceReview = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/vendors/wccp')} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to WCCP Portal
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Invoice {invoiceId}</h1>
        <p className="text-muted-foreground">Validate and approve invoice details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Invoice review functionality will be available once WCCP data integration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceReview;
