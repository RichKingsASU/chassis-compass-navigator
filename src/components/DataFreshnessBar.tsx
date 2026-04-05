import { useDataFreshness } from '@/hooks/useDataFreshness'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function freshnessColor(date: Date): string {
  const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60)
  if (hours < 24) return 'text-green-600 bg-green-50 border-green-200'
  if (hours < 72) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

interface DataFreshnessBarProps {
  tableName: string
  label?: string
}

export default function DataFreshnessBar({ tableName, label }: DataFreshnessBarProps) {
  const { freshness, loading } = useDataFreshness()

  if (loading) return null

  const entry = freshness[tableName]

  if (!entry) {
    return (
      <div className="text-xs px-3 py-1.5 rounded border text-red-600 bg-red-50 border-red-200">
        {label || tableName} — Never refreshed
      </div>
    )
  }

  const color = freshnessColor(entry.refreshedAt)

  return (
    <div className={`text-xs px-3 py-1.5 rounded border ${color}`}>
      {label || tableName} last updated: {timeAgo(entry.refreshedAt)}
      {entry.rowCount != null && <span className="ml-2">({entry.rowCount.toLocaleString()} rows)</span>}
    </div>
  )
}
