import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const InvoiceLineDetails = () => {
  const navigate = useNavigate();
  const { lineId } = useParams();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/vendors/wccp')} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to WCCP Portal
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice Line Details</h1>
        <p className="text-muted-foreground">Line Item #{lineId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Item Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed line item view will be available once WCCP data integration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDetails;
