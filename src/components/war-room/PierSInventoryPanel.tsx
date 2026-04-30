import { useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PierSInventoryRow } from '@/hooks/usePierSInventory';

interface Props {
  inventory: PierSInventoryRow[];
  loading: boolean;
  error: string | null;
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

function daysBadgeClasses(days: number): string {
  if (days >= 7) return 'bg-red-100 text-red-700 hover:bg-red-100';
  if (days >= 3) return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
  return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
}

export function PierSInventoryPanel({ inventory, loading, error }: Props) {
  const stats = useMemo(() => {
    let noTms = 0;
    let loaded = 0;
    let maxDays = 0;
    for (const row of inventory) {
      if (row.inventory_status === 'no_tms_match') noTms++;
      if (row.load_type === 'Loaded') loaded++;
      const d = row.days_on_site ?? 0;
      if (d > maxDays) maxDays = d;
    }
    return { total: inventory.length, noTms, loaded, maxDays };
  }, [inventory]);

  return (
    <div className="flex flex-col h-full border-l border-border/50 bg-background">
      <div className="px-3 py-2 border-b border-border/50 shrink-0">
        <h2 className="text-sm font-semibold leading-none">Pier S On-Site</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Current inventory</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2 border-b border-border/50 shrink-0">
        <MiniStat label="On Site" value={stats.total} />
        <MiniStat label="No TMS" value={stats.noTms} color="text-red-600" />
        <MiniStat label="Loaded" value={stats.loaded} color="text-blue-600" />
        <MiniStat label="Max Days" value={stats.maxDays} color="text-amber-600" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading inventory...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 px-3 text-center">
            <AlertCircle className="h-6 w-6 text-destructive opacity-60" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 px-3 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">No containers on site.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {inventory.map((row, idx) => {
              const days = row.days_on_site ?? 0;
              const loaded = row.load_type === 'Loaded';
              return (
                <li
                  key={`${row.equipment_number ?? 'x'}-${idx}`}
                  className="px-3 py-2 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={cn(
                        'border-transparent px-1.5 py-0 text-[10px] font-medium tabular-nums',
                        daysBadgeClasses(days)
                      )}
                    >
                      {days}d
                    </Badge>
                    <Badge
                      className={cn(
                        'border-transparent px-1.5 py-0 text-[10px] font-medium',
                        loaded
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {row.load_type ?? 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold font-mono text-foreground">
                      {row.equipment_number ?? '—'}
                    </span>
                    {row.size && (
                      <span className="text-xs text-muted-foreground">{row.size}</span>
                    )}
                  </div>
                  {row.last_carrier_name && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {row.last_carrier_name}
                    </div>
                  )}
                  {row.booking_number && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {row.booking_number}
                    </div>
                  )}
                  {row.gate_lane && (
                    <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                      {row.gate_lane}
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
