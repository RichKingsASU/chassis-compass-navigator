import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LineActionsProps {
  lineItem: {
    id: string;
    invoice_number: string;
    status: string;
    exact_match: boolean;
  };
}

const LineActions = ({ lineItem }: LineActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('validate_invoice_line', {
        line_id: lineItem.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice line validated successfully'
      });
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

  const canValidate = lineItem.exact_match && lineItem.status !== 'validated';
  const canDispute = !lineItem.exact_match && lineItem.status !== 'validated';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => navigate(`/invoices/${lineItem.invoice_number}/details/${lineItem.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Details
        </DropdownMenuItem>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenuItem
                  disabled={!canValidate}
                  onClick={() => validateMutation.mutate()}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validate
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {!canValidate && (
              <TooltipContent>
                <p>Enable once this line is a 100% exact match.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenuItem
                  disabled={!canDispute}
                  onClick={() => navigate(`/invoices/${lineItem.invoice_number}/dispute/${lineItem.id}`)}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Dispute
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {!canDispute && (
              <TooltipContent>
                <p>Only available when the line is not an exact match.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LineActions;
