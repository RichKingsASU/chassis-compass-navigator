
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
import { TMSDataItem, TMSStatus, TMSType } from './TMSDataModel';

interface TMSTableProps {
  data: TMSDataItem[];
}

const TMSTable: React.FC<TMSTableProps> = ({ data }) => {
  /**
   * Returns the appropriate badge component based on status
   * @param status - The status of the TMS item
   */
  const getStatusBadge = (status: TMSStatus) => {
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

  /**
   * Returns the appropriate icon based on the TMS data type
   * @param type - The type of TMS data
   */
  const getTypeIcon = (type: TMSType) => {
    switch (type) {
      case 'Order':
        return <FileText size={14} className="mr-1 inline" />;
      case 'Dispatch':
        return <Truck size={14} className="mr-1 inline" />;
      case 'Shipment':
        return <Route size={14} className="mr-1 inline" />;
      case 'Invoice':
        return <FileCheck size={14} className="mr-1 inline" />;
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
                  {getTypeIcon(item.type)}
                  {item.type}
                </TableCell>
                <TableCell>{item.referenceId}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <Calendar size={14} className="mr-1 inline text-muted-foreground" />
                  {item.timestamp}
                </TableCell>
                <TableCell>{item.details}</TableCell>
                <TableCell>{getStatusBadge(item.status as TMSStatus)}</TableCell>
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
