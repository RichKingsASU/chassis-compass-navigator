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
import MismatchReasons from '@/components/invoices/MismatchReasons';
import TroubleshootPanel from '@/components/invoices/TroubleshootPanel';

interface MismatchReason {
  reason: string;
  expected: string;
  actual: string;
  delta?: string;
  severity: string;
  suggested_fix?: string;
}

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
        .eq('id', lineId)
        .single();
      
      if (error) throw error;
      setNotes(data.notes || '');
      return data;
    }
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('validate_invoice_line', {
        line_id: lineId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice line validated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['invoice-line', lineId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-lines'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const { error } = await supabase
        .from('invoice_lines')
        .update({ notes: newNotes })
        .eq('id', lineId);
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

  if (!lineItem) {
    return <div>Invoice line not found</div>;
  }

  const mismatchReasons = Array.isArray(lineItem.mismatch_reasons) 
    ? lineItem.mismatch_reasons as unknown as MismatchReason[]
    : [];
  const canValidate = lineItem.exact_match && lineItem.status !== 'validated';
  const canDispute = !lineItem.exact_match && lineItem.status !== 'validated';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/invoices')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Details</h1>
          <p className="text-muted-foreground">
            Review and validate invoice line
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Invoice #</label>
              <p className="text-lg">{lineItem.invoice_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Line #</label>
              <p className="text-lg">{lineItem.line_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Match Score</label>
              <p className="text-lg">{lineItem.match_score}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={lineItem.status === 'validated' ? 'default' : 'secondary'}>
                {lineItem.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {!lineItem.exact_match && mismatchReasons.length > 0 && (
        <MismatchReasons reasons={mismatchReasons} />
      )}

      <TroubleshootPanel lineItem={lineItem} />

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this invoice line..."
            rows={4}
          />
          <Button
            onClick={() => updateNotesMutation.mutate(notes)}
            disabled={updateNotesMutation.isPending}
          >
            Save Notes
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => navigate('/invoices')}
          variant="outline"
        >
          Back
        </Button>
        {canValidate && (
          <Button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
          >
            Validate
          </Button>
        )}
        {canDispute && (
          <Button
            onClick={() => navigate(`/invoices/${invoiceId}/dispute/${lineId}`)}
            variant="destructive"
          >
            Dispute
          </Button>
        )}
      </div>
    </div>
  );
};

export default InvoiceLineDetails;
