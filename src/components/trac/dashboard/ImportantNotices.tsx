import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

const ImportantNotices = () => {
  const navigate = useNavigate();

  const notices = [
    {
      id: 1,
      type: "info",
      title: "TRAC Portal Coming Soon",
      message: "TRAC integration is in progress. Contact support for current invoice status.",
      icon: Info,
      action: null
    }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Important Notices</CardTitle>
        <Badge variant="secondary">{notices.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="p-4 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            >
              <div className="flex items-start gap-3">
                <notice.icon className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <h4 className="font-medium">{notice.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{notice.message}</p>
                  {notice.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={notice.action}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportantNotices;
