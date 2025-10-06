import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface DisputeHistoryEntry {
  timestamp: string;
  action: string;
  reason?: string;
  note: string;
  user?: string;
}

interface DisputeHistoryProps {
  history: DisputeHistoryEntry[];
}

const DisputeHistory = ({ history }: DisputeHistoryProps) => {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dispute History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No dispute history yet. Placeholder content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={index} className="flex gap-4 border-l-2 border-primary pl-4 py-2">
              <div className="flex-shrink-0 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={entry.action === 'opened' ? 'destructive' : 'default'}>
                    {entry.action}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {entry.reason && (
                  <p className="text-sm">
                    <span className="font-medium">Reason:</span> {entry.reason}
                  </p>
                )}
                <p className="text-sm">{entry.note}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DisputeHistory;
