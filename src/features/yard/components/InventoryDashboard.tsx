import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
import { InventoryRecord, InventoryStatus } from '../types';
import { getActiveRecords } from '../services/yardService';
import { STATUS_COLORS, STATUS_OPTIONS } from '../constants';

interface InventoryDashboardProps {
  yardId: string;
  yardName: string;
}

export default function InventoryDashboard({ yardId, yardName }: InventoryDashboardProps) {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getActiveRecords(yardId);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [yardId]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        !search ||
        r.chassisNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.containerNumber?.toLowerCase().includes(search.toLowerCase()) ||
        r.accountManager?.toLowerCase().includes(search.toLowerCase()) ||
        r.inboundCarrier?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{records.length}</p>
            <p className="text-sm text-muted-foreground">Total In-Yard</p>
          </CardContent>
        </Card>
        {STATUS_OPTIONS.filter((s) => s !== 'EXITED').map((status) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{statusCounts[status] || 0}</p>
              <p className="text-sm text-muted-foreground">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{yardName} — Active Inventory</CardTitle>
            <Button variant="outline" size="sm" onClick={loadRecords} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chassis, container, account manager..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date In</TableHead>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Container #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>SSL/Size</TableHead>
                  <TableHead>Account Mgr</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Shop Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">{record.id}</TableCell>
                      <TableCell>{record.dateIn}</TableCell>
                      <TableCell className="font-mono">{record.chassisNumber}</TableCell>
                      <TableCell className="font-mono">{record.containerNumber || '—'}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[record.status as InventoryStatus] || ''}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{record.chassisType || '—'}</TableCell>
                      <TableCell className="text-xs">{record.sslSize || '—'}</TableCell>
                      <TableCell>{record.accountManager || '—'}</TableCell>
                      <TableCell>{record.inboundCarrier || '—'}</TableCell>
                      <TableCell>{record.inboundDriverName || '—'}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{record.shopReason || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {records.length} records
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
