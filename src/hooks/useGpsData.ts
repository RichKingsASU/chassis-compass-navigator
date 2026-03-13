import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface GpsUpload {
  id: string
  provider: string
  file_name: string
  file_path: string
  file_type: string
  data_date: string
  notes: string | null
  status: string
  row_count: number
  created_at: string
  updated_at: string
}

interface GpsDataRecord {
  id: string
  upload_id: string
  provider: string
  device_id: string | null
  latitude: number | null
  longitude: number | null
  recorded_at: string | null
  speed: number | null
  heading: number | null
  altitude: number | null
  battery_level: number | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export function useGpsUploads(provider?: string) {
  const [uploads, setUploads] = useState<GpsUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUploads = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('gps_uploads')
        .select('*')
        .order('created_at', { ascending: false })

      if (provider) {
        query = query.eq('provider', provider)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setUploads((data as GpsUpload[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GPS uploads')
    } finally {
      setLoading(false)
    }
  }, [provider])

  useEffect(() => {
    fetchUploads()
  }, [fetchUploads])

  return { uploads, loading, error, refetch: fetchUploads }
}

export function useGpsData(uploadId?: string) {
  const [data, setData] = useState<GpsDataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('gps_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(500)

      if (uploadId) {
        query = query.eq('upload_id', uploadId)
      }

      const { data: result, error: fetchError } = await query
      if (fetchError) throw fetchError
      setData((result as GpsDataRecord[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GPS data')
    } finally {
      setLoading(false)
    }
  }, [uploadId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
