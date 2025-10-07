import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

const WCCPFinancialPulse = () => {
  // Placeholder data - will be replaced with real WCCP data
  const kpis = [
    {
      title: "Total Outstanding",
      value: "$0.00",
      icon: DollarSign,
      description: "Awaiting WCCP data integration"
    },
    {
      title: "Pending Invoices",
      value: "0",
      icon: Calendar,
      description: "Configuration in progress"
    },
    {
      title: "Disputed Amount",
      value: "$0.00",
      icon: AlertCircle,
      description: "No disputes recorded"
    },
    {
      title: "30-Day Trend",
      value: "0%",
      icon: TrendingUp,
      description: "Baseline pending"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WCCPFinancialPulse;
