
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ExcelTableHeaderProps {
  displayColumns: string[];
}

const ExcelTableHeader: React.FC<ExcelTableHeaderProps> = ({ displayColumns }) => {
  return (
    <TableHeader className="sticky top-0 bg-background z-10">
      <TableRow>
        <TableHead className="font-semibold sticky left-0 bg-background z-20 border-r min-w-[120px]">Sheet</TableHead>
        {displayColumns.map(column => (
          <TableHead key={column} className="font-semibold whitespace-nowrap min-w-[150px]">
            {column}
          </TableHead>
        ))}
        <TableHead className="font-semibold min-w-[120px]">Status</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ExcelTableHeader;
