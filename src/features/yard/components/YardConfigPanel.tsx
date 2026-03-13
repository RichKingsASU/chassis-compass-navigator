import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { Settings, Plus, Pencil, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { YardConfig, getAllYards, createYard, updateYardConfig } from '../services/yardService';

const US_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
];

interface YardForm {
  name: string;
  shortCode: string;
  addressLine1: string;
  city: string;
  state: string;
  capacity: number;
  dailyRate: number;
  overageRate: number;
  billingSnapshotAm: string;
  billingSnapshotPm: string;
  timezone: string;
  notes: string;
  active: boolean;
}

const defaultForm: YardForm = {
  name: '',
  shortCode: '',
  addressLine1: '',
  city: '',
  state: '',
  capacity: 30,
  dailyRate: 25,
  overageRate: 25,
  billingSnapshotAm: '08:00',
  billingSnapshotPm: '20:00',
  timezone: 'America/Los_Angeles',
  notes: '',
  active: true,
};

export default function YardConfigPanel() {
  const [yards, setYards] = useState<YardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYard, setEditingYard] = useState<YardConfig | null>(null);
  const [form, setForm] = useState<YardForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const loadYards = async () => {
    setLoading(true);
    try {
      const data = await getAllYards();
      setYards(data);
    } catch (err) {
      console.error('Failed to load yards:', err);
      toast.error('Failed to load yards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYards();
  }, []);

  const openCreate = () => {
    setEditingYard(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (yard: YardConfig) => {
    setEditingYard(yard);
    setForm({
      name: yard.name,
      shortCode: yard.shortCode,
      addressLine1: yard.addressLine1 || '',
      city: yard.city || '',
      state: yard.state || '',
      capacity: yard.capacity,
      dailyRate: yard.dailyRate,
      overageRate: yard.overageRate,
      billingSnapshotAm: yard.billingSnapshotAm,
      billingSnapshotPm: yard.billingSnapshotPm,
      timezone: yard.timezone,
      notes: yard.notes || '',
      active: yard.active,
    });
    setDialogOpen(true);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Yard name is required';
    if (!/^[A-Z0-9]{2,6}$/.test(form.shortCode)) return 'Short code must be 2-6 uppercase alphanumeric characters';
    if (form.capacity <= 0) return 'Capacity must be greater than 0';
    if (form.dailyRate < 0) return 'Daily rate must be 0 or greater';
    if (form.overageRate < 0) return 'Overage rate must be 0 or greater';
    if (!form.billingSnapshotAm) return 'AM Snapshot Time is required';
    if (!form.billingSnapshotPm) return 'PM Snapshot Time is required';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      if (editingYard) {
        await updateYardConfig(editingYard.id, {
          name: form.name,
          capacity: form.capacity,
          dailyRate: form.dailyRate,
          overageRate: form.overageRate,
          billingSnapshotAm: form.billingSnapshotAm,
          billingSnapshotPm: form.billingSnapshotPm,
          notes: form.notes,
          active: form.active,
        });
        toast.success(`Yard "${form.name}" updated successfully`);
      } else {
        await createYard({
          name: form.name,
          shortCode: form.shortCode,
          addressLine1: form.addressLine1 || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          capacity: form.capacity,
          dailyRate: form.dailyRate,
          overageRate: form.overageRate,
          billingSnapshotAm: form.billingSnapshotAm,
          billingSnapshotPm: form.billingSnapshotPm,
          timezone: form.timezone,
          active: form.active,
          notes: form.notes || undefined,
        });
        toast.success(`Yard "${form.name}" created successfully`);
      }
      setDialogOpen(false);
      await loadYards();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save yard');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof YardForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Yard Configuration
        </h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Yard
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : yards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No yards configured yet. Click "+ New Yard" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {yards.map((yard) => (
            <Card
              key={yard.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openEdit(yard)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{yard.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{yard.shortCode}</Badge>
                    <Badge variant={yard.active ? 'default' : 'secondary'}>
                      {yard.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(yard.city || yard.state) && (
                    <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[yard.addressLine1, yard.city, yard.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Capacity:</span>{' '}
                    <span className="font-semibold">{yard.capacity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Daily Rate:</span>{' '}
                    <span className="font-semibold">${yard.dailyRate.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Overage Rate:</span>{' '}
                    <span className="font-semibold">${yard.overageRate.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Snapshots:</span>{' '}
                    <span className="font-semibold">{yard.billingSnapshotAm} / {yard.billingSnapshotPm}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingYard ? 'Edit Yard' : 'Create New Yard'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Yard Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="e.g. 17th ST Yard"
              />
            </div>
            <div>
              <Label>Short Code *</Label>
              <Input
                value={form.shortCode}
                onChange={(e) => updateForm('shortCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="e.g. 17TH"
                maxLength={6}
                disabled={!!editingYard}
              />
              <p className="text-xs text-muted-foreground mt-1">2-6 uppercase alphanumeric characters</p>
            </div>
            <div>
              <Label>Address Line 1</Label>
              <Input
                value={form.addressLine1}
                onChange={(e) => updateForm('addressLine1', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => updateForm('state', e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  placeholder="CA"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Capacity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => updateForm('capacity', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Daily Rate ($) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.dailyRate}
                  onChange={(e) => updateForm('dailyRate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Overage Rate ($) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.overageRate}
                  onChange={(e) => updateForm('overageRate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>AM Snapshot Time *</Label>
                <Input
                  type="time"
                  value={form.billingSnapshotAm}
                  onChange={(e) => updateForm('billingSnapshotAm', e.target.value)}
                />
              </div>
              <div>
                <Label>PM Snapshot Time *</Label>
                <Input
                  type="time"
                  value={form.billingSnapshotPm}
                  onChange={(e) => updateForm('billingSnapshotPm', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Timezone *</Label>
              <Select value={form.timezone} onValueChange={(v) => updateForm('timezone', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {US_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
                placeholder="Optional notes about this yard..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => updateForm('active', v)}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingYard ? 'Update Yard' : 'Create Yard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
