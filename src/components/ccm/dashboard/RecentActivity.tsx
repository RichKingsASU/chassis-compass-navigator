
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        <CardDescription>Latest invoice activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Apr 05, 2025</TableCell>
              <TableCell>CCM-29384</TableCell>
              <TableCell>$4,320.00</TableCell>
              <TableCell>
                <Badge className="bg-amber-500">Pending</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Apr 02, 2025</TableCell>
              <TableCell>CCM-29375</TableCell>
              <TableCell>$2,150.00</TableCell>
              <TableCell>
                <Badge className="bg-green-500">Approved</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Mar 28, 2025</TableCell>
              <TableCell>CCM-29312</TableCell>
              <TableCell>$3,785.00</TableCell>
              <TableCell>
                <Badge className="bg-red-500">Disputed</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Mar 15, 2025</TableCell>
              <TableCell>CCM-29298</TableCell>
              <TableCell>$1,920.00</TableCell>
              <TableCell>
                <Badge className="bg-green-500">Approved</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
