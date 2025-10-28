import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ValidationFilters } from '@/pages/dcli/InvoiceValidation';
import { formatDateValue } from '@/utils/dateUtils';
import { AlertCircle } from 'lucide-react';

interface ValidationGridProps {
  filters: ValidationFilters;
  onRowClick: (lineId: number) => void;
}

const ValidationGrid: React.FC<ValidationGridProps> = ({ filters, onRowClick }) => {
  const { data: lines, isLoading } = useQuery({
    queryKey: ['validation-lines', filters],
    queryFn: async () => {
      // @ts-ignore - view exists but not in types
      let query = (supabase as any)
        .from('v_invoice_line_verdict')
        .select('*')
        .order('invoice_line_id', { ascending: true });

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

      const { data, error } = await query;
      if (error) throw error;

      // Fetch check flags for each line
      const linesWithFlags = await Promise.all(
        (data || []).map(async (line: any) => {
          // @ts-ignore - view exists but not in types
          const { data: checks } = await (supabase as any)
            .from('v_invoice_line_checks')
            .select('*')
            .eq('invoice_line_id', line.invoice_line_id)
            .single();

          const failedChecks = checks ? Object.entries(checks)
            .filter(([key, value]) => 
              !['invoice_line_id', 'invoice_id', 'chassis_norm', 'container_norm', 
                'customer_name', 'ssl', 'on_hire_date', 'off_hire_date', 'dr',
                'invoice_amt', 'invoice_rate', 'invoice_qty', 'invoice_used_days',
                'rated_amt', 'rated_rate', 'rated_qty', 'tms_pickup_date', 
                'tms_return_date', 'tms_used_days', 'tms_overlap_count', 'tms_candidates'
              ].includes(key) && value === false
            )
            .map(([key]) => key) : [];

          return { ...line, failedChecks };
        })
      );

      return linesWithFlags;
    },
  });

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9) {
      return <Badge className="bg-green-500">High ({(score * 100).toFixed(0)}%)</Badge>;
    } else if (score >= 0.6) {
      return <Badge className="bg-yellow-500">Medium ({(score * 100).toFixed(0)}%)</Badge>;
    } else {
      return <Badge className="bg-red-500">Low ({(score * 100).toFixed(0)}%)</Badge>;
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-8">Loading validation data...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Lines</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Line ID</TableHead>
              <TableHead>Chassis</TableHead>
              <TableHead>Container</TableHead>
              <TableHead>On-Hire Date</TableHead>
              <TableHead>Off-Hire Date</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines?.map((line) => (
              <TableRow 
                key={line.invoice_line_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(line.invoice_line_id)}
              >
                <TableCell className="font-medium">{line.invoice_line_id}</TableCell>
                <TableCell>{line.chassis_norm}</TableCell>
                <TableCell>{line.container_norm}</TableCell>
                <TableCell>{formatDateValue(line.on_hire_date)}</TableCell>
                <TableCell>{formatDateValue(line.off_hire_date)}</TableCell>
                <TableCell>{getConfidenceBadge(line.confidence_score)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {line.failedChecks?.map((check: string) => (
                      <Badge 
                        key={check} 
                        variant="destructive" 
                        className="text-xs"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {check.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ValidationGrid;
