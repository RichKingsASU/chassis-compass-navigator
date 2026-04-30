import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { WarRoomChassis } from '@/types/warroom';
import { STATUS_LABELS } from '@/types/warroom';

interface Props {
  chassis: WarRoomChassis | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border/40 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] break-words">{String(value)}</span>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  active:        'bg-green-100 text-green-800',
  dormant_low:   'bg-amber-100 text-amber-800',
  dormant_high:  'bg-red-100 text-red-800',
  in_transit:    'bg-blue-100 text-blue-800',
  returned:      'bg-slate-100 text-slate-700',
};

export function ChassisDetailDrawer({ chassis, onClose }: Props) {
  return (
    <Sheet open={chassis !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">
            {chassis?.chassis_number ?? chassis?.location_name ?? 'Location Detail'}
          </SheetTitle>
          {chassis?.war_room_status && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${STATUS_BADGE[chassis.war_room_status] ?? ''}`}>
              {STATUS_LABELS[chassis.war_room_status] ?? chassis.war_room_status}
            </span>
          )}
        </SheetHeader>

        {chassis && (
          <div className="space-y-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 pt-1">Location</p>
            <Field label="Name"   value={chassis.location_name} />
            <Field label="City"   value={chassis.city} />
            <Field label="State"  value={chassis.state} />
            <Field label="Type"   value={chassis.location_type} />

            {chassis.chassis_number && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 pt-4">Chassis</p>
                <Field label="Chassis #"        value={chassis.chassis_number} />
                <Field label="Type"             value={chassis.chassis_type} />
                <Field label="TMS Status"       value={chassis.status} />
                <Field label="Dormant Days"     value={chassis.dormant_days ?? 0} />
                <Field label="Est. Missed Rev." value={chassis.est_missed_revenue ? `$${chassis.est_missed_revenue.toLocaleString()}` : null} />

                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 pt-4">Load</p>
                <Field label="LD #"        value={chassis.ld_num} />
                <Field label="SO #"        value={chassis.so_num} />
                <Field label="Container"   value={chassis.container_number} />
                <Field label="Origin"      value={chassis.pickup_loc_name} />
                <Field label="Destination" value={chassis.delivery_loc_name} />
                <Field label="Delivered"   value={chassis.delivery_actual_date ? new Date(chassis.delivery_actual_date).toLocaleDateString() : null} />
                <Field label="Returned"    value={chassis.actual_rc_date ? new Date(chassis.actual_rc_date).toLocaleDateString() : null} />
                <Field label="Cust Rate"   value={chassis.cust_rate_charge ? `$${chassis.cust_rate_charge.toLocaleString()}` : null} />
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
