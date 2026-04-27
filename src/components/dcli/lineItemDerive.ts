import type {
  DcliInternalLineItem,
  DcliLineItemStatus,
  DcliTmsMatchSnapshot,
  DcliValidationStatus,
} from '@/features/dcli/types'

export type MatchBucket = 'matched' | 'fuzzy' | 'unmatched'

export const LINE_ITEM_STATUSES: DcliLineItemStatus[] = [
  'Approved',
  'Disputed',
  'On Hold',
  'Pending',
  'Skipped',
]

export function deriveMatchScore(tms: DcliTmsMatchSnapshot | null | undefined): number | null {
  if (tms == null) return null
  if (typeof tms.match_score === 'number') {
    const s = tms.match_score
    return s <= 1 ? Math.round(s * 100) : Math.round(s)
  }
  if (typeof tms === 'object' && Object.keys(tms).length === 0) return null
  return 100
}

export function deriveMatchBucket(line: DcliInternalLineItem): MatchBucket {
  const tms = line.tms_match
  if (tms == null) return 'unmatched'
  const score = deriveMatchScore(tms)
  if (score == null) return 'unmatched'
  if (score >= 100) return 'matched'
  if (score >= 50) return 'fuzzy'
  if (score > 0) return 'fuzzy'
  return 'unmatched'
}

export function deriveValidationStatus(
  line: DcliInternalLineItem
): DcliValidationStatus {
  if (line.validation_status) return line.validation_status
  const tms = line.tms_match
  if (tms == null) return 'skipped'
  const lineTotal = typeof line.total === 'number' ? line.total : null
  const tmsTotal = typeof tms.total === 'number' ? tms.total : null
  if (lineTotal == null || tmsTotal == null) return 'skipped'
  const diff = Math.abs(lineTotal - tmsTotal)
  if (diff <= 0.01) return 'pass'
  const base = Math.max(Math.abs(tmsTotal), 0.01)
  const pct = diff / base
  if (pct <= 0.1) return 'warn'
  return 'fail'
}

export function deriveDayVariance(line: DcliInternalLineItem): number | null {
  const tms = line.tms_match
  if (tms == null) return null
  const tmsDays =
    typeof tms.days === 'number'
      ? tms.days
      : typeof tms.days_out === 'number'
        ? tms.days_out
        : null
  const billDays = typeof line.bill_days === 'number' ? line.bill_days : null
  if (tmsDays == null || billDays == null) return null
  return billDays - tmsDays
}

export function deriveAmountVariance(line: DcliInternalLineItem): number | null {
  const tms = line.tms_match
  if (tms == null) return null
  const tmsTotal = typeof tms.total === 'number' ? tms.total : null
  const lineTotal = typeof line.total === 'number' ? line.total : null
  if (tmsTotal == null || lineTotal == null) return null
  return lineTotal - tmsTotal
}

export function statusColorClass(status: string | null | undefined): {
  bar: string
  dot: string
  badge: string
} {
  switch (status) {
    case 'Approved':
      return {
        bar: 'bg-emerald-500',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      }
    case 'Disputed':
      return {
        bar: 'bg-red-500',
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-800 border-red-300',
      }
    case 'On Hold':
      return {
        bar: 'bg-amber-500',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
      }
    case 'Pending':
      return {
        bar: 'bg-blue-500',
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
      }
    case 'Skipped':
      return {
        bar: 'bg-gray-400',
        dot: 'bg-gray-400',
        badge: 'bg-gray-100 text-gray-700 border-gray-300',
      }
    default:
      return {
        bar: 'bg-muted-foreground/30',
        dot: 'bg-muted-foreground/40',
        badge: 'bg-muted text-muted-foreground border-border',
      }
  }
}
