import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { excelDateToJSDate, isExcelSerialDate } from '@/utils/dateUtils';

interface TMSData {
  id: string;
  ld_num: string;
  so_num: string;
  created_date: string;
  pickup_actual_date: string;
  delivery_actual_date: string;
  container_number: string;
  customer_name: string;
  carrier_invoice_charge: string | number;
  cust_invoice_charge: string | number;
  status: string;
}

interface UtilizationTabProps {
  chassisId: string;
  tmsData: TMSData[];
}

const UtilizationTab: React.FC<UtilizationTabProps> = ({ chassisId, tmsData }) => {
  const parseCharge = (value: string | number | null | undefined): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: string | number | null | undefined): string => {
    const num = parseCharge(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Helper function to safely parse dates
  const safeParseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    
    // Handle Excel serial dates
    if (isExcelSerialDate(dateValue)) {
      const dateStr = excelDateToJSDate(dateValue);
      if (dateStr) {
        const date = parseISO(dateStr);
        return isValid(date) ? date : null;
      }
      return null;
    }
    
    // Handle regular date strings
    if (typeof dateValue === 'string') {
      const date = parseISO(dateValue);
      return isValid(date) ? date : null;
    }
    
    // Handle Date objects
    if (dateValue instanceof Date) {
      return isValid(dateValue) ? dateValue : null;
    }
    
    return null;
  };

  // Calculate utilization metrics
  const utilizationMetrics = React.useMemo(() => {
    if (tmsData.length === 0) {
      return {
        totalLoads: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalMargin: 0,
        avgMarginPct: 0,
        totalDays: 0,
        avgRevenuePerDay: 0,
        utilizationByMonth: [],
        recentLoads: []
      };
    }

    const totalRevenue = tmsData.reduce((sum, tms) => sum + parseCharge(tms.cust_invoice_charge), 0);
    const totalCost = tmsData.reduce((sum, tms) => sum + parseCharge(tms.carrier_invoice_charge), 0);
    const totalMargin = totalRevenue - totalCost;
    const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    // Calculate total days in use
    let totalDays = 0;
    tmsData.forEach(tms => {
      if (tms.pickup_actual_date && tms.delivery_actual_date) {
        const pickup = safeParseDate(tms.pickup_actual_date);
        const delivery = safeParseDate(tms.delivery_actual_date);
        if (pickup && delivery) {
          const days = differenceInDays(delivery, pickup);
          totalDays += Math.max(days, 0);
        }
      }
    });

    const avgRevenuePerDay = totalDays > 0 ? totalRevenue / totalDays : 0;

    // Group by month for chart
    const monthlyData: { [key: string]: { loads: number; revenue: number; cost: number; days: number } } = {};
    tmsData.forEach(tms => {
      if (tms.created_date) {
        const date = safeParseDate(tms.created_date);
        if (date) {
          const monthKey = format(date, 'MMM yyyy');
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { loads: 0, revenue: 0, cost: 0, days: 0 };
          }
          monthlyData[monthKey].loads += 1;
          monthlyData[monthKey].revenue += parseCharge(tms.cust_invoice_charge);
          monthlyData[monthKey].cost += parseCharge(tms.carrier_invoice_charge);
          
          if (tms.pickup_actual_date && tms.delivery_actual_date) {
            const pickup = safeParseDate(tms.pickup_actual_date);
            const delivery = safeParseDate(tms.delivery_actual_date);
            if (pickup && delivery) {
              monthlyData[monthKey].days += Math.max(differenceInDays(delivery, pickup), 0);
            }
          }
        }
      }
    });

    const utilizationByMonth = Object.keys(monthlyData).map(month => ({
      month,
      loads: monthlyData[month].loads,
      revenue: monthlyData[month].revenue,
      cost: monthlyData[month].cost,
      margin: monthlyData[month].revenue - monthlyData[month].cost,
      days: monthlyData[month].days
    })).sort((a, b) => {
      const dateA = safeParseDate(`01 ${a.month}`);
      const dateB = safeParseDate(`01 ${b.month}`);
      if (dateA && dateB) {
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });

    // Get recent loads with calculations
    const recentLoads = tmsData.slice(0, 20).map(tms => {
      const revenue = parseCharge(tms.cust_invoice_charge);
      const cost = parseCharge(tms.carrier_invoice_charge);
      const margin = revenue - cost;
      let days = 0;
      if (tms.pickup_actual_date && tms.delivery_actual_date) {
        const pickup = safeParseDate(tms.pickup_actual_date);
        const delivery = safeParseDate(tms.delivery_actual_date);
        if (pickup && delivery) {
          days = Math.max(differenceInDays(delivery, pickup), 0);
        }
      }
      return { ...tms, revenue, cost, margin, days };
    });

    return {
      totalLoads: tmsData.length,
      totalRevenue,
      totalCost,
      totalMargin,
      avgMarginPct,
      totalDays,
      avgRevenuePerDay,
      utilizationByMonth,
      recentLoads
    };
  }, [tmsData]);

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Loads
            </div>
            <div className="text-2xl font-bold">{utilizationMetrics.totalLoads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              Total Days Used
            </div>
            <div className="text-2xl font-bold">{utilizationMetrics.totalDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(utilizationMetrics.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Avg Revenue/Day
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(utilizationMetrics.avgRevenuePerDay)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Chart */}
      {utilizationMetrics.utilizationByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Utilization Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={utilizationMetrics.utilizationByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: any) => {
                    if (typeof value === 'number') {
                      return value > 100 ? formatCurrency(value) : value.toFixed(0);
                    }
                    return value;
                  }}
                />
                <Legend />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} name="Cost" />
                <Line yAxisId="left" type="monotone" dataKey="loads" stroke="#3b82f6" strokeWidth={2} name="Loads" />
                <Line yAxisId="left" type="monotone" dataKey="days" stroke="#8b5cf6" strokeWidth={2} name="Days" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown Bar Chart */}
      {utilizationMetrics.utilizationByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue vs Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationMetrics.utilizationByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="cost" fill="#f59e0b" name="Cost" />
                <Bar dataKey="margin" fill="#3b82f6" name="Margin" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(utilizationMetrics.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(utilizationMetrics.totalCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Margin</div>
            <div className={`text-xl font-bold ${utilizationMetrics.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(utilizationMetrics.totalMargin)} ({utilizationMetrics.avgMarginPct.toFixed(1)}%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Load #</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilizationMetrics.recentLoads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No utilization data available
                    </TableCell>
                  </TableRow>
                ) : (
                  utilizationMetrics.recentLoads.map((load) => {
                    const createdDate = safeParseDate(load.created_date);
                    return (
                    <TableRow key={load.id}>
                      <TableCell>
                        {createdDate ? format(createdDate, 'PP') : 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">{load.ld_num || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{load.container_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{load.customer_name || 'N/A'}</TableCell>
                      <TableCell className="text-right">{load.days}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(load.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">
                        {formatCurrency(load.cost)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${load.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(load.margin)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={load.status === 'Delivered' ? 'default' : 'secondary'}>
                          {load.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilizationTab;
