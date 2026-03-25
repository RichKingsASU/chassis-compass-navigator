import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  Warehouse,
  Plus,
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  getAllYards,
  createYard,
  YardConfig,
} from '@/features/yard/services/yardService';
import { supabase } from '@/lib/supabase';
import InventoryDashboard from '@/features/yard/components/InventoryDashboard';
import BillingAnalytics from '@/features/yard/components/BillingAnalytics';
import ReportsHistory from '@/features/yard/components/ReportsHistory';
import YardConfigPanel from '@/features/yard/components/YardConfigPanel';

type UserRole = 'YARD_OPERATOR' | 'INTERNAL' | 'ADMIN';

function getUserRole(_user: any): UserRole {
  return 'ADMIN';
}

// ── Occupancy counts per yard ────────────────────────────────
async function getOccupancyCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('yard_inventory')
    .select('yard_id')
    .is('actual_exit_at', null);
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    counts[row.yard_id] = (counts[row.yard_id] || 0) + 1;
  });
  return counts;
}

// ── Last activity per yard ───────────────────────────────────
async function getLastActivity(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('yard_inventory')
    .select('yard_id, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const last: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    if (!last[row.yard_id]) last[row.yard_id] = row.created_at;
  });
  return last;
}

// ── Create Yard Modal ────────────────────────────────────────
interface CreateYardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
];

function CreateYardModal({ open, onClose, onCreated }: CreateYardModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    shortCode: '',
    addressLine1: '',
    city: '',
    state: '',
    capacity: 50,
    dailyRate: 0,
    overageRate: 0,
    billingSnapshotAm: '06:00',
    billingSnapshotPm: '18:00',
    timezone: 'America/Los_Angeles',
    notes: '',
  });

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.shortCode || !form.city || !form.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await createYard({
        name: form.name,
        shortCode: form.shortCode.toUpperCase(),
        addressLine1: form.addressLine1 || undefined,
        city: form.city,
        state: form.state.toUpperCase(),
        capacity: form.capacity,
        dailyRate: form.dailyRate,
        overageRate: form.overageRate,
        billingSnapshotAm: form.billingSnapshotAm,
        billingSnapshotPm: form.billingSnapshotPm,
        timezone: form.timezone,
        active: true,
        notes: form.notes || undefined,
      });
      toast.success('Yard created successfully');
      onCreated();
      onClose();
      setForm({
        name: '',
        shortCode: '',
        addressLine1: '',
        city: '',
        state: '',
        capacity: 50,
        dailyRate: 0,
        overageRate: 0,
        billingSnapshotAm: '06:00',
        billingSnapshotPm: '18:00',
        timezone: 'America/Los_Angeles',
        notes: '',
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create yard');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Yard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Yard Name *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Short Code * (max 6)</Label>
              <Input
                value={form.shortCode}
                onChange={(e) => set('shortCode', e.target.value.slice(0, 6))}
                className="uppercase"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Address Line 1</Label>
            <Input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>City *</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>State * (2-char)</Label>
              <Input
                value={form.state}
                onChange={(e) => set('state', e.target.value.slice(0, 2))}
                className="uppercase"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => set('capacity', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label>Daily Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.dailyRate}
                onChange={(e) => set('dailyRate', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label>Overage Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.overageRate}
                onChange={(e) => set('overageRate', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>AM Snapshot</Label>
              <Input
                type="time"
                value={form.billingSnapshotAm}
                onChange={(e) => set('billingSnapshotAm', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>PM Snapshot</Label>
              <Input
                type="time"
                value={form.billingSnapshotPm}
                onChange={(e) => set('billingSnapshotPm', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => set('timezone', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('America/', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Yard'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Fleet Overview (View A) ──────────────────────────────────
interface FleetOverviewProps {
  yards: YardConfig[];
  occupancy: Record<string, number>;
  lastActivity: Record<string, string>;
  onSelectYard: (id: string) => void;
  onRefresh: () => void;
}

function FleetOverview({ yards, occupancy, lastActivity, onSelectYard, onRefresh }: FleetOverviewProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const totalYards = yards.length;
  const totalChassis = Object.values(occupancy).reduce((s, n) => s + n, 0);
  const totalCapacity = yards.reduce((s, y) => s + y.capacity, 0);
  const fleetOccupancy = totalCapacity > 0 ? (totalChassis / totalCapacity) * 100 : 0;
  const totalDailyRevenue = yards.reduce((s, y) => {
    const occ = occupancy[y.id] || 0;
    return s + y.dailyRate * occ;
  }, 0);

  const kpis = [
    { label: 'Total Yards', value: totalYards, icon: Building2 },
    { label: 'Chassis in Yards', value: totalChassis, icon: Warehouse },
    { label: 'Total Capacity', value: totalCapacity, icon: BarChart3 },
    { label: 'Fleet Occupancy', value: `${fleetOccupancy.toFixed(1)}%`, icon: BarChart3 },
    { label: 'Daily Revenue', value: `$${totalDailyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign },
  ];

  return (
    <>
      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <kpi.icon className="h-3.5 w-3.5" />
                {kpi.label}
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Yard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {yards.map((yard) => {
          const occ = occupancy[yard.id] || 0;
          const pct = yard.capacity > 0 ? (occ / yard.capacity) * 100 : 0;
          const color = pct > 95 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500';
          const last = lastActivity[yard.id];

          return (
            <Card key={yard.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{yard.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{yard.shortCode}</Badge>
                    <Badge variant={yard.active ? 'default' : 'secondary'}>
                      {yard.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                {(yard.city || yard.state) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[yard.city, yard.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {/* Occupancy bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{occ} chassis / {yard.capacity} capacity</span>
                    <span className="font-medium">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Rates */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Daily: ${yard.dailyRate.toFixed(2)}</span>
                  {yard.overageRate > 0 && <span>Overage: ${yard.overageRate.toFixed(2)}</span>}
                </div>

                {/* Last activity */}
                {last && (
                  <p className="text-xs text-muted-foreground">
                    Last activity: {new Date(last).toLocaleDateString()}
                  </p>
                )}

                <Button className="w-full mt-2" onClick={() => onSelectYard(yard.id)}>
                  Manage Yard
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Yard Card */}
        <Card
          className="flex items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors min-h-[200px]"
          onClick={() => setCreateOpen(true)}
        >
          <div className="text-center space-y-2 text-muted-foreground">
            <Plus className="h-10 w-10 mx-auto" />
            <p className="font-medium">Add New Yard</p>
          </div>
        </Card>
      </div>

      <CreateYardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onRefresh}
      />
    </>
  );
}

// ── Single Yard Detail (View B) ──────────────────────────────
interface SingleYardDetailProps {
  yard: YardConfig;
  yards: YardConfig[];
  userRole: UserRole;
  onBack: () => void;
  onSwitchYard: (id: string) => void;
}

function SingleYardDetail({ yard, yards, userRole, onBack, onSwitchYard }: SingleYardDetailProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-4">
      {/* Breadcrumb + Yard Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> All Yards
          </Button>
          <span className="text-muted-foreground">/</span>
          <h2 className="text-xl font-bold">{yard.name}</h2>
          <Badge variant="outline">{yard.shortCode}</Badge>
        </div>

        {yards.length > 1 && (
          <Select value={yard.id} onValueChange={onSwitchYard}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yards.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name} ({y.shortCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          {userRole === 'ADMIN' && <TabsTrigger value="config">Yard Config</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <InventoryDashboard yardId={yard.id} yardName={yard.name} />
        </TabsContent>
        <TabsContent value="records" className="mt-6">
          <ReportsHistory yardId={yard.id} yardName={yard.name} />
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <BillingAnalytics
            yardId={yard.id}
            yardConfig={{
              capacity: yard.capacity,
              dailyRate: yard.dailyRate,
              overageRate: yard.overageRate,
              name: yard.name,
            }}
          />
        </TabsContent>
        {userRole === 'ADMIN' && (
          <TabsContent value="config" className="mt-6">
            <YardConfigPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ── Main Hub ─────────────────────────────────────────────────
export default function YardManagementHub() {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  const [yards, setYards] = useState<YardConfig[]>([]);
  const [occupancy, setOccupancy] = useState<Record<string, number>>({});
  const [lastActivity, setLastActivity] = useState<Record<string, string>>({});
  const [selectedYardId, setSelectedYardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedYard = yards.find((y) => y.id === selectedYardId) || null;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [yardList, occ, last] = await Promise.all([
        getAllYards(),
        getOccupancyCounts(),
        getLastActivity(),
      ]);
      setYards(yardList);
      setOccupancy(occ);
      setLastActivity(last);
    } catch (err: any) {
      setError(err?.message || 'Failed to load yards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading yards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-destructive font-semibold">Error loading yards</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header — only show on Fleet Overview */}
      {!selectedYard && (
        <div className="flex items-center gap-3">
          <Warehouse className="h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold">Yard Management</h1>
            <p className="text-muted-foreground">Fleet overview across all yards</p>
          </div>
        </div>
      )}

      {selectedYard ? (
        <SingleYardDetail
          yard={selectedYard}
          yards={yards}
          userRole={userRole}
          onBack={() => setSelectedYardId(null)}
          onSwitchYard={setSelectedYardId}
        />
      ) : (
        <FleetOverview
          yards={yards}
          occupancy={occupancy}
          lastActivity={lastActivity}
          onSelectYard={setSelectedYardId}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
