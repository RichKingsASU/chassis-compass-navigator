import type { WarRoomKPI, WarRoomStatus } from '@/types/warroom';
import { STATUS_LABELS } from '@/types/warroom';
import { cn } from '@/lib/utils';

interface Props {
  kpi: WarRoomKPI | null;
  loading: boolean;
  statusFilter: WarRoomStatus | 'all';
  onFilterChange: (status: WarRoomStatus | 'all') => void;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  active?: boolean;
  color?: string;
  onClick?: () => void;
}

function KpiCard({ label, value, sub, active, color, onClick }: KpiCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all',
        active
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/50 bg-card hover:border-border hover:bg-accent/30'
      )}
    >
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-none">{label}</span>
      <span className={cn('text-2xl font-semibold leading-tight', color ?? 'text-foreground')}>{value}</span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </button>
  );
}

export function WarRoomKpiRail({ kpi, loading, statusFilter, onFilterChange }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 p-3 border-b border-border/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  const toggle = (status: WarRoomStatus | 'all') =>
    onFilterChange(statusFilter === status ? 'all' : status);

  return (
    <div className="grid grid-cols-3 lg:grid-cols-7 gap-2 p-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <KpiCard
        label="All Locations"
        value={kpi?.total_locations ?? 0}
        active={statusFilter === 'all'}
        onClick={() => onFilterChange('all')}
      />
      <KpiCard
        label={STATUS_LABELS.active}
        value={kpi?.active_count ?? 0}
        color="text-green-600"
        active={statusFilter === 'active'}
        onClick={() => toggle('active')}
      />
      <KpiCard
        label={STATUS_LABELS.dormant_low}
        value={kpi?.dormant_low_count ?? 0}
        color="text-amber-600"
        active={statusFilter === 'dormant_low'}
        onClick={() => toggle('dormant_low')}
      />
      <KpiCard
        label={STATUS_LABELS.dormant_high}
        value={kpi?.dormant_high_count ?? 0}
        color="text-red-600"
        active={statusFilter === 'dormant_high'}
        onClick={() => toggle('dormant_high')}
      />
      <KpiCard
        label={STATUS_LABELS.in_transit}
        value={kpi?.in_transit_count ?? 0}
        color="text-blue-600"
        active={statusFilter === 'in_transit'}
        onClick={() => toggle('in_transit')}
      />
      <KpiCard
        label={STATUS_LABELS.returned}
        value={kpi?.returned_count ?? 0}
        color="text-slate-500"
        active={statusFilter === 'returned'}
        onClick={() => toggle('returned')}
      />
      <KpiCard
        label="Est. Missed Rev."
        value={kpi ? `$${Math.round(kpi.total_missed_revenue).toLocaleString()}` : '$0'}
        color="text-red-700"
        sub="dormant 3d+"
      />
    </div>
  );
}
