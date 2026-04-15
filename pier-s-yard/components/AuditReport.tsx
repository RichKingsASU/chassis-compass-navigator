'use client'

import { useState, useMemo } from 'react'
import type { AuditIssue } from '@/lib/types'

interface AuditReportProps {
  issues: AuditIssue[]
}

type SeverityFilter = 'all' | 'error' | 'warning' | 'info'

export function AuditReport({ issues }: AuditReportProps) {
  const [filter, setFilter] = useState<SeverityFilter>('all')

  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0 }
    for (const i of issues) c[i.severity]++
    return c
  }, [issues])

  const filtered = useMemo(
    () => (filter === 'all' ? issues : issues.filter((i) => i.severity === filter)),
    [issues, filter]
  )

  // Group issues by field for "Fix suggestions" section
  const groupedByField = useMemo(() => {
    const map = new Map<string, AuditIssue[]>()
    for (const issue of issues) {
      if (!map.has(issue.field)) map.set(issue.field, [])
      map.get(issue.field)!.push(issue)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [issues])

  const exportCSV = () => {
    const headers = ['Row', 'Severity', 'Field', 'Value', 'Message', 'Suggestion']
    const csvRows = [
      headers.join(','),
      ...issues.map((i) =>
        [
          i.row,
          i.severity,
          `"${i.field}"`,
          `"${(i.value ?? '').replace(/"/g, '""')}"`,
          `"${i.message.replace(/"/g, '""')}"`,
          `"${(i.suggestion ?? '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const severityDot: Record<string, string> = {
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }

  const tabs: { key: SeverityFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'error', label: 'Errors', count: counts.error },
    { key: 'warning', label: 'Warnings', count: counts.warning },
    { key: 'info', label: 'Notes', count: counts.info },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Audit Report</h3>
        <button
          onClick={exportCSV}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-xs bg-gray-100 rounded-full px-2 py-0.5">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issues list */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">No issues found.</p>
        ) : (
          filtered.map((issue, idx) => (
            <div key={idx} className="px-4 py-3 flex items-start gap-3">
              <span
                className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${severityDot[issue.severity]}`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Row {issue.row}</span>
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {issue.field}
                  </span>
                  {issue.value && (
                    <span className="text-gray-600 truncate max-w-[200px]">
                      &ldquo;{issue.value}&rdquo;
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800 mt-0.5">{issue.message}</p>
                {issue.suggestion && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    {issue.suggestion}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fix suggestions summary */}
      {groupedByField.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Fix Suggestions by Field
          </h4>
          <div className="space-y-1">
            {groupedByField.slice(0, 5).map(([field, fieldIssues]) => (
              <div key={field} className="text-sm text-gray-600">
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {field}
                </span>
                <span className="ml-2">
                  {fieldIssues.length} issue{fieldIssues.length > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
