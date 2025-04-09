
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  Edit, 
  Upload, 
  Check, 
  AlertTriangle, 
  User,
  FileCheck,
  Truck,
  Eye
} from 'lucide-react';
import { cn } from "@/lib/utils";

// Mock data for the activity log
const activityData = [
  {
    id: 1,
    action: "Chassis validated",
    details: "CMAU1234567 from DCLI",
    timestamp: "10 minutes ago",
    type: "validation",
    user: "John Smith"
  },
  {
    id: 2,
    action: "GPS data uploaded",
    details: "Samsara batch file for 45 chassis",
    timestamp: "30 minutes ago",
    type: "upload",
    user: "Maria Garcia"
  },
  {
    id: 3,
    action: "Invoice approved",
    details: "TRAC monthly invoice #INV-28745",
    timestamp: "1 hour ago",
    type: "approval",
    user: "John Smith"
  },
  {
    id: 4,
    action: "Chassis added",
    details: "5 new chassis from FLEXIVAN",
    timestamp: "2 hours ago",
    type: "addition",
    user: "Alex Johnson"
  },
  {
    id: 5,
    action: "System alert",
    details: "GPS signal lost on 3 chassis",
    timestamp: "3 hours ago",
    type: "alert",
    user: "System"
  },
  {
    id: 6,
    action: "Document uploaded",
    details: "Insurance certificates for CCM chassis",
    timestamp: "5 hours ago",
    type: "upload",
    user: "Maria Garcia"
  },
  {
    id: 7,
    action: "Yard report viewed",
    details: "POLA YARD status check",
    timestamp: "Yesterday at 4:30 PM",
    type: "view",
    user: "John Smith"
  },
  {
    id: 8,
    action: "Settings updated",
    details: "Notification preferences changed",
    timestamp: "Yesterday at 2:15 PM",
    type: "settings",
    user: "Alex Johnson"
  }
];

const getActionIcon = (type: string) => {
  switch (type) {
    case 'validation':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'upload':
      return <Upload className="h-4 w-4 text-blue-500" />;
    case 'approval':
      return <FileCheck className="h-4 w-4 text-green-500" />;
    case 'addition':
      return <Truck className="h-4 w-4 text-blue-500" />;
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'view':
      return <Eye className="h-4 w-4 text-slate-500" />;
    case 'settings':
      return <Edit className="h-4 w-4 text-slate-500" />;
    default:
      return <Clock className="h-4 w-4 text-slate-500" />;
  }
};

interface ActivityLogProps {
  className?: string;
  limit?: number;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ 
  className,
  limit = 5
}) => {
  const displayedActivities = activityData.slice(0, limit);
  
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.details}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /> {activity.user}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
