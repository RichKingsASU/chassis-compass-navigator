import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KPICard from '@/components/ccm/KPICard';
import { CheckCircle, AlertCircle, TrendingUp, Database } from 'lucide-react';

const GpsOverview = () => {
  const providers = [
    {
      name: 'Anytrek',
      status: 'healthy',
      lastSync: '2 hours ago',
      activeDevices: 1247,
      dataQuality: 98,
      uploadRate: '+12%',
    },
    {
      name: 'Samsara',
      status: 'healthy',
      lastSync: '1 hour ago',
      activeDevices: 856,
      dataQuality: 97,
      uploadRate: '+8%',
    },
    {
      name: 'Fleetview',
      status: 'warning',
      lastSync: '6 hours ago',
      activeDevices: 423,
      dataQuality: 89,
      uploadRate: '-3%',
    },
    {
      name: 'Fleetlocate',
      status: 'healthy',
      lastSync: '30 minutes ago',
      activeDevices: 2134,
      dataQuality: 99,
      uploadRate: '+15%',
    },
    {
      name: 'BlackBerry Radar',
      status: 'healthy',
      lastSync: '1 hour ago',
      activeDevices: 1689,
      dataQuality: 96,
      uploadRate: '+10%',
    },
  ];

  const totalDevices = providers.reduce((sum, p) => sum + p.activeDevices, 0);
  const avgDataQuality = Math.round(providers.reduce((sum, p) => sum + p.dataQuality, 0) / providers.length);
  const healthyProviders = providers.filter(p => p.status === 'healthy').length;

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
        <h1 className="text-3xl font-bold">GPS Provider Overview</h1>
        <Badge variant="outline" className="text-sm">
          {providers.length} Providers
        </Badge>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Active Devices" 
          value={totalDevices.toLocaleString()} 
          description="Across all providers" 
          icon="chart" 
        />
        <KPICard 
          title="Healthy Providers" 
          value={`${healthyProviders}/${providers.length}`}
          description={`${Math.round((healthyProviders / providers.length) * 100)}% operational`}
          icon="users" 
        />
        <KPICard 
          title="Avg Data Quality" 
          value={`${avgDataQuality}%`}
          description="Across all providers" 
          icon="file" 
        />
        <KPICard 
          title="Active Providers" 
          value={providers.length.toString()}
          description="Integrated systems" 
          icon="alert" 
        />
      </div>

      {/* Provider Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card key={provider.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <Badge variant="outline" className={getStatusColor(provider.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(provider.status)}
                    <span className="capitalize">{provider.status}</span>
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Devices</span>
                <span className="font-semibold">{provider.activeDevices.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Data Quality</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${provider.dataQuality}%` }}
                    />
                  </div>
                  <span className="font-semibold text-sm">{provider.dataQuality}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Upload Rate</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-3 w-3 ${provider.uploadRate.startsWith('+') ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`font-semibold text-sm ${provider.uploadRate.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {provider.uploadRate}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-muted-foreground">Last Sync</span>
                <span className="text-xs font-medium">{provider.lastSync}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Recent Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Total uploads today</span>
              <span className="font-semibold">1,247</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Data points processed (24h)</span>
              <span className="font-semibold">342,891</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">System uptime</span>
              <span className="font-semibold text-green-600">99.8%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GpsOverview;
