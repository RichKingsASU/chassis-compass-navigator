'use client'

import { useState } from 'react'
import { UploadZone } from '@/components/UploadZone'
import { AuditReport } from '@/components/AuditReport'
import { DataPreview } from '@/components/DataPreview'
import { UploadHistory } from '@/components/UploadHistory'
import type { AuditIssue, InventoryRow } from '@/lib/types'

export default function UploadPage() {
  const [issues, setIssues] = useState<AuditIssue[]>([])
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [uploadComplete, setUploadComplete] = useState(false)
  const [summary, setSummary] = useState<{
    rowsUpserted: number
    storagePath: string
  } | null>(null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Upload Equipment Inventory</h1>
      <UploadZone
        onComplete={(result) => {
          setIssues(result.issues)
          setUploadComplete(true)
          setSummary({
            rowsUpserted: result.rowsUpserted,
            storagePath: result.storagePath,
          })
        }}
        onPreview={(parsedRows) => setRows(parsedRows)}
      />

      {rows.length > 0 && <DataPreview rows={rows} />}

      {uploadComplete && issues.length > 0 && <AuditReport issues={issues} />}

      {uploadComplete && summary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            Upload complete: {summary.rowsUpserted} rows upserted.
          </p>
          <p className="text-green-600 text-sm">
            Stored at: {summary.storagePath}
          </p>
        </div>
      )}

      <UploadHistory />
    </div>
  )
}
