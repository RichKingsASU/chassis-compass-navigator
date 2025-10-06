import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DisputeHistory from '@/components/invoices/DisputeHistory';

interface DisputeHistoryEntry {
  timestamp: string;
  action: string;
  reason?: string;
  note: string;
  user?: string;
}

const InvoiceLineDispute = () => {
  const { invoiceId, lineId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const { data: lineItem, isLoading } = useQuery({
    queryKey: ['invoice-line', lineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_lines')
        .select('*')
        .eq('id', lineId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const openDisputeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('open_dispute', {
        line_id: lineId,
        reason,
        note
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Dispute opened successfully'
      });
      setReason('');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['invoice-line', lineId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const closeDisputeMutation = useMutation({
    mutationFn: async (closeNote: string) => {
      const { error } = await supabase.rpc('close_dispute', {
        line_id: lineId,
        note: closeNote
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Dispute closed successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['invoice-line', lineId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
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

  const disputeHistory = Array.isArray(lineItem.dispute_history)
    ? lineItem.dispute_history as unknown as DisputeHistoryEntry[]
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/invoices/${invoiceId}/details/${lineId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Dispute</h1>
          <p className="text-muted-foreground">
            Manage dispute for this invoice line
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
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant="secondary">{lineItem.status}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dispute Status</label>
              <Badge variant={lineItem.dispute_status === 'in_dispute' ? 'destructive' : 'default'}>
                {lineItem.dispute_status || 'none'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {lineItem.dispute_status !== 'in_dispute' && (
        <Card>
          <CardHeader>
            <CardTitle>Open Dispute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter dispute reason..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add additional details..."
                rows={4}
              />
            </div>
            <Button
              onClick={() => openDisputeMutation.mutate()}
              disabled={!reason || !note || openDisputeMutation.isPending}
            >
              Open Dispute
            </Button>
          </CardContent>
        </Card>
      )}

      {lineItem.dispute_status === 'in_dispute' && (
        <Card>
          <CardHeader>
            <CardTitle>Close Dispute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="closeNote">Resolution Note</Label>
              <Textarea
                id="closeNote"
                placeholder="Enter resolution details..."
                rows={4}
              />
            </div>
            <Button
              onClick={() => {
                const closeNote = (document.getElementById('closeNote') as HTMLTextAreaElement)?.value;
                if (closeNote) {
                  closeDisputeMutation.mutate(closeNote);
                }
              }}
              disabled={closeDisputeMutation.isPending}
              variant="destructive"
            >
              Close Dispute
            </Button>
          </CardContent>
        </Card>
      )}

      <DisputeHistory history={disputeHistory} />

      <div className="flex gap-4">
        <Button
          onClick={() => navigate('/invoices')}
          variant="outline"
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default InvoiceLineDispute;
