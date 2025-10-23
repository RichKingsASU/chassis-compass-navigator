import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type InvoiceLine = Database['public']['Tables']['invoice_lines']['Row'];

interface InvoiceLinesTableProps {
  data: InvoiceLine[];
}

const InvoiceLinesTable = ({ data }: InvoiceLinesTableProps) => {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Line #</TableHead>
          <TableHead>Chassis</TableHead>
          <TableHead>Container</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((line) => (
          <TableRow key={line.id}>
            <TableCell>{line.line_number}</TableCell>
            <TableCell>{line.chassis_id || 'N/A'}</TableCell>
            <TableCell>{line.container_id || 'N/A'}</TableCell>
            <TableCell>${Number(line.total || 0).toFixed(2)}</TableCell>
            <TableCell>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/invoices/${line.invoice_id}/details/${line.id}`)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default InvoiceLinesTable;
