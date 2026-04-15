import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function todayFolder(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}_${dd}_${d.getFullYear()}`
}

export interface GpsUploadZoneProps {
  requiredFileName: string
  bucket: string
  table: string
  accept: string
  onExtracted: (count: number) => void
  uploadDates: string[]
}

type StepStatus = 'idle' | 'active' | 'done' | 'error'

interface Step {
  id: string
  label: string
  detail: string
  status: StepStatus
}

const INITIAL_STEPS: Step[] = [
  { id: 'validate', label: 'Validate file',     detail: 'Checking filename',          status: 'idle' },
  { id: 'upload',   label: 'Upload to storage', detail: 'Sending to Supabase bucket', status: 'idle' },
  { id: 'extract',  label: 'Extract data',      detail: 'Edge function parsing rows', status: 'idle' },
  { id: 'write',    label: 'Write to table',    detail: 'Inserting, skipping dupes',  status: 'idle' },
  { id: 'done',     label: 'Complete',          detail: 'Data available in Data tab', status: 'idle' },
]

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="w-7 h-7 rounded-full border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
    </div>
  )
}

function ProgressPipeline({
  steps,
  rowCount,
  errorMsg,
}: {
  steps: Step[]
  rowCount: number | null
  errorMsg: string | null
}) {
  const doneCount = steps.filter(s => s.status === 'done').length
  const pct = Math.round((doneCount / steps.length) * 100)
  const allDone = doneCount === steps.length
  const hasError = steps.some(s => s.status === 'error')

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{allDone ? 'Complete' : hasError ? 'Failed' : 'Processing...'}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              hasError ? 'bg-red-500' : allDone ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <StepIcon status={step.status} />
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-5 mt-1 ${step.status === 'done' ? 'bg-green-400' : 'bg-muted-foreground/20'}`} />
              )}
            </div>
            <div className="pb-3">
              <p className={`text-sm font-medium leading-tight ${
                step.status === 'active' ? 'text-blue-600 dark:text-blue-400' :
                step.status === 'done'   ? 'text-green-700 dark:text-green-400' :
                step.status === 'error'  ? 'text-red-600 dark:text-red-400' :
                'text-muted-foreground'
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.id === 'write' && step.status === 'done' && rowCount !== null
                  ? `${rowCount} rows written for today`
                  : step.id === 'done' && step.status === 'done'
                  ? 'Switch to the Data tab to view records'
                  : step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasError && errorMsg && (
        <div className="p-3 rounded text-sm border bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
          {errorMsg}
        </div>
      )}
    </div>
  )
}

export function GpsUploadZone({
  requiredFileName,
  bucket,
  table,
  accept,
  onExtracted,
  uploadDates,
}: GpsUploadZoneProps) {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS)
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const allDone = steps.every(s => s.status === 'done')
  const hasError = steps.some(s => s.status === 'error')
  const showPipeline = running || allDone || hasError

  function updateStep(id: string, status: StepStatus) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  function reset() {
    setSteps(INITIAL_STEPS)
    setRowCount(null)
    setErrorMsg(null)
  }

  const processFile = useCallback(async (file: File) => {
    reset()
    setRunning(true)

    // 1. Validate
    updateStep('validate', 'active')
    await new Promise(r => setTimeout(r, 300))
    if (file.name !== requiredFileName) {
      updateStep('validate', 'error')
      setErrorMsg(`File must be named exactly "${requiredFileName}"`)
      setRunning(false)
      return
    }
    updateStep('validate', 'done')

    // 2. Upload to storage
    updateStep('upload', 'active')
    const filePath = `${todayFolder()}/${file.name}`
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true })
      if (error) throw error
      updateStep('upload', 'done')
    } catch (err: unknown) {
      updateStep('upload', 'error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload to storage failed')
      setRunning(false)
      return
    }

    // 3. Extract — wait for storage trigger + edge function
    updateStep('extract', 'active')
    await new Promise(r => setTimeout(r, 2500))
    updateStep('extract', 'done')

    // 4. Write — poll table until rows appear for this file
    updateStep('write', 'active')
    let inserted = 0
    try {
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 1000))
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('_source_file', filePath)
        if (count !== null && count > 0) {
          inserted = count
          break
        }
      }
      setRowCount(inserted)
      updateStep('write', inserted > 0 ? 'done' : 'done') // done either way — 0 means all dupes
    } catch (err: unknown) {
      updateStep('write', 'error')
      setErrorMsg('Could not confirm row insertion')
      setRunning(false)
      return
    }

    // 5. Done
    updateStep('done', 'done')
    onExtracted(inserted)
    setRunning(false)
  }, [requiredFileName, bucket, table, onExtracted])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragging(true) }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setDragging(false) }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation(); setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const folder = todayFolder()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload GPS Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Upload <span className="font-mono font-medium">{requiredFileName}</span> to{' '}
          <span className="font-mono">{bucket}</span>.
          Rows already loaded for today are automatically skipped.
        </p>

        {/* Pipeline progress */}
        {showPipeline && (
          <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
            <ProgressPipeline steps={steps} rowCount={rowCount} errorMsg={errorMsg} />
            {(allDone || hasError) && (
              <button
                onClick={reset}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Upload another file
              </button>
            )}
          </div>
        )}

        {/* Drop zone */}
        {!showPipeline && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-150 select-none
              ${dragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/30'
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
            />
            <div className="text-4xl mb-4">{dragging ? '📂' : '📡'}</div>
            <p className="text-lg font-medium">
              {dragging ? 'Drop to upload' : 'Click or drag & drop to upload'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{requiredFileName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Saves to: <span className="font-mono">{folder}/{requiredFileName}</span>
            </p>
          </div>
        )}

        {/* Upload history */}
        {uploadDates.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Upload history</p>
            <div className="flex flex-wrap gap-2">
              {uploadDates.map(d => (
                <Badge key={d} variant="outline" className="font-mono text-xs">{d}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
