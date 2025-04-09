
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch(status) {
    case 'pending':
      return <Badge className="bg-amber-500">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-green-500">Approved</Badge>;
    case 'disputed':
      return <Badge className="bg-red-500">Disputed</Badge>;
    case 'review':
      return <Badge className="bg-blue-500">Under Review</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default StatusBadge;
