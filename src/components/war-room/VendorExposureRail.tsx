import { useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VendorExposureRow } from '@/hooks/useVendorExposure';

interface Props {
  vendors: VendorExposureRow[];
  loading: boolean;
  error: string | null;
}

const VENDOR_COLORS: Record<string, { text: string; bar: string }> = {
  TRAC: { text: 'text-blue-600', bar: 'bg-blue-500' },
  DCLI: { text: 'text-green-600', bar: 'bg-green-500' },
  CCM: { text: 'text-purple-600', bar: 'bg-purple-500' },
  FLEXIVAN: { text: 'text-orange-600', bar: 'bg-orange-500' },
  SCSPA: { text: 'text-teal-600', bar: 'bg-teal-500' },
  WCCP: { text: 'text-gray-600', bar: 'bg-gray-500' },
};

function vendorColor(vendor: string | null): { text: string; bar: string } {
  if (!vendor) return { text: 'text-foreground', bar: 'bg-muted-foreground' };
  return VENDOR_COLORS[vendor.toUpperCase()] ?? { text: 'text-foreground', bar: 'bg-muted-foreground' };
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function VendorExposureRail({ vendors, loading, error }: Props) {
  const totalBilled = useMemo(
    () => vendors.reduce((sum, v) => sum + (v.total_billed ?? 0), 0),
    [vendors]
  );

  return (
    <div className="flex flex-col h-full border-l border-border/50 bg-background">
      <div className="px-3 py-2 border-b border-border/50 shrink-0">
        <h2 className="text-sm font-semibold leading-none">Vendor Exposure</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Per-diem billing summary</p>
      </div>

      <div className="px-3 py-2 border-b border-border/50 shrink-0">
        <div className="flex flex-col gap-0.5 p-2 rounded-md border border-border/50 bg-card">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
            Total Billed
          </span>
          <span className="text-xl font-semibold leading-tight tabular-nums">
            {formatCompactCurrency(totalBilled)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading vendors...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 px-3 text-center">
            <AlertCircle className="h-6 w-6 text-destructive opacity-60" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 px-3 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">No vendor data.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {vendors.map((v, idx) => {
              const billed = v.total_billed ?? 0;
              const share = totalBilled > 0 ? (billed / totalBilled) * 100 : 0;
              const colors = vendorColor(v.vendor);
              const chassis = v.chassis_count ?? 0;
              const lineItems = v.line_items ?? 0;
              const avgDays = v.avg_bill_days ?? 0;
              const disputedCount = v.disputed_count ?? 0;
              const disputedAmount = v.disputed_amount ?? 0;
              const openBalance = v.open_balance ?? 0;
              return (
                <li
                  key={`${v.vendor ?? 'x'}-${idx}`}
                  className="px-3 py-2.5 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className={cn('text-base font-bold leading-none', colors.text)}>
                      {v.vendor ?? '—'}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCompactCurrency(billed)}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-1.5">
                    {chassis} chassis · {lineItems} line items · {avgDays.toFixed(1)} avg days
                  </div>
                  {(disputedCount > 0 || openBalance > 0) && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {disputedCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                          {disputedCount} disputes · {formatCurrency(disputedAmount)}
                        </span>
                      )}
                      {openBalance > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                          Open: {formatCurrency(openBalance)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', colors.bar)}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
