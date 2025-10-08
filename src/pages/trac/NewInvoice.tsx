import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentUpload from '@/components/ccm/DocumentUpload';

const NewInvoice = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload TRAC Invoice</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Invoice Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewInvoice;
