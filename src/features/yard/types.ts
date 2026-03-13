// ── Inventory Status ────────────────────────────────────────
export type InventoryStatus =
  | 'AVAILABLE'
  | 'EMPTY'
  | 'LOADED'
  | 'RESERVED'
  | 'SHOP'
  | 'EXITED';

// ── User Roles ──────────────────────────────────────────────
export type UserRole = 'YARD_OPERATOR' | 'INTERNAL' | 'ADMIN';

// ── Inventory Record ────────────────────────────────────────
export interface InventoryRecord {
  id: string;
  dateIn: string;
  timeIn?: string;
  containerNumber?: string;
  chassisNumber: string;
  status: InventoryStatus;
  bkSeal?: string;
  spot?: string;

  // Classification
  chassisType?: string;
  sslSize?: string;
  accountManager?: string;
  reservingEntity?: string;

  // Carrier details (inbound)
  inboundCarrier?: string;
  inboundDriverName?: string;
  inboundPlateCDL?: string;

  // Carrier details (outbound / planned)
  outboundCarrier?: string;
  plannedExitDate?: string;
  plannedDriverName?: string;
  reservationNotes?: string;

  // Shop / maintenance
  shopReason?: string;
  expectedReturnDate?: string;

  // Exit details
  actualExitAt?: string;
  exitRecordedByUserId?: string;
  exitReason?: string;
  exitDriverName?: string;
  exitPlateCDL?: string;

  createdAt?: string;
  updatedAt?: string;
}

// ── Audit Event ─────────────────────────────────────────────
export interface AuditEvent {
  id: string;
  recordId?: string;
  actorUserId: string;
  actorRole: UserRole;
  timestamp: string;
  actionType: 'CREATE' | 'UPDATE' | 'EXIT' | 'AMENDMENT' | 'CONFIG_CHANGE';
  changedFields: Record<string, { old: any; new: any }>;
  reason?: string;
}

// ── Daily Billing Row ───────────────────────────────────────
export interface DailyBillingRow {
  date: string;
  amCount: number;
  pmCount: number;
  peakCount: number;
  baseUnits: number;
  overageUnits: number;
  baseCharge: number;
  overageCharge: number;
  totalCharge: number;
}
