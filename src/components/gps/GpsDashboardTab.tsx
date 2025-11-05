import KPICard from '@/components/ccm/KPICard';
import { useFleetlocateData } from '@/hooks/useFleetlocateData';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const GpsDashboardTab = () => {
  const { data: fleetlocateData, isLoading } = useFleetlocateData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalAssets = fleetlocateData?.length || 0;
  const activeGPS = fleetlocateData?.filter(item => 
    item.notes?.toLowerCase().includes('battery') && 
    !item.notes?.toLowerCase().includes('low')
  ).length || 0;
  
  const uniqueLocations = new Set(
    fleetlocateData?.map(item => item.location).filter(loc => loc && loc !== 'N/A')
  ).size;

  const recentUpdates = fleetlocateData?.filter(item => {
    if (!item.timestamp || item.timestamp === 'N/A') return false;
    const lastUpdate = new Date(item.timestamp);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastUpdate > oneDayAgo;
  }).length || 0;

  const coveragePercentage = totalAssets > 0 
    ? Math.round((activeGPS / totalAssets) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tracked Assets"
          value={totalAssets.toString()}
          description="Assets with GPS data"
          icon="chart"
          change={0}
        />
        <KPICard
          title="Active GPS Signals"
          value={activeGPS.toString()}
          description={`${coveragePercentage}% coverage`}
          icon="alert"
          change={0}
        />
        <KPICard
          title="Unique Locations"
          value={uniqueLocations.toString()}
          description="Different geographical points"
          icon="users"
          change={0}
        />
        <KPICard
          title="Recent Updates"
          value={recentUpdates.toString()}
          description="Updated in last 24 hours"
          icon="file"
          change={0}
        />
      </div>
    </div>
  );
};

export default GpsDashboardTab;
