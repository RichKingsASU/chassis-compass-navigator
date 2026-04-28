import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  PROVAR_PORTALS,
  type ProvarContainerRow,
  type ProvarPortal,
  type ProvarPortalSummary,
  type ProvarSyncLogRow,
  type PullSummary,
  type ProvarPullRun,
} from '@/types/provar'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useProvar() {
  const [containers, setContainers] = useState<ProvarContainerRow[]>([])
  const [syncLog, setSyncLog] = useState<ProvarSyncLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isPulling, setIsPulling] = useState(false)
  const [lastPullResult, setLastPullResult] = useState<PullSummary | null>(
    null,
  )
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [activeRun, setActiveRun] = useState<ProvarPullRun | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const today = todayIso()

    const [containersRes, logRes] = await Promise.all([
      supabase
        .from('provar_containers_sheet')
        .select('*')
        .eq('snapshot_date', today)
        .order('ingested_at', { ascending: false }),
      supabase
        .from('provar_sync_log')
        .select('*')
        .order('ran_at', { ascending: false })
        .limit(50),
    ])

    if (!containersRes.error) {
      setContainers((containersRes.data ?? []) as ProvarContainerRow[])
    }
    if (!logRes.error) {
      setSyncLog((logRes.data ?? []) as ProvarSyncLogRow[])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Polling for active run status
  useEffect(() => {
    if (!activeRunId) return

    const poll = async () => {
      const { data, error } = await supabase
        .from('provar_pull_runs')
        .select('*')
        .eq('id', activeRunId)
        .single()

      if (!error && data) {
        const run = data as ProvarPullRun
        setActiveRun(run)
        if (run.status === 'completed' || run.status === 'failed') {
          setActiveRunId(null)
          refetch()
        }
      }
    }

    const interval = setInterval(poll, 3000)
    poll()
    return () => clearInterval(interval)
  }, [activeRunId, refetch])

  const portalSummaries = useMemo<ProvarPortalSummary[]>(() => {
    return PROVAR_PORTALS.map((portal) => {
      const containers_count = containers.filter(
        (c) => c.portal === portal,
      ).length
      const latestLog = syncLog.find((l) => l.portal === portal)

      return {
        portal,
        containers_count,
        last_pulled: latestLog?.ran_at ?? null,
        last_status: (latestLog?.status as 'success' | 'error') ?? 'never',
      }
    })
  }, [containers, syncLog])

  const triggerPull = useCallback(
    async (portals?: ProvarPortal[]): Promise<PullSummary> => {
      setIsPulling(true)
      try {
        const payload =
          portals && portals.length > 0 ? { portals } : {}

        const { data, error } = await supabase.functions.invoke<PullSummary>(
          'provar-pull',
          { body: payload },
        )

        if (error) {
          throw new Error(error.message || 'Edge function invocation failed')
        }
        if (!data) {
          throw new Error('Edge function returned no data')
        }

        setLastPullResult(data)
        await refetch()
        return data
      } finally {
        setIsPulling(false)
      }
    },
    [refetch],
  )

  const startAutomationPull = useCallback(
    async (portal: string = 'all', dateRange: string = 'last_7_days') => {
      setIsPulling(true)
      try {
        const { data, error } = await supabase.functions.invoke<{ run_id: string }>(
          'start-provar-pull',
          { body: { portal, dateRange } },
        )

        if (error) throw new Error(error.message)
        if (!data?.run_id) throw new Error('No run ID returned')

        setActiveRunId(data.run_id)
        return data.run_id
      } finally {
        setIsPulling(false)
      }
    },
    [],
  )

  return {
    containers,
    syncLog,
    portalSummaries,
    loading,
    isPulling,
    lastPullResult,
    activeRun,
    triggerPull,
    startAutomationPull,
    refetch,
  }
}
