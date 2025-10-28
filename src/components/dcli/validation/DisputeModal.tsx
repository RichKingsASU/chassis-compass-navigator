import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface DisputeModalProps {
  open: boolean;
  onClose: () => void;
  lineId: number;
  onSuccess: () => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ open, onClose, lineId, onSuccess }) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');

  const disputeMutation = useMutation({
    mutationFn: async () => {
      // @ts-ignore - RPC exists but not in types
      const { error } = await supabase.rpc('fn_record_invoice_action', {
        p_invoice_line_id: lineId,
        p_action: 'DISPUTE',
        p_reason: reason,
        p_delta_amount: parseFloat(amount) || 0
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Dispute recorded successfully' });
      setReason('');
      setAmount('');
      onClose();
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Failed to record dispute', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispute Invoice Line</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Dispute</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this line is being disputed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Disputed Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={() => disputeMutation.mutate()}
            disabled={!reason.trim() || disputeMutation.isPending}
          >
            Submit Dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeModal;
