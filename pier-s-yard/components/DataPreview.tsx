'use client'

import type { InventoryRow } from '@/lib/types'

interface DataPreviewProps {
  rows: InventoryRow[]
}

export function DataPreview({ rows }: DataPreviewProps) {
  const previewRows = rows.slice(0, 10)
  const columns: { key: keyof InventoryRow; label: string }[] = [
    { key: 'equip_no', label: 'Equip No' },
    { key: 'eq_type', label: 'Type' },
    { key: 'size', label: 'Size' },
    { key: 'load_type', label: 'Load' },
    { key: 'days_onsite', label: 'Days' },
    { key: 'resource_name', label: 'Spot' },
    { key: 'last_carrier', label: 'Carrier' },
    { key: 'comment', label: 'Comment' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold">Data Preview</h3>
        <span className="text-sm text-gray-500">
          Showing {previewRows.length} of {rows.length} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 font-medium text-gray-600"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {previewRows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2 text-gray-800 whitespace-nowrap"
                  >
                    {row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
