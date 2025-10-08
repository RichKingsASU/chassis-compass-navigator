import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InvoiceLineDetails = () => {
  const { lineId } = useParams();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">TRAC Invoice Line Details</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Line Item: {lineId}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed view for TRAC invoice line item will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDetails;
