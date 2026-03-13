import { InventoryRecord, DailyBillingRow } from '../types';

interface BillingConfig {
  capacity: number;
  dailyRate: number;
  overageRate: number;
}

/**
 * Generate an array of date strings between startDate and endDate (inclusive).
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Count how many records were present in the yard on a given date.
 * A record is "present" if its dateIn <= date AND it has not exited before that date.
 */
function countUnitsOnDate(records: InventoryRecord[], date: string): number {
  return records.filter((r) => {
    const inDate = r.dateIn;
    if (inDate > date) return false;

    // If the record has exited, check if exit was before this date
    if (r.status === 'EXITED' && r.actualExitAt) {
      const exitDate = r.actualExitAt.split('T')[0];
      if (exitDate < date) return false;
    }

    return true;
  }).length;
}

/**
 * Calculate the billing report for a date range.
 * Uses the peak of AM/PM snapshots for billing calculation.
 */
export function calculateBillingReport(
  records: InventoryRecord[],
  startDate: string,
  endDate: string,
  config: BillingConfig
): { rows: DailyBillingRow[]; grandTotal: number } {
  const dates = getDateRange(startDate, endDate);
  let grandTotal = 0;

  const rows: DailyBillingRow[] = dates.map((date) => {
    // For simplicity, AM and PM counts are the same unit count on that date
    // In production, you'd snapshot at specific times
    const unitCount = countUnitsOnDate(records, date);
    const amCount = unitCount;
    const pmCount = unitCount;
    const peakCount = Math.max(amCount, pmCount);

    const baseUnits = Math.min(peakCount, config.capacity);
    const overageUnits = Math.max(0, peakCount - config.capacity);

    const baseCharge = baseUnits * config.dailyRate;
    const overageCharge = overageUnits * config.overageRate;
    const totalCharge = baseCharge + overageCharge;

    grandTotal += totalCharge;

    return {
      date,
      amCount,
      pmCount,
      peakCount,
      baseUnits,
      overageUnits,
      baseCharge,
      overageCharge,
      totalCharge,
    };
  });

  return { rows, grandTotal };
}
