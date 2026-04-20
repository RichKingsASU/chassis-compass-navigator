'use client'

interface InventoryItem {
  id: number
  equip_no: string
  eq_type: string | null
  size: number | null
  load_type: string | null
  days_onsite: number | null
  resource_name: string | null
  last_carrier: string | null
  comment: string | null
  source_file: string | null
}

interface InventoryTableProps {
  items: InventoryItem[]
  total: number
  page: number
  onPageChange: (page: number) => void
  issueRows?: Set<number>
  warningRows?: Set<number>
}

export function InventoryTable({
  items,
  total,
  page,
  onPageChange,
  issueRows,
  warningRows,
}: InventoryTableProps) {
  const pageSize = 100
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 font-medium text-gray-600">Equip No</th>
              <th className="px-3 py-2 font-medium text-gray-600">Type</th>
              <th className="px-3 py-2 font-medium text-gray-600">Size</th>
              <th className="px-3 py-2 font-medium text-gray-600">Load Type</th>
              <th className="px-3 py-2 font-medium text-gray-600">Days</th>
              <th className="px-3 py-2 font-medium text-gray-600">Spot</th>
              <th className="px-3 py-2 font-medium text-gray-600">Carrier</th>
              <th className="px-3 py-2 font-medium text-gray-600">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-gray-400"
                >
                  No inventory data found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isError = issueRows?.has(item.id)
                const isWarning = warningRows?.has(item.id)
                const rowClass = isError
                  ? 'bg-red-50'
                  : isWarning
                    ? 'bg-yellow-50'
                    : 'hover:bg-gray-50'

                return (
                  <tr key={item.id} className={rowClass}>
                    <td className="px-3 py-2 font-mono text-gray-900">
                      {item.equip_no}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.eq_type ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.size ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          item.load_type === 'Loaded'
                            ? 'bg-blue-100 text-blue-700'
                            : item.load_type === 'Empty'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {item.load_type ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          (item.days_onsite ?? 0) > 90
                            ? 'text-red-600 font-semibold'
                            : (item.days_onsite ?? 0) > 30
                              ? 'text-orange-600'
                              : 'text-gray-700'
                        }
                      >
                        {item.days_onsite ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {item.resource_name ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {item.last_carrier ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                      {item.comment ?? '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {total} total records
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
