import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const ImportantNotices = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Important Notices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No important notices at this time.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ImportantNotices;
