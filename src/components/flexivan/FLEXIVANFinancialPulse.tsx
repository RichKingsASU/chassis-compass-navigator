import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

const FLEXIVANFinancialPulse = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['flexivan-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flexivan_activity')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate metrics from real data
  const dashboardMetrics = React.useMemo(() => {
    if (!invoices) return {
      totalOutstanding: 0,
      totalRecords: 0,
      overdueAmount: 0,
      overdueCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      monthlyPaid: 0,
      monthlyPaidCount: 0,
      statusBreakdown: []
    };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const pending = invoices.filter(inv => inv.status?.toLowerCase() === 'pending' || inv.status?.toLowerCase() === 'open');
    const overdue = invoices.filter(inv => {
      if (!inv.due_date) return false;
      const dueDate = new Date(inv.due_date);
      return inv.status?.toLowerCase() !== 'paid' && dueDate < now;
    });

    const monthlyPaid = invoices.filter(inv => {
      if (!inv.invoice_date) return false;
      const invoiceDate = new Date(inv.invoice_date);
      return inv.status?.toLowerCase() === 'paid' && invoiceDate >= monthStart;
    });

    const statusCounts = invoices.reduce((acc: any, inv) => {
      const status = inv.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalOut = invoices.reduce((sum, inv) => {
      const amount = parseFloat(String(inv.outstanding_balance || inv.invoice_amount || 0));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const overdueAmt = overdue.reduce((sum, inv) => {
      const amount = parseFloat(String(inv.outstanding_balance || inv.invoice_amount || 0));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const pendingAmt = pending.reduce((sum, inv) => {
      const amount = parseFloat(String(inv.outstanding_balance || inv.invoice_amount || 0));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const monthPaid = monthlyPaid.reduce((sum, inv) => {
      const amount = parseFloat(String(inv.paid || 0));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      totalOutstanding: totalOut,
      totalRecords: invoices.length,
      overdueAmount: overdueAmt,
      overdueCount: overdue.length,
      pendingAmount: pendingAmt,
      pendingCount: pending.length,
      monthlyPaid: monthPaid,
      monthlyPaidCount: monthlyPaid.length,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: count as number
      }))
    };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Outstanding",
      value: `$${dashboardMetrics.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${dashboardMetrics.totalRecords} active records`,
      icon: DollarSign,
      trend: "neutral",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Overdue Amount",
      value: `$${dashboardMetrics.overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${dashboardMetrics.overdueCount} overdue items`,
      icon: AlertTriangle,
      trend: dashboardMetrics.overdueCount > 0 ? "negative" : "positive",
      bgColor: dashboardMetrics.overdueCount > 0 ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950",
      iconColor: dashboardMetrics.overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
    },
    {
      title: "Pending Approval",
      value: `$${dashboardMetrics.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${dashboardMetrics.pendingCount} awaiting review`,
      icon: Clock,
      trend: "neutral",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "This Month Paid",
      value: `$${dashboardMetrics.monthlyPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${dashboardMetrics.monthlyPaidCount} transactions`,
      icon: CheckCircle,
      trend: "positive",
      bgColor: "bg-green-50 dark:bg-green-950",
      iconColor: "text-green-600 dark:text-green-400"
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="border-l-4 border-l-primary/20 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
                {kpi.trend === "positive" && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Good
                  </Badge>
                )}
                {kpi.trend === "negative" && (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Alert
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardMetrics.statusBreakdown.map((status: {status: string, count: number}, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status.status.toLowerCase() === 'paid' ? 'bg-green-500' :
                      status.status.toLowerCase() === 'pending' || status.status.toLowerCase() === 'open' ? 'bg-amber-500' :
                      status.status.toLowerCase() === 'disputed' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{status.count}</div>
                    <div className="text-xs text-muted-foreground">records</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="font-medium">+ New Invoice Entry</div>
                <div className="text-sm text-muted-foreground">Add a new invoice record</div>
              </button>
              <button className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="font-medium">Review Pending Items</div>
                <div className="text-sm text-muted-foreground">{dashboardMetrics.pendingCount} items need attention</div>
              </button>
              <button className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="font-medium">Export Monthly Report</div>
                <div className="text-sm text-muted-foreground">Generate financial summary</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FLEXIVANFinancialPulse;
