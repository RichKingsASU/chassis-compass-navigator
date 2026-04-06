import { AlertCircle, Database, Inbox } from 'lucide-react'

type EmptyReason = 'no_data' | 'query_error' | 'loading' | 'no_results_for_filter'

interface Props {
  reason: EmptyReason
  errorMessage?: string
  entityName?: string
  filterDescription?: string
}

/**
 * Reusable empty state component that distinguishes between:
 *   - a failed query (shows the error in monospace, red)
 *   - a successful query with no rows (table is genuinely empty)
 *   - a filter that returned no matches
 *   - loading
 */
export function QueryEmptyState({
  reason,
  errorMessage,
  entityName = 'records',
  filterDescription,
}: Props) {
  if (reason === 'query_error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <AlertCircle className="text-red-500 mb-3" size={32} />
        <p className="font-semibold text-red-700 mb-1">Query Failed</p>
        <p className="text-sm text-red-600 font-mono bg-red-50 border border-red-200 rounded px-3 py-2 max-w-lg break-words">
          {errorMessage}
        </p>
        <p className="text-xs text-gray-500 mt-3">
          Check Supabase &rarr; Table Editor to confirm the view or table exists.
        </p>
      </div>
    )
  }

  if (reason === 'no_data') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <Database className="text-gray-300 mb-3" size={32} />
        <p className="font-semibold text-gray-600 mb-1">No {entityName} loaded</p>
        <p className="text-sm text-gray-500">
          This table appears to be empty. Check your data import pipeline.
        </p>
      </div>
    )
  }

  if (reason === 'no_results_for_filter') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <Inbox className="text-gray-300 mb-3" size={32} />
        <p className="font-semibold text-gray-600 mb-1">No {entityName} match this filter</p>
        {filterDescription && <p className="text-sm text-gray-500">{filterDescription}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <span className="text-gray-400 text-sm">Loading {entityName}...</span>
    </div>
  )
}
