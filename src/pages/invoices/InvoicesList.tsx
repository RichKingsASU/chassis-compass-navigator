import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InvoiceLinesTable from '@/components/invoices/InvoiceLinesTable';
import { Loader2 } from 'lucide-react';

const InvoicesList = () => {
  const navigate = useNavigate();

  const { data: invoiceLines, isLoading } = useQuery({
    queryKey: ['invoice-lines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_lines')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Lines</h1>
          <p className="text-muted-foreground">
            Review and validate invoice line items
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoice Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLinesTable data={invoiceLines || []} />
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesList;
