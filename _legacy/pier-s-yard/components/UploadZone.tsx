'use client'

import { useState, useCallback, useRef } from 'react'
import type { UploadResult, InventoryRow } from '@/lib/types'

type UploadStage = 'idle' | 'parsing' | 'auditing' | 'uploading' | 'complete' | 'error'

interface UploadZoneProps {
  onComplete: (result: UploadResult) => void
  onPreview: (rows: InventoryRow[]) => void
}

export function UploadZone({ onComplete, onPreview }: UploadZoneProps) {
  const [stage, setStage] = useState<UploadStage>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [previewResult, setPreviewResult] = useState<UploadResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setErrorMsg('Please select an Excel file (.xlsx or .xls)')
        return
      }
      setSelectedFile(file)
      setErrorMsg('')
      setPreviewResult(null)

      // Parse locally for preview
      import('@/lib/parseExcel').then(({ parseExcel }) => {
        file.arrayBuffer().then((buf) => {
          try {
            const rows = parseExcel(buf, file.name)
            onPreview(rows)
          } catch {
            // Preview is best-effort
          }
        })
      })
    },
    [onPreview]
  )

  const handleUpload = async () => {
    if (!selectedFile) return

    setStage('parsing')
    setErrorMsg('')

    try {
      setStage('auditing')
      const formData = new FormData()
      formData.append('file', selectedFile)

      setStage('uploading')
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const result: UploadResult = await res.json()
      setStage('complete')
      setPreviewResult(result)
      onComplete(result)
    } catch (err) {
      setStage('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleUploadAnyway = async () => {
    // Same as handleUpload — errors have already been flagged
    await handleUpload()
  }

  const stageLabel: Record<UploadStage, string> = {
    idle: '',
    parsing: 'Parsing...',
    auditing: 'Auditing...',
    uploading: 'Uploading...',
    complete: 'Complete',
    error: 'Error',
  }

  const hasErrors =
    previewResult && previewResult.issues.some((i) => i.severity === 'error')

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <div className="text-gray-500">
          {selectedFile ? (
            <div>
              <p className="text-lg font-medium text-gray-800">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB — click or drop to
                change
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg">Drop your Excel file here</p>
              <p className="text-sm mt-1">or click to browse</p>
            </div>
          )}
        </div>
      </div>

      {stage !== 'idle' && stage !== 'complete' && stage !== 'error' && (
        <div className="flex items-center gap-2 text-blue-600">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{stageLabel[stage]}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || (stage !== 'idle' && stage !== 'error' && stage !== 'complete')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload & Audit
        </button>

        {hasErrors && stage === 'complete' && (
          <button
            onClick={handleUploadAnyway}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600"
          >
            Upload anyway (
            {previewResult!.issues.filter((i) => i.severity === 'error').length}{' '}
            errors)
          </button>
        )}
      </div>
    </div>
  )
}
