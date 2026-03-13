import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, 'MMM d, yyyy') : 'Invalid date'
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, 'MMM d, yyyy h:mm a') : 'Invalid date'
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : 'Invalid date'
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
