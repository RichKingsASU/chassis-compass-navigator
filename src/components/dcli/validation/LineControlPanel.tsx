import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import ReasoningTab from './tabs/ReasoningTab';
import TMSDataTab from './tabs/TMSDataTab';
import ActivityHistoryTab from './tabs/ActivityHistoryTab';
import DisputeModal from './DisputeModal';

interface LineControlPanelProps {
  lineId: number | null;
  open: boolean;
  onClose: () => void;
}

const LineControlPanel: React.FC<LineControlPanelProps> = ({ lineId, open, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  const { data: lineData } = useQuery({
    queryKey: ['validation-line-detail', lineId],
    queryFn: async () => {
      if (!lineId) return null;
      
      // @ts-ignore - view exists but not in types
      const { data, error } = await (supabase as any)
        .from('v_invoice_line_enriched')
        .select('*')
        .eq('invoice_line_id', lineId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!lineId,
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      // @ts-ignore - RPC exists but not in types
      const { error } = await supabase.rpc('fn_record_invoice_action', {
        p_invoice_line_id: lineId,
        p_action: 'VALIDATE',
        p_reason: null,
        p_delta_amount: 0
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Line validated successfully' });
      queryClient.invalidateQueries({ queryKey: ['validation-lines'] });
      queryClient.invalidateQueries({ queryKey: ['validation-summary'] });
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Validation failed', description: error.message, variant: 'destructive' });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      // @ts-ignore - RPC exists but not in types
      const { error } = await supabase.rpc('fn_add_invoice_comment', {
        p_invoice_line_id: lineId,
        p_comment_text: commentText
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Comment added' });
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['activity-history', lineId] });
    },
    onError: (error) => {
      toast({ title: 'Failed to add comment', description: error.message, variant: 'destructive' });
    },
  });

  if (!lineId) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Line Control Panel - #{lineId}</SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="reasoning" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
              <TabsTrigger value="tms">TMS Data</TabsTrigger>
              <TabsTrigger value="history">Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="reasoning" className="space-y-4">
              <ReasoningTab checks={(lineData as any)?.checks} />
            </TabsContent>

            <TabsContent value="tms" className="space-y-4">
              <TMSDataTab candidates={(lineData as any)?.tms_candidates || []} />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ActivityHistoryTab lineId={lineId} />
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={() => commentMutation.mutate(comment)}
                  disabled={!comment.trim() || commentMutation.isPending}
                >
                  Submit Comment
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex gap-2 pt-4 border-t">
            <Button 
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
              className="flex-1"
            >
              Validate
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setDisputeModalOpen(true)}
              className="flex-1"
            >
              Dispute
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DisputeModal
        open={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        lineId={lineId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['validation-lines'] });
          queryClient.invalidateQueries({ queryKey: ['validation-summary'] });
          onClose();
        }}
      />
    </>
  );
};

export default LineControlPanel;
