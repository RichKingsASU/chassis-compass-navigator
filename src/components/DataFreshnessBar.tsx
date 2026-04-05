import { useDataFreshness } from '@/hooks/useDataFreshness'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  tableName: string
  label?: string
}

export default function DataFreshnessBar({ tableName, label }: Props) {
  const data = useDataFreshness()
  const record = data[tableName]

  if (!record) {
    return (
      <p className="text-xs text-red-500">
        {label ?? tableName} — Never refreshed
      </p>
    )
  }

  const hoursAgo = (Date.now() - record.refreshedAt.getTime()) / 3_600_000
  const color = hoursAgo < 24 ? 'text-green-600' : hoursAgo < 72 ? 'text-yellow-600' : 'text-red-500'

  return (
    <p className={`text-xs ${color}`}>
      {label ?? tableName} last updated: {formatDistanceToNow(record.refreshedAt, { addSuffix: true })}
    </p>
  )
}
