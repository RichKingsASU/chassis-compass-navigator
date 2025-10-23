import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KPICard from '@/components/ccm/KPICard';
import { CheckCircle, AlertCircle, TrendingUp, Warehouse } from 'lucide-react';

const YardReportOverview = () => {
  const navigate = useNavigate();

  const getYardRoute = (name: string) => {
    const routes: Record<string, string> = {
      'PIER S': '/yards/pola',
      'JED YARD': '/yards/jed',
    };
    return routes[name] || '/yards';
  };

  const yards = [
    {
      name: 'PIER S',
      status: 'healthy',
      lastReport: '1 hour ago',
      totalChassis: 3421,
      utilization: 87,
      changeRate: '+5%',
    },
    {
      name: 'JED YARD',
      status: 'healthy',
      lastReport: '2 hours ago',
      totalChassis: 2156,
      utilization: 92,
      changeRate: '+8%',
    },
  ];

  const totalChassis = yards.reduce((sum, y) => sum + y.totalChassis, 0);
  const avgUtilization = Math.round(yards.reduce((sum, y) => sum + y.utilization, 0) / yards.length);
  const healthyYards = yards.filter(y => y.status === 'healthy').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yard Report Overview</h1>
        <Badge variant="outline" className="text-sm">
          {yards.length} Active Yards
        </Badge>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Chassis" 
          value={totalChassis.toLocaleString()} 
          description="Across all yards" 
          icon="chart" 
        />
        <KPICard 
          title="Healthy Yards" 
          value={`${healthyYards}/${yards.length}`}
          description={`${Math.round((healthyYards / yards.length) * 100)}% operational`}
          icon="users" 
        />
        <KPICard 
          title="Avg Utilization" 
          value={`${avgUtilization}%`}
          description="Across all yards" 
          icon="file" 
        />
        <KPICard 
          title="Active Yards" 
          value={yards.length.toString()}
          description="Reporting systems" 
          icon="alert" 
        />
      </div>

      {/* Yard Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {yards.map((yard) => (
          <Card 
            key={yard.name} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(getYardRoute(yard.name))}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{yard.name}</CardTitle>
                <Badge variant="outline" className={getStatusColor(yard.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(yard.status)}
                    <span className="capitalize">{yard.status}</span>
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Chassis</span>
                <span className="font-semibold">{yard.totalChassis.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Utilization</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${yard.utilization}%` }}
                    />
                  </div>
                  <span className="font-semibold text-sm">{yard.utilization}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Change Rate</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-3 w-3 ${yard.changeRate.startsWith('+') ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`font-semibold text-sm ${yard.changeRate.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {yard.changeRate}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-muted-foreground">Last Report</span>
                <span className="text-xs font-medium">{yard.lastReport}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Recent Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Reports submitted today</span>
              <span className="font-semibold">{yards.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Chassis movements (24h)</span>
              <span className="font-semibold">147</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">System uptime</span>
              <span className="font-semibold text-green-600">99.9%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YardReportOverview;
