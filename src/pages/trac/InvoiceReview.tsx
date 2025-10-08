import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ExcelDataTable from '@/components/ccm/invoice/ExcelDataTable';

const InvoiceReview = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['trac-invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trac_invoice')
        .select('*')
        .eq('id', invoiceId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: invoiceData } = useQuery({
    queryKey: ['trac-invoice-data', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trac_invoice_data')
        .select('*')
        .eq('invoice_id', invoiceId);
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vendors/trac')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Review Invoice: {invoice?.invoice_number}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{invoice?.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{invoice?.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">${Number(invoice?.total_amount_usd || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoiceData && invoiceData.length > 0 && (
        <ExcelDataTable data={invoiceData} invoiceId={invoiceId!} tableName="trac_invoice_data" />
      )}
    </div>
  );
};

export default InvoiceReview;
