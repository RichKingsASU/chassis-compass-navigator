import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface MismatchReason {
  reason: string;
  expected: string;
  actual: string;
  delta?: string;
  severity: string;
  suggested_fix?: string;
}

interface MismatchReasonsProps {
  reasons: MismatchReason[];
}

const MismatchReasons = ({ reasons }: MismatchReasonsProps) => {
  const getSeverityVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mismatch Reasons</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Suggested Fix</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reasons.map((reason, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{reason.reason}</TableCell>
                <TableCell>{reason.expected}</TableCell>
                <TableCell>{reason.actual}</TableCell>
                <TableCell>{reason.delta || '-'}</TableCell>
                <TableCell>
                  <Badge variant={getSeverityVariant(reason.severity)}>
                    {reason.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {reason.suggested_fix || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MismatchReasons;
