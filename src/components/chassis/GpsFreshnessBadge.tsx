import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  lastSeen: string | null | undefined
  className?: string
}

/**
 * Small badge summarising how recently a GPS ping was recorded.
 * - < 4 h  => default (fresh)
 * - < 48 h => secondary (aging)
 * - >= 48h => destructive with STALE warning
 */
export function GpsFreshnessBadge({ lastSeen, className }: Props) {
  if (!lastSeen) {
    return (
      <Badge variant="outline" className={`text-xs text-gray-400 ${className ?? ''}`}>
        No GPS
      </Badge>
    )
  }

  const lastSeenDate = new Date(lastSeen)
  if (Number.isNaN(lastSeenDate.getTime())) {
    return (
      <Badge variant="outline" className={`text-xs text-gray-400 ${className ?? ''}`}>
        No GPS
      </Badge>
    )
  }

  const hoursAgo = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60)
  const label = formatDistanceToNow(lastSeenDate, { addSuffix: true })

  const variant = hoursAgo < 4 ? 'default' : hoursAgo < 48 ? 'secondary' : 'destructive'
  const staleWarning = hoursAgo >= 48 ? ' \u26A0 STALE' : ''

  return (
    <Badge
      variant={variant}
      className={`text-xs ${className ?? ''}`}
      title={`Last GPS: ${lastSeenDate.toLocaleString()}`}
    >
      GPS: {label}
      {staleWarning}
    </Badge>
  )
}
