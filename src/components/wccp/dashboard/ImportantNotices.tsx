import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Info } from 'lucide-react';

const ImportantNotices = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Important Notices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>WCCP Portal Coming Soon</strong>
            <br />
            WCCP invoice data integration is currently being configured. Please contact your account manager for current invoice information.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ImportantNotices;
