
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Truck, Route, Calendar, FileText } from 'lucide-react';

interface TMSData {
  id: string;
  source: string;
  type: string;
  referenceId: string;
  timestamp: string;
  details: string;
  status: string;
}

interface TMSTableProps {
  data: TMSData[];
}

const TMSTable: React.FC<TMSTableProps> = ({ data }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TMS ID</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reference ID</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell>
                  {item.type === 'Order' && <FileText size={14} className="mr-1 inline" />}
                  {item.type === 'Dispatch' && <Truck size={14} className="mr-1 inline" />}
                  {item.type === 'Shipment' && <Route size={14} className="mr-1 inline" />}
                  {item.type === 'Invoice' && <FileCheck size={14} className="mr-1 inline" />}
                  {item.type}
                </TableCell>
                <TableCell>{item.referenceId}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <Calendar size={14} className="mr-1 inline text-muted-foreground" />
                  {item.timestamp}
                </TableCell>
                <TableCell>{item.details}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <FileCheck size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Truck size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                No TMS data found matching your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TMSTable;
