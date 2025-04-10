
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
    <TableRow>
      <TableCell>{item.sheet_name}</TableCell>
      {displayColumns.map(column => (
        <TableCell key={column}>
          {item.row_data[column] !== undefined ? String(item.row_data[column]) : '—'}
        </TableCell>
      ))}
      <TableCell>
        <Badge variant={item.validated ? "default" : "outline"}>
          {item.validated ? "Validated" : "Pending"}
        </Badge>
      </TableCell>
    </TableRow>
  );
};

export default ExcelTableRow;
