import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, TrendingUp, FileText, ExternalLink } from "lucide-react";

interface ValidationAlertsProps {
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    title: string;
    description: string;
    vendor?: string;
    count?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
}

const ValidationAlerts: React.FC<ValidationAlertsProps> = ({ alerts }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Important Alerts & Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active alerts. All validations are on track!</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        {alert.vendor && (
                          <Badge variant="outline" className="text-xs">
                            {alert.vendor}
                          </Badge>
                        )}
                        {alert.count && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.count}
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.description}
                      </AlertDescription>
                    </div>
                  </div>
                  {alert.action && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={alert.action.onClick}
                      className="gap-1 shrink-0"
                    >
                      {alert.action.label}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </Alert>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationAlerts;