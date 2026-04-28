import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  PROVAR_PORTALS,
  type ProvarContainerRow,
  type ProvarPortal,
  type ProvarPortalSummary,
  type ProvarSyncLogRow,
  type PullSummary,
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

  return {
    containers,
    syncLog,
    portalSummaries,
    loading,
    isPulling,
    lastPullResult,
    triggerPull,
    refetch,
  }
}
