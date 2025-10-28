import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateValue } from '@/utils/dateUtils';

interface TMSDataTabProps {
  candidates: any[];
}

const TMSDataTab: React.FC<TMSDataTabProps> = ({ candidates }) => {
  if (!candidates || candidates.length === 0) {
    return <div className="text-muted-foreground">No TMS matches found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chassis</TableHead>
            <TableHead>Container</TableHead>
            <TableHead>Pickup Date</TableHead>
            <TableHead>Return Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Match Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate, idx) => (
            <TableRow key={idx}>
              <TableCell>{candidate.chassis_number || '—'}</TableCell>
              <TableCell>{candidate.container_number || '—'}</TableCell>
              <TableCell>{formatDateValue(candidate.pickup_date)}</TableCell>
              <TableCell>{formatDateValue(candidate.return_date)}</TableCell>
              <TableCell>{candidate.customer_name || '—'}</TableCell>
              <TableCell>
                {candidate.match_score ? `${(candidate.match_score * 100).toFixed(0)}%` : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TMSDataTab;
