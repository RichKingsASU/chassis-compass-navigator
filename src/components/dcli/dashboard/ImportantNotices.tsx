import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileWarning, CheckCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ImportantNotices = () => {
  const navigate = useNavigate();

  // Query for incomplete validated invoices
  const { data: stagingInvoices } = useQuery({
    queryKey: ['dcli-incomplete-staging'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_invoice_staging')
        .select('*')
        .eq('status', 'staged')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Query for invoices with validation issues
  const { data: lineItems } = useQuery({
    queryKey: ['dcli-validation-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_invoice_line_item')
        .select('*')
        .neq('invoice_status', 'validated')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  const incompleteCount = (stagingInvoices?.length || 0);
  const validationIssuesCount = (lineItems?.length || 0);
  const totalNotices = incompleteCount + validationIssuesCount + 1; // +1 for static notice

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Important Notices
          </CardTitle>
          {totalNotices > 0 && <Badge variant="destructive">{totalNotices} New</Badge>}
        </div>
        <CardDescription>Critical updates and action items</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Incomplete Staged Invoices Notice */}
          {incompleteCount > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <FileWarning className="h-4 w-4" />
                    Incomplete Validated Invoices
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    You have {incompleteCount} staged invoice{incompleteCount !== 1 ? 's' : ''} that need{incompleteCount === 1 ? 's' : ''} to be reviewed and submitted
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/vendors/dcli/invoices/new')}
                  className="ml-2"
                >
                  Review
                </Button>
              </div>
            </div>
          )}

          {/* Validation Issues Notice */}
          {validationIssuesCount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Invoices Requiring Attention
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {validationIssuesCount} invoice line{validationIssuesCount !== 1 ? 's' : ''} require validation or dispute resolution
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/vendors/dcli/invoices/new')}
                  className="ml-2"
                >
                  View
                </Button>
              </div>
            </div>
          )}

          {/* All Clear Message */}
          {incompleteCount === 0 && validationIssuesCount === 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 rounded">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                All Invoices Up to Date
              </div>
              <div className="text-sm text-muted-foreground">No pending validation or review items</div>
            </div>
          )}

          {/* Static Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded">
            <div className="font-medium">New Portal Feature</div>
            <div className="text-sm text-muted-foreground">Batch upload functionality now available for invoice processing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportantNotices;
