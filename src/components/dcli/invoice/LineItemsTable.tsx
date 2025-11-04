import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, AlertCircle } from 'lucide-react';

interface LineItem {
  id: number;
  staging_invoice_id: string;
  line_invoice_number: string;
  chassis_out: string;
  container_in: string;
  container_out: string;
  date_in: string;
  date_out: string;
  invoice_total: number;
  invoice_status: string;
  dispute_status: string;
  tms_match_confidence: number | null;
  tms_match_type: string | null;
  validation_issues: any;
}

interface LineItemsTableProps {
  data: LineItem[];
  selectedLines: number[];
  onSelectionChange: (selected: number[]) => void;
  invoiceId?: string;
}

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return 'outline';
  if (status.includes('approved') || status.includes('paid')) return 'default';
  if (status.includes('pending') || status.includes('processing')) return 'secondary';
  if (status.includes('disputed') || status.includes('rejected')) return 'destructive';
  return 'outline';
};

const LineItemsTable = ({ data, selectedLines, onSelectionChange, invoiceId }: LineItemsTableProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof LineItem>('line_invoice_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.line_invoice_number?.toLowerCase().includes(search) ||
      item.chassis_out?.toLowerCase().includes(search) ||
      item.container_in?.toLowerCase().includes(search) ||
      item.container_out?.toLowerCase().includes(search)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: keyof LineItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sortedData.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedLines, id]);
    } else {
      onSelectionChange(selectedLines.filter(lineId => lineId !== id));
    }
  };

  const handleViewDetails = (lineInvoiceNumber: string) => {
    navigate(`/vendors/dcli/invoice-line/${lineInvoiceNumber}`, {
      state: { invoiceId }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by invoice number, chassis, or container..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        {selectedLines.length > 0 && (
          <Badge variant="secondary">
            {selectedLines.length} selected
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedLines.length === sortedData.length && sortedData.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('line_invoice_number')}
              >
                Line Invoice #
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('chassis_out')}
              >
                Chassis
              </TableHead>
              <TableHead>Container In</TableHead>
              <TableHead>Container Out</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('date_in')}
              >
                Date In
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('date_out')}
              >
                Date Out
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent text-right"
                onClick={() => handleSort('invoice_total')}
              >
                Total
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Match</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No line items found
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLines.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium"
                      onClick={() => handleViewDetails(item.line_invoice_number)}
                    >
                      {item.line_invoice_number}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.chassis_out || 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.container_in || 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.container_out || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.date_in ? new Date(item.date_in).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.date_out ? new Date(item.date_out).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.invoice_total?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.invoice_status)}>
                      {item.invoice_status || 'pending'}
                    </Badge>
                    {item.dispute_status && (
                      <Badge variant="destructive" className="ml-1">
                        {item.dispute_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.tms_match_confidence !== null ? (
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={item.tms_match_confidence > 0.8 ? 'default' : 'secondary'}
                        >
                          {Math.round(item.tms_match_confidence * 100)}%
                        </Badge>
                        {item.tms_match_confidence < 0.5 && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not matched</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetails(item.line_invoice_number)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LineItemsTable;
