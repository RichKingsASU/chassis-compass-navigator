import { useDataFreshness } from '@/hooks/useDataFreshness'
import { formatDistanceToNow } from 'date-fns'

interface DataFreshnessBarProps {
  tableName: string
  label?: string
}

export default function DataFreshnessBar({ tableName, label }: DataFreshnessBarProps) {
  const freshness = useDataFreshness()
  const entry = freshness[tableName]

  if (!entry) {
    return (
      <p className="text-xs text-red-500">
        {label || tableName} — Never refreshed
      </p>
    )
  }

  const isFallback = (entry as { fallback?: boolean }).fallback === true
  const hoursAgo = (Date.now() - entry.refreshedAt.getTime()) / 3_600_000
  const baseColor = hoursAgo < 24 ? 'text-green-600' : hoursAgo < 72 ? 'text-yellow-600' : 'text-red-500'
  const colorClass = isFallback ? 'text-amber-600' : baseColor
  const prefix = isFallback
    ? `${label || tableName} — Last data:`
    : `${label || tableName} last updated:`

  return (
    <p className={`text-xs ${colorClass}`}>
      {prefix} {formatDistanceToNow(entry.refreshedAt, { addSuffix: true })}
    </p>
  )
}
