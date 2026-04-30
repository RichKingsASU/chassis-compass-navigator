import { useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PierSEvent } from '@/hooks/usePierSToday';

interface Props {
  events: PierSEvent[];
  loading: boolean;
  error: string | null;
}

function isPickup(event: PierSEvent): boolean {
  const desc = (event.event_description ?? '').toLowerCase();
  return desc.includes('out') || desc.includes('pickup') || desc.includes('pick up');
}

function formatTime(value: string | null): string {
  if (!value) return '--:--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface MiniStatProps {
  label: string;
  value: number | string;
  color?: string;
}

function MiniStat({ label, value, color }: MiniStatProps) {
  return (
    <div className="flex flex-col gap-0.5 p-2 rounded-md border border-border/50 bg-card">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
        {label}
      </span>
      <span className={cn('text-lg font-semibold leading-tight', color ?? 'text-foreground')}>
        {value}
      </span>
    </div>
  );
}

function MatchBadge({ status }: { status: string | null }) {
  if (!status || status === 'matched') return null;
  if (status === 'no_tms_match') {
    return (
      <Badge className="border-transparent bg-red-100 text-red-700 hover:bg-red-100 px-1.5 py-0 text-[10px] font-medium">
        No TMS
      </Badge>
    );
  }
  if (status === 'dropoff_no_rc') {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100 px-1.5 py-0 text-[10px] font-medium">
        No RC
      </Badge>
    );
  }
  if (status === 'pickup_no_delivery') {
    return (
      <Badge className="border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100 px-1.5 py-0 text-[10px] font-medium">
        No Delivery
      </Badge>
    );
  }
  return null;
}

export function PierSEventFeed({ events, loading, error }: Props) {
  const stats = useMemo(() => {
    let pickups = 0;
    let dropoffs = 0;
    let alerts = 0;
    for (const e of events) {
      if (isPickup(e)) pickups++;
      else dropoffs++;
      if (e.match_status === 'no_tms_match' || e.match_status === 'dropoff_no_rc') alerts++;
    }
    return { total: events.length, pickups, dropoffs, alerts };
  }, [events]);

  return (
    <div className="flex flex-col h-full border-l border-border/50 bg-background">
      <div className="px-3 py-2 border-b border-border/50 shrink-0">
        <h2 className="text-sm font-semibold leading-none">Pier S Terminal</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Today's gate events</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2 border-b border-border/50 shrink-0">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Pickups" value={stats.pickups} color="text-green-600" />
        <MiniStat label="Dropoffs" value={stats.dropoffs} color="text-amber-600" />
        <MiniStat label="Alerts" value={stats.alerts} color="text-red-600" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 px-3 text-center">
            <AlertCircle className="h-6 w-6 text-destructive opacity-60" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 px-3 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">No gate events today.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {events.map((event, idx) => {
              const pickup = isPickup(event);
              return (
                <li
                  key={`${event.chassis_equipment_number ?? 'x'}-${event.event_datetime ?? idx}-${idx}`}
                  className="px-3 py-2 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0">
                      {formatTime(event.event_datetime)}
                    </span>
                    <Badge
                      className={cn(
                        'border-transparent px-1.5 py-0 text-[10px] font-medium',
                        pickup
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      )}
                    >
                      {pickup ? 'Pickup' : 'Dropoff'}
                    </Badge>
                    <MatchBadge status={event.match_status} />
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {event.chassis_equipment_number ?? '—'}
                    </span>
                    {event.container_equipment_number && (
                      <span className="text-xs text-muted-foreground">
                        {event.container_equipment_number}
                      </span>
                    )}
                  </div>
                  {event.customer_name && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {event.customer_name}
                    </div>
                  )}
                  {event.gate_lane && (
                    <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                      {event.gate_lane}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
