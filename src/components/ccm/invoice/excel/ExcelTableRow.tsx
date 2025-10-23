
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExcelDataItem } from '@/components/ccm/invoice/types';

interface ExcelTableRowProps {
  item: ExcelDataItem;
  displayColumns: string[];
}

const ExcelTableRow: React.FC<ExcelTableRowProps> = ({ item, displayColumns }) => {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">{item.sheet_name}</TableCell>
      {displayColumns.map(column => {
        const value = item.row_data[column];
        // Display raw value exactly as it appears in the CSV
        const displayValue = value !== undefined && value !== null && value !== '' 
          ? String(value) 
          : '—';
        
        return (
          <TableCell key={column} className="whitespace-nowrap">
            {displayValue}
          </TableCell>
        );
      })}
      <TableCell>
        <Badge variant={item.validated ? "default" : "outline"}>
          {item.validated ? "Validated" : "Pending"}
        </Badge>
      </TableCell>
    </TableRow>
  );
};

export default ExcelTableRow;
