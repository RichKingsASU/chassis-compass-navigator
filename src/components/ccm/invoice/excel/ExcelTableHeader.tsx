
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ExcelTableHeaderProps {
  displayColumns: string[];
}

const ExcelTableHeader: React.FC<ExcelTableHeaderProps> = ({ displayColumns }) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Sheet</TableHead>
        {displayColumns.map(column => (
          <TableHead key={column}>{column}</TableHead>
        ))}
        <TableHead>Validated</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ExcelTableHeader;
