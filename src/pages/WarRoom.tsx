import { useState, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WarRoomKpiRail } from '@/components/war-room/WarRoomKpiRail';
import { WarRoomMap } from '@/components/war-room/WarRoomMap';
import { ChassisDetailDrawer } from '@/components/war-room/ChassisDetailDrawer';
import { PierSEventFeed } from '@/components/war-room/PierSEventFeed';
import { useWarRoomData } from '@/hooks/useWarRoomData';
import { usePierSToday } from '@/hooks/usePierSToday';
import type { WarRoomChassis } from '@/types/warroom';

export default function WarRoom() {
  const { chassisData, kpi, loading, error, statusFilter, setStatusFilter, refetch } = useWarRoomData();
  const { events: pierSEvents, loading: pierSLoading, error: pierSError } = usePierSToday();
  const [selectedChassis, setSelectedChassis] = useState<WarRoomChassis | null>(null);

  const handleSelectChassis = useCallback((chassis: WarRoomChassis) => {
    setSelectedChassis(chassis);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-background shrink-0">
        <div>
          <h1 className="text-lg font-semibold leading-none">War Room</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live chassis position &amp; status — LA/Long Beach
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <WarRoomKpiRail
        kpi={kpi}
        loading={loading}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-h-0">
          {chassisData.length === 0 && !loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8 opacity-30" />
              <p className="text-sm">No location data found.</p>
              <p className="text-xs opacity-60">
                Verify mg_locations and mg_data are populated in Supabase.
              </p>
            </div>
          ) : (
            <WarRoomMap
              data={chassisData}
              onSelectChassis={handleSelectChassis}
            />
          )}
        </div>
        <aside className="hidden md:flex w-80 shrink-0">
          <PierSEventFeed
            events={pierSEvents}
            loading={pierSLoading}
            error={pierSError}
          />
        </aside>
      </div>

      <ChassisDetailDrawer
        chassis={selectedChassis}
        onClose={() => setSelectedChassis(null)}
      />
    </div>
  );
}
