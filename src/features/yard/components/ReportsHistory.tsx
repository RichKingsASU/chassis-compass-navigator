import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Clock } from 'lucide-react';
import { AuditEvent } from '../types';
import { getAuditLog } from '../services/yardService';

interface ReportsHistoryProps {
  yardId: string;
  yardName: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/20 text-green-400',
  UPDATE: 'bg-blue-500/20 text-blue-400',
  EXIT: 'bg-gray-500/20 text-gray-400',
  AMENDMENT: 'bg-yellow-500/20 text-yellow-400',
  CONFIG_CHANGE: 'bg-purple-500/20 text-purple-400',
};

export default function ReportsHistory({ yardId, yardName }: ReportsHistoryProps) {
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getAuditLog(yardId);
        setAuditLog(data);
      } catch (err) {
        console.error('Failed to load audit log:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [yardId]);

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log — {yardName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : auditLog.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No audit events yet</p>
              <p className="text-xs mt-1">Changes to inventory records will appear here</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[event.actionType] || ''}>
                          {event.actionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{event.recordId || '—'}</TableCell>
                      <TableCell className="text-xs">{event.actorUserId}</TableCell>
                      <TableCell className="text-xs">{event.actorRole}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {Object.keys(event.changedFields).length > 0
                          ? Object.keys(event.changedFields).join(', ')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{event.reason || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Showing {auditLog.length} events (max 500)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
