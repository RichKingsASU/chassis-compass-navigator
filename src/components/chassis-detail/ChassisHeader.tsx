import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChassisIdentity, GpsPing } from './types'

interface Props {
  chassisNumber: string
  identity: ChassisIdentity | null
  identityLoading: boolean
  latestPing: GpsPing | null
}

export default function ChassisHeader({
  chassisNumber,
  identity,
  identityLoading,
  latestPing,
}: Props) {
  return (
    <div className="space-y-3">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/chassis/fleet-overview" className="hover:text-foreground">
          Fleet
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-foreground">{chassisNumber}</span>
      </nav>

      <h1 className="text-3xl font-bold font-mono tracking-tight">
        {chassisNumber}
      </h1>

      {identityLoading ? (
        <Skeleton className="h-6 w-96" />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {identity?.lessor && (
            <Badge variant="outline" className="text-xs">
              {identity.lessor}
            </Badge>
          )}
          {identity?.chassis_type && (
            <Badge variant="outline" className="text-xs">
              {identity.chassis_type}
            </Badge>
          )}
          {identity?.chassis_size && (
            <Badge variant="outline" className="text-xs">
              {identity.chassis_size}
            </Badge>
          )}
          {identity?.chassis_status && (
            <Badge variant="secondary" className="text-xs">
              {identity.chassis_status}
            </Badge>
          )}
          {latestPing && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              GPS: {latestPing.source}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
