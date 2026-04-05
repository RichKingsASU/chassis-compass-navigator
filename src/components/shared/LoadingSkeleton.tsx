import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSkeletonProps {
  rows?: number
  cols?: number
}

export function LoadingSkeleton({ rows = 10, cols = 6 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-8 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
