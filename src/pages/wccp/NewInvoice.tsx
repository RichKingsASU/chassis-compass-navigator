import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewInvoice = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/vendors/wccp')} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to WCCP Portal
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New WCCP Invoice</h1>
        <p className="text-muted-foreground">Upload and validate a new invoice</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Invoice
          </CardTitle>
          <CardDescription>
            Invoice upload functionality will be available once WCCP data integration is complete.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Please contact your account manager for assistance with invoice submission.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewInvoice;
