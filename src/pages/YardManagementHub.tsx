import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Warehouse, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface YardCard {
  slug: string;
  name: string;
  terminal: string;
}

const YARDS: YardCard[] = [
  { slug: 'pola', name: 'PIER S', terminal: 'PIER S' },
  { slug: 'jedyard', name: 'JED YARD', terminal: 'JED YARD' },
];

export default function YardManagementHub() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result: Record<string, number> = {};
        let hadError = false;
        for (const y of YARDS) {
          try {
            const { count, error } = await supabase
              .from('yard_events_data')
              .select('*', { count: 'exact', head: true })
              .eq('Terminal', y.terminal);
            if (error) {
              hadError = true;
            } else {
              result[y.slug] = count || 0;
            }
          } catch {
            hadError = true;
          }
        }
        if (cancelled) return;
        setCounts(result);
        setUnavailable(hadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="h-7 w-7" />
        <div>
          <h1 className="text-3xl font-bold">Yard Management</h1>
          <p className="text-muted-foreground">Choose a yard to view events</p>
        </div>
      </div>

      {unavailable && (
        <div className="flex items-start gap-3 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            Live event data unavailable — run <code className="font-mono">NOTIFY pgrst, 'reload schema'</code> in Supabase SQL editor
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {YARDS.map((y) => (
          <Card key={y.slug} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{y.name}</span>
                <Warehouse className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {loading
                  ? 'Loading…'
                  : unavailable
                  ? 'Event data unavailable'
                  : `${counts[y.slug] ?? 0} events`}
              </div>
              <Button asChild className="w-full">
                <Link to={`/yards/${y.slug}`}>
                  View Yard <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
