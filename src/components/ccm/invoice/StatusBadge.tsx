
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status?.toLowerCase() || '';
  
  // Chassis status colors using semantic tokens
  if (normalizedStatus.includes('available') || normalizedStatus === 'active') {
    return <Badge className="bg-status-available text-status-available-foreground">Available</Badge>;
  }
  if (normalizedStatus.includes('in-use') || normalizedStatus.includes('in use') || normalizedStatus.includes('transit')) {
    return <Badge className="bg-status-in-use text-status-in-use-foreground">In-Use</Badge>;
  }
  if (normalizedStatus.includes('reserved')) {
    return <Badge className="bg-status-reserved text-status-reserved-foreground">Reserved</Badge>;
  }
  if (normalizedStatus.includes('out of service') || normalizedStatus.includes('maintenance')) {
    return <Badge className="bg-status-out-of-service text-status-out-of-service-foreground">Out of Service</Badge>;
  }

  // Invoice status colors
  switch(normalizedStatus) {
    case 'pending':
      return <Badge className="bg-amber-500">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-status-available text-status-available-foreground">Approved</Badge>;
    case 'disputed':
      return <Badge className="bg-status-out-of-service text-status-out-of-service-foreground">Disputed</Badge>;
    case 'review':
      return <Badge className="bg-status-in-use text-status-in-use-foreground">Under Review</Badge>;
    default:
      return <Badge className="bg-status-unknown text-status-unknown-foreground">{status}</Badge>;
  }
};

export default StatusBadge;
