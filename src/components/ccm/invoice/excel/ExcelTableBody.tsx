
import React from 'react';
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ExcelDataItem } from '@/components/ccm/invoice/types';
import ExcelTableRow from './ExcelTableRow';
import ExcelEmptyState from './ExcelEmptyState';

interface ExcelTableBodyProps {
  loading: boolean;
  paginatedData: ExcelDataItem[];
  displayColumns: string[];
  searchTerm: string;
}

const ExcelTableBody: React.FC<ExcelTableBodyProps> = ({ 
  loading, 
  paginatedData, 
  displayColumns,
  searchTerm 
}) => {
  if (loading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={displayColumns.length + 2} className="text-center py-10 text-muted-foreground">
            Loading data...
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (paginatedData.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={displayColumns.length + 2} className="text-center">
            <ExcelEmptyState searchTerm={searchTerm} />
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {paginatedData.map((item, index) => (
        <ExcelTableRow 
          key={item.id || index} 
          item={item} 
          displayColumns={displayColumns} 
        />
      ))}
    </TableBody>
  );
};

export default ExcelTableBody;
