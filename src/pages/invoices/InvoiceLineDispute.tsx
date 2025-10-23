import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

const InvoiceLineDispute = () => {
  const { invoiceId, lineId } = useParams();
  const navigate = useNavigate();

  const { data: lineItem, isLoading } = useQuery({
    queryKey: ['invoice-line', lineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_lines')
        .select('*')
        .eq('id', Number(lineId))
        .single();
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!lineItem) return <div>Invoice line not found</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${invoiceId}/details/${lineId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Invoice Line Dispute</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Dispute functions need database configuration</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDispute;
