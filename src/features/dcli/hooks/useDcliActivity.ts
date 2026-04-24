import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DcliActivityRow } from '../types'

export interface UseDcliActivityOptions {
  chassisList?: string[]
  limit?: number
}

export interface UseDcliActivityResult {
  activity: DcliActivityRow[]
  loading: boolean
  error: string | null
}

export function useDcliActivity(options: UseDcliActivityOptions = {}): UseDcliActivityResult {
  const { chassisList, limit = 500 } = options
  const chassisKey = chassisList ? chassisList.join('|') : ''

  const [activity, setActivity] = useState<DcliActivityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('dcli_activity')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(limit)

        if (chassisList && chassisList.length > 0) {
          const trimmed = Array.from(
            new Set(chassisList.map((c) => (c ?? '').trim()).filter(Boolean))
          )
          if (trimmed.length === 0) {
            if (!cancelled) {
              setActivity([])
              setLoading(false)
            }
            return
          }
          query = query.in('chassis', trimmed)
        }

        const { data, error: fetchErr } = await query
        if (fetchErr) throw fetchErr
        if (cancelled) return
        setActivity((data ?? []) as DcliActivityRow[])
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load activity')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [chassisKey, limit])

  return { activity, loading, error }
}
