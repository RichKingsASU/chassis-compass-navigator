import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LineActions from './LineActions';

interface InvoiceLineData {
  id: string;
  invoice_number: string;
  line_number: number;
  status: string;
  match_score: number;
  exact_match: boolean;
  dispute_status?: string;
}

interface InvoiceLinesTableProps {
  data: InvoiceLineData[];
}

const InvoiceLinesTable = ({ data }: InvoiceLinesTableProps) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'validated':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'in_dispute':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Line #</TableHead>
          <TableHead>Match %</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No invoice lines found
            </TableCell>
          </TableRow>
        ) : (
          data.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-medium">{line.invoice_number}</TableCell>
              <TableCell>{line.line_number}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={line.match_score} className="w-24" />
                  <span className="text-sm text-muted-foreground">
                    {line.match_score}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(line.status)}>
                  {line.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <LineActions lineItem={line} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default InvoiceLinesTable;
