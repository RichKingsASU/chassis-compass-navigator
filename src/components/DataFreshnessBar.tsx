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

  const hoursAgo = (Date.now() - entry.refreshedAt.getTime()) / 3_600_000
  const colorClass = hoursAgo < 24 ? 'text-green-600' : hoursAgo < 72 ? 'text-yellow-600' : 'text-red-500'

  return (
    <p className={`text-xs ${colorClass}`}>
      {label || tableName} last updated: {formatDistanceToNow(entry.refreshedAt, { addSuffix: true })}
    </p>
  )
}
