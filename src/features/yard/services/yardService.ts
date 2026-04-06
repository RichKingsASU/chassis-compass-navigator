import { supabase } from '@/lib/supabase';
import { InventoryRecord, InventoryStatus, UserRole, AuditEvent } from '../types';

// ── Types ───────────────────────────────────────────────────
export interface YardConfig {
  id: string;
  name: string;
  shortCode: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  capacity: number;
  dailyRate: number;
  overageRate: number;
  billingSnapshotAm: string;
  billingSnapshotPm: string;
  timezone: string;
  active: boolean;
  notes?: string;
}

// ── Row mapping helpers ─────────────────────────────────────
function rowToRecord(row: any): InventoryRecord {
  return {
    id: row.id,
    dateIn: row.date_in,
    timeIn: row.time_in,
    containerNumber: row.container_number,
    chassisNumber: row.chassis_number,
    status: row.status as InventoryStatus,
    bkSeal: row.bk_seal,
    spot: row.spot,
    chassisType: row.chassis_type,
    sslSize: row.ssl_size,
    accountManager: row.account_manager,
    reservingEntity: row.reserving_entity,
    outboundCarrier: row.outbound_carrier,
    inboundCarrier: row.inbound_carrier,
    inboundDriverName: row.inbound_driver_name,
    inboundPlateCDL: row.inbound_plate_cdl,
    plannedExitDate: row.planned_exit_date,
    plannedDriverName: row.planned_driver_name,
    reservationNotes: row.reservation_notes,
    shopReason: row.shop_reason,
    expectedReturnDate: row.expected_return_date,
    actualExitAt: row.actual_exit_at,
    exitRecordedByUserId: row.exit_recorded_by_user_id,
    exitReason: row.exit_reason,
    exitDriverName: row.exit_driver_name,
    exitPlateCDL: row.exit_plate_cdl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function recordToRow(data: Partial<InventoryRecord>, yardId: string) {
  return {
    yard_id: yardId,
    date_in: data.dateIn,
    time_in: data.timeIn,
    container_number: data.containerNumber,
    chassis_number: data.chassisNumber,
    status: data.status,
    bk_seal: data.bkSeal,
    spot: data.spot,
    chassis_type: data.chassisType,
    ssl_size: data.sslSize,
    account_manager: data.accountManager,
    reserving_entity: data.reservingEntity,
    outbound_carrier: data.outboundCarrier,
    inbound_carrier: data.inboundCarrier,
    inbound_driver_name: data.inboundDriverName,
    inbound_plate_cdl: data.inboundPlateCDL,
    planned_exit_date: data.plannedExitDate,
    planned_driver_name: data.plannedDriverName,
    reservation_notes: data.reservationNotes,
    shop_reason: data.shopReason,
    expected_return_date: data.expectedReturnDate,
    actual_exit_at: data.actualExitAt,
    exit_recorded_by_user_id: data.exitRecordedByUserId,
    exit_reason: data.exitReason,
    exit_driver_name: data.exitDriverName,
    exit_plate_cdl: data.exitPlateCDL,
  };
}

// ── Yard Config ─────────────────────────────────────────────
// No dedicated "yards" table exists. Derive yard list from distinct
// location_name values in lb_yard_current, synthesizing default config.
function synthYardConfig(name: string): YardConfig {
  return {
    id: name,
    name,
    shortCode: name.substring(0, 6).toUpperCase(),
    capacity: 0,
    dailyRate: 0,
    overageRate: 0,
    billingSnapshotAm: '06:00',
    billingSnapshotPm: '18:00',
    timezone: 'America/Los_Angeles',
    active: true,
  };
}

export async function getAllYards(): Promise<YardConfig[]> {
  const { data, error } = await supabase
    .from('lb_yard_current')
    .select('location_name')
    .not('location_name', 'is', null);
  if (error) throw error;
  const names = Array.from(
    new Set((data || []).map((r: any) => r.location_name).filter(Boolean))
  ).sort();
  return names.map(synthYardConfig);
}

export async function getYardById(yardId: string): Promise<YardConfig | null> {
  if (!yardId) return null;
  return synthYardConfig(yardId);
}

export async function updateYardConfig(
  yardId: string,
  updates: Partial<Pick<YardConfig, 'name' | 'capacity' | 'dailyRate' | 'overageRate' | 'billingSnapshotAm' | 'billingSnapshotPm' | 'notes' | 'active'>>
): Promise<void> {
  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.capacity !== undefined) row.capacity = updates.capacity;
  if (updates.dailyRate !== undefined) row.daily_rate = updates.dailyRate;
  if (updates.overageRate !== undefined) row.overage_rate = updates.overageRate;
  if (updates.billingSnapshotAm !== undefined) row.billing_snapshot_am = updates.billingSnapshotAm;
  if (updates.billingSnapshotPm !== undefined) row.billing_snapshot_pm = updates.billingSnapshotPm;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.active !== undefined) row.active = updates.active;

  // No "yards" table — config updates are a no-op.
  void row;
  void yardId;
}

export async function createYard(config: Omit<YardConfig, 'id'>): Promise<YardConfig> {
  // No "yards" table — synthesize a config for the given name.
  return synthYardConfig(config.name);
}

// ── Inventory CRUD ──────────────────────────────────────────
export async function getRecords(yardId: string): Promise<InventoryRecord[]> {
  const { data, error } = await supabase
    .from('yard_combined')
    .select('*')
    .eq('yard_id', yardId)
    .order('date_in', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToRecord);
}

export async function getActiveRecords(yardId: string): Promise<InventoryRecord[]> {
  const { data, error } = await supabase
    .from('yard_combined')
    .select('*')
    .eq('yard_id', yardId)
    .neq('status', 'EXITED')
    .order('date_in', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToRecord);
}

export async function createRecord(
  yardId: string,
  data: Partial<InventoryRecord>,
  actor: { id: string; role: UserRole }
): Promise<InventoryRecord> {
  const row = recordToRow(data, yardId);
  const { data: inserted, error } = await supabase
    .from('yard_combined')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  const record = rowToRecord(inserted);
  await logAudit(yardId, record.id, actor, 'CREATE', {});
  return record;
}

export async function updateRecord(
  yardId: string,
  id: string,
  updates: Partial<InventoryRecord>,
  actor: { id: string; role: UserRole },
  reason?: string
): Promise<InventoryRecord | null> {
  const current = await supabase
    .from('yard_combined')
    .select('*')
    .eq('id', id)
    .single();
  if (current.error) return null;

  const row = { ...recordToRow(updates, yardId), updated_at: new Date().toISOString() };
  const { data: updated, error } = await supabase
    .from('yard_combined')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Calculate diff for audit
  const diff: Record<string, { old: any; new: any }> = {};
  Object.keys(updates).forEach((key) => {
    const oldVal = current.data[key];
    const newVal = (updates as any)[key];
    if (oldVal !== newVal) diff[key] = { old: oldVal, new: newVal };
  });
  await logAudit(yardId, id, actor, 'UPDATE', diff, reason);

  return rowToRecord(updated);
}

// ── Audit Log ───────────────────────────────────────────────
async function logAudit(
  yardId: string,
  recordId: string | null,
  actor: { id: string; role: UserRole },
  actionType: AuditEvent['actionType'],
  changedFields: Record<string, { old: any; new: any }>,
  reason?: string
): Promise<void> {
  await supabase.from('yard_audit_log').insert({
    yard_id: yardId,
    record_id: recordId,
    actor_user_id: actor.id,
    actor_role: actor.role,
    action_type: actionType,
    changed_fields: changedFields,
    reason,
  });
}

export async function getAuditLog(yardId: string): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from('yard_audit_log')
    .select('*')
    .eq('yard_id', yardId)
    .order('timestamp', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    recordId: row.record_id,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role as UserRole,
    timestamp: row.timestamp,
    actionType: row.action_type as AuditEvent['actionType'],
    changedFields: row.changed_fields,
    reason: row.reason,
  }));
}
