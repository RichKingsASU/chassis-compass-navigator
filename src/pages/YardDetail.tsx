import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Warehouse } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalizeEquipmentId } from '@/lib/equipmentNormalizer';

const YARD_MAP: Record<string, { name: string; terminal: string }> = {
  pola: { name: 'PIER S', terminal: 'PIER S' },
  jedyard: { name: 'JED YARD', terminal: 'JED YARD' },
};

interface YardEvent {
  ChassisNo: string | null;
  EventDate: string | null;
  EventTime: string | null;
  EventDescription: string | null;
  ContainerNo: string | null;
  Condition: string | null;
}

export default function YardDetail() {
  const { yardSlug = '' } = useParams<{ yardSlug: string }>();
  const yard = YARD_MAP[yardSlug];
  const [events, setEvents] = useState<YardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!yard) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('yard_events_data')
          .select('"ChassisNo","EventDate","EventTime","EventDescription","ContainerNo","Condition"')
          .eq('Terminal', yard.terminal)
          .order('EventDate', { ascending: false })
          .limit(500);
        if (cancelled) return;
        if (error) {
          setEvents([]);
        } else {
          setEvents((data as YardEvent[]) || []);
        }
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [yard]);

  if (!yard) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Unknown yard.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/yard"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Yards</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/yard"><ArrowLeft className="h-4 w-4 mr-1" /> All Yards</Link>
        </Button>
        <Warehouse className="h-7 w-7" />
        <div>
          <h1 className="text-3xl font-bold">{yard.name}</h1>
          <p className="text-muted-foreground">Yard events</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No events found for this yard</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis</TableHead>
                    <TableHead>Container</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e, idx) => {
                    const chassisNorm = e.ChassisNo
                      ? normalizeEquipmentId(e.ChassisNo).normalized || e.ChassisNo
                      : '';
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{chassisNorm}</TableCell>
                        <TableCell className="font-mono">{e.ContainerNo || ''}</TableCell>
                        <TableCell>{e.EventDate || ''}</TableCell>
                        <TableCell>{e.EventTime || ''}</TableCell>
                        <TableCell>{e.EventDescription || ''}</TableCell>
                        <TableCell>{e.Condition || ''}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
