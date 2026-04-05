'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UploadLog {
  id: number
  file_name: string
  storage_path: string
  row_count: number | null
  error_count: number | null
  warning_count: number | null
  info_count: number | null
  uploaded_at: string
}

export function UploadHistory() {
  const [logs, setLogs] = useState<UploadLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('pier_s_upload_log')
        .select('id, file_name, storage_path, row_count, error_count, warning_count, info_count, uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(20)

      if (data) setLogs(data)
      setLoading(false)
    }
    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400">
        Loading upload history...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400">
        No uploads yet.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Upload History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 font-medium text-gray-600">File</th>
              <th className="px-3 py-2 font-medium text-gray-600">Rows</th>
              <th className="px-3 py-2 font-medium text-gray-600">Errors</th>
              <th className="px-3 py-2 font-medium text-gray-600">Warnings</th>
              <th className="px-3 py-2 font-medium text-gray-600">Notes</th>
              <th className="px-3 py-2 font-medium text-gray-600">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-900 font-medium">
                  {log.file_name}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {log.row_count ?? '—'}
                </td>
                <td className="px-3 py-2">
                  {(log.error_count ?? 0) > 0 ? (
                    <span className="text-red-600 font-medium">
                      {log.error_count}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {(log.warning_count ?? 0) > 0 ? (
                    <span className="text-yellow-600 font-medium">
                      {log.warning_count}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {log.info_count ?? 0}
                </td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                  {new Date(log.uploaded_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
