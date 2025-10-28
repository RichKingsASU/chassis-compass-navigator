import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationFilters } from '@/pages/dcli/InvoiceValidation';
import { CheckCircle2 } from 'lucide-react';

interface ValidationSummaryProps {
  filters: ValidationFilters;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ filters }) => {
  const { data: stats } = useQuery({
    queryKey: ['validation-summary', filters],
    queryFn: async () => {
      // @ts-ignore - view exists but not in types
      let query = (supabase as any)
        .from('v_invoice_line_verdict')
        .select('invoice_line_id, confidence_score', { count: 'exact' });

      // Apply filters
      if (filters.customer_name) {
        query = query.ilike('customer_name', `%${filters.customer_name}%`);
      }
      if (filters.ssl) {
        query = query.eq('ssl', filters.ssl);
      }
      if (filters.on_hire_date_start) {
        query = query.gte('on_hire_date', filters.on_hire_date_start);
      }
      if (filters.on_hire_date_end) {
        query = query.lte('on_hire_date', filters.on_hire_date_end);
      }
      if (filters.confidence_min !== undefined) {
        query = query.gte('confidence_score', filters.confidence_min);
      }
      if (filters.confidence_max !== undefined) {
        query = query.lte('confidence_score', filters.confidence_max);
      }

      const { data, count } = await query;

      const validated = data?.filter((row: any) => row.confidence_score >= 0.9).length || 0;
      const total = count || 0;
      const percentage = total > 0 ? (validated / total) * 100 : 0;

      return { validated, total, percentage };
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm text-muted-foreground">% Validated</p>
            <p className="text-4xl font-bold text-primary">
              {stats?.percentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Validated Lines</p>
            <p className="text-2xl font-semibold">
              {stats?.validated} / {stats?.total}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationSummary;
