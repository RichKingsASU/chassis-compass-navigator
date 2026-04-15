import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { InventoryRecord } from '../types';
import { getRecords } from '../services/yardService';
import { calculateBillingReport } from '../services/billingEngine';

interface BillingAnalyticsProps {
  yardId: string;
  yardConfig: {
    capacity: number;
    dailyRate: number;
    overageRate: number;
    name: string;
  };
}

export default function BillingAnalytics({ yardId, yardConfig }: BillingAnalyticsProps) {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Default to current month
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfMonth = `${lastOfMonth.getFullYear()}-${String(lastOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastOfMonth.getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(endOfMonth);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getRecords(yardId);
        setRecords(data);
      } catch (err) {
        console.error('Failed to load records:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [yardId]);

  const report = useMemo(() => {
    if (!records.length || !startDate || !endDate) return null;
    return calculateBillingReport(records, startDate, endDate, {
      capacity: yardConfig.capacity,
      dailyRate: yardConfig.dailyRate,
      overageRate: yardConfig.overageRate,
    });
  }, [records, startDate, endDate, yardConfig]);

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Report — {yardConfig.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="flex gap-6 ml-auto text-sm">
              <div>
                <span className="text-muted-foreground">Capacity:</span>{' '}
                <span className="font-semibold">{yardConfig.capacity} units</span>
              </div>
              <div>
                <span className="text-muted-foreground">Daily Rate:</span>{' '}
                <span className="font-semibold">{fmt(yardConfig.dailyRate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Overage Rate:</span>{' '}
                <span className="font-semibold">{fmt(yardConfig.overageRate)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold">{report.rows.length}</p>
                <p className="text-sm text-muted-foreground">Billing Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold">
                  {Math.max(...report.rows.map((r) => r.peakCount))}
                </p>
                <p className="text-sm text-muted-foreground">Peak Units</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold text-green-500">{fmt(report.grandTotal)}</p>
                <p className="text-sm text-muted-foreground">Grand Total</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">AM Count</TableHead>
                      <TableHead className="text-right">PM Count</TableHead>
                      <TableHead className="text-right">Peak</TableHead>
                      <TableHead className="text-right">Base Units</TableHead>
                      <TableHead className="text-right">Overage</TableHead>
                      <TableHead className="text-right">Base Charge</TableHead>
                      <TableHead className="text-right">Overage Charge</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="text-right">{row.amCount}</TableCell>
                        <TableCell className="text-right">{row.pmCount}</TableCell>
                        <TableCell className="text-right font-semibold">{row.peakCount}</TableCell>
                        <TableCell className="text-right">{row.baseUnits}</TableCell>
                        <TableCell className="text-right">
                          {row.overageUnits > 0 ? (
                            <span className="text-red-400">{row.overageUnits}</span>
                          ) : (
                            row.overageUnits
                          )}
                        </TableCell>
                        <TableCell className="text-right">{fmt(row.baseCharge)}</TableCell>
                        <TableCell className="text-right">
                          {row.overageCharge > 0 ? (
                            <span className="text-red-400">{fmt(row.overageCharge)}</span>
                          ) : (
                            fmt(row.overageCharge)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(row.totalCharge)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
