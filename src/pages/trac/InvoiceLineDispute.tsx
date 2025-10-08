import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InvoiceLineDispute = () => {
  const { lineId } = useParams();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dispute TRAC Invoice Line</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Dispute Line Item: {lineId}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dispute form for TRAC invoice line item will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDispute;
