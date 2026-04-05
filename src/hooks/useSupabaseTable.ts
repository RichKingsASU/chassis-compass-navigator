import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseSupabaseTableOptions {
  table: string
  pageSize?: number
  searchColumns?: string[]
  defaultSort?: { column: string; ascending: boolean }
}

interface UseSupabaseTableReturn {
  data: Record<string, unknown>[]
  loading: boolean
  error: string | null
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  search: string
  sortColumn: string | null
  sortAscending: boolean
  setPage: (p: number) => void
  setSearch: (s: string) => void
  setSort: (column: string) => void
  refetch: () => void
}

export function useSupabaseTable({
  table,
  pageSize = 50,
  searchColumns = [],
  defaultSort = { column: 'created_at', ascending: false },
}: UseSupabaseTableOptions): UseSupabaseTableReturn {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearchRaw] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSort.column)
  const [sortAscending, setSortAscending] = useState(defaultSort.ascending)

  const setSearch = useCallback((s: string) => {
    setSearchRaw(s)
    setPage(0)
  }, [])

  const setSort = useCallback((column: string) => {
    setSortColumn(prev => {
      if (prev === column) {
        setSortAscending(a => !a)
      } else {
        setSortAscending(true)
      }
      return column
    })
    setPage(0)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from(table)
        .select('*', { count: 'exact' })

      if (search && searchColumns.length > 0) {
        const orFilter = searchColumns
          .map(col => `${col}.ilike.%${search}%`)
          .join(',')
        query = query.or(orFilter)
      }

      if (sortColumn) {
        query = query.order(sortColumn, { ascending: sortAscending })
      }

      query = query.range(page * pageSize, (page + 1) * pageSize - 1)

      const { data: result, error: fetchError, count } = await query

      if (fetchError) throw fetchError
      setData(result || [])
      setTotalCount(count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to fetch ${table} data`)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, page, pageSize, search, sortColumn, sortAscending])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    search,
    sortColumn,
    sortAscending,
    setPage,
    setSearch,
    setSort,
    refetch: fetchData,
  }
}
