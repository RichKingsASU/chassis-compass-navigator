
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const ImportantNotices = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Important Notices
          </CardTitle>
          <Badge>3 New</Badge>
        </div>
        <CardDescription>Critical updates and announcements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
            <div className="font-medium">Rate Change Notice</div>
            <div className="text-sm text-muted-foreground">Effective June 1, 2025: CCM chassis rates will increase by 3.5% nationwide</div>
          </div>
          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="font-medium">System Maintenance</div>
            <div className="text-sm text-muted-foreground">Portal will be down for maintenance on April 15, 2025 from 2AM-4AM EST</div>
          </div>
          <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
            <div className="font-medium">New Portal Feature</div>
            <div className="text-sm text-muted-foreground">Batch upload functionality now available for invoice processing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportantNotices;
