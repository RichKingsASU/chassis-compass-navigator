import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InvoiceLineDetails = () => {
  const { invoiceId, lineId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const { data: lineItem, isLoading } = useQuery({
    queryKey: ['invoice-line', lineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_lines')
        .select('*')
        .eq('id', Number(lineId))
        .single();
      
      if (error) throw error;
      const rawData = data.raw as any;
      setNotes(rawData?.notes || '');
      return data;
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const rawData = lineItem?.raw as any || {};
      const { error } = await supabase
        .from('invoice_lines')
        .update({ raw: { ...rawData, notes: newNotes } })
        .eq('id', Number(lineId));
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Notes updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['invoice-line', lineId] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lineItem) return <div>Invoice line not found</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Invoice Line Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Line #</label>
              <p className="text-lg">{lineItem.line_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Chassis</label>
              <p className="text-lg">{lineItem.chassis_id || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={4}
          />
          <Button onClick={() => updateNotesMutation.mutate(notes)} disabled={updateNotesMutation.isPending}>
            Save Notes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceLineDetails;
