
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const RecentActivityList = () => {
  // Mock data for recent activity
  const activities = [
    {
      id: 1,
      chassisId: 'CMAU1234567',
      size: "40'",
      vendor: 'DCLI',
      activity: 'GPS Update',
      location: 'Savannah, GA',
      timestamp: '2025-04-09 08:23 AM',
      status: 'active'
    },
    {
      id: 2,
      chassisId: 'TCLU7654321',
      size: "20'",
      vendor: 'TRAC',
      activity: 'Validation',
      location: 'Charleston, SC',
      timestamp: '2025-04-09 07:45 AM',
      status: 'pending'
    },
    {
      id: 3,
      chassisId: 'FSCU5555123',
      size: "45'",
      vendor: 'FLEXIVAN',
      activity: 'Invoice Upload',
      location: 'Atlanta, GA',
      timestamp: '2025-04-08 04:15 PM',
      status: 'completed'
    },
    {
      id: 4,
      chassisId: 'NYKU9876543',
      size: "40'",
      vendor: 'CCM',
      activity: 'Repair Order',
      location: 'Miami, FL',
      timestamp: '2025-04-08 01:30 PM',
      status: 'alert'
    },
    {
      id: 5,
      chassisId: 'APHU1122334',
      size: "20'",
      vendor: 'DCLI',
      activity: 'GPS Update',
      location: 'Jacksonville, FL',
      timestamp: '2025-04-08 10:05 AM',
      status: 'active'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
      case 'alert':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Alert</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="relative overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chassis ID</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="font-medium">{activity.chassisId}</TableCell>
              <TableCell>{activity.size}</TableCell>
              <TableCell>{activity.vendor}</TableCell>
              <TableCell>{activity.activity}</TableCell>
              <TableCell>{activity.location}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{activity.timestamp}</TableCell>
              <TableCell>{getStatusBadge(activity.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecentActivityList;
