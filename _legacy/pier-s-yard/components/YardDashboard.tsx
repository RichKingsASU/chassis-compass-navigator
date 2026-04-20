'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MetricCards } from './MetricCards'
import { InventoryTable } from './InventoryTable'

type StatusFilter = '' | 'available' | 'reserved' | 'do_not_use' | 'loaded'

export function YardDashboard() {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [spotFilter, setSpotFilter] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [metrics, setMetrics] = useState({
    available: 0,
    reserved: 0,
    overdue: 0,
    doNotUse: 0,
  })
  const [spots, setSpots] = useState<string[]>([])

  // Fetch metrics
  useEffect(() => {
    async function fetchMetrics() {
      const [avail, reserved, overdue, dnu] = await Promise.all([
        supabase
          .from('piers_equipment_inventory')
          .select('*', { count: 'exact', head: true })
          .or('load_type.eq.Unknown,load_type.is.null')
          .not('comment', 'ilike', '%DO NOT USE%'),
        supabase
          .from('piers_equipment_inventory')
          .select('*', { count: 'exact', head: true })
          .ilike('comment', '%RESERVED%'),
        supabase
          .from('piers_equipment_inventory')
          .select('*', { count: 'exact', head: true })
          .gt('days_onsite', 90),
        supabase
          .from('piers_equipment_inventory')
          .select('*', { count: 'exact', head: true })
          .ilike('comment', '%DO NOT USE%'),
      ])

      setMetrics({
        available: avail.count ?? 0,
        reserved: reserved.count ?? 0,
        overdue: overdue.count ?? 0,
        doNotUse: dnu.count ?? 0,
      })
    }

    fetchMetrics()
  }, [items]) // re-fetch when items change

  // Fetch unique spots
  useEffect(() => {
    async function fetchSpots() {
      const { data } = await supabase
        .from('piers_equipment_inventory')
        .select('resource_name')
        .not('resource_name', 'is', null)
      if (data) {
        const unique = [...new Set(data.map((d) => d.resource_name as string))]
        setSpots(unique.sort())
      }
    }
    fetchSpots()
  }, [])

  // Fetch last updated
  useEffect(() => {
    async function fetchLastUpdated() {
      const { data } = await supabase
        .from('pier_s_upload_log')
        .select('uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single()
      if (data) {
        setLastUpdated(new Date(data.uploaded_at).toLocaleString())
      }
    }
    fetchLastUpdated()
  }, [])

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    if (spotFilter) params.set('spot', spotFilter)
    params.set('limit', '100')
    params.set('offset', String((page - 1) * 100))

    const res = await fetch(`/api/inventory?${params.toString()}`)
    if (res.ok) {
      const json = await res.json()
      setItems(json.data ?? [])
      setTotal(json.total ?? 0)
    }
  }, [statusFilter, search, spotFilter, page])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Yard Dashboard</h1>
        {lastUpdated && (
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </span>
        )}
      </div>

      <MetricCards {...metrics} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search equip no, comment, carrier..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter)
            setPage(1)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="loaded">Loaded</option>
          <option value="do_not_use">Do Not Use</option>
        </select>

        <select
          value={spotFilter}
          onChange={(e) => {
            setSpotFilter(e.target.value)
            setPage(1)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Spots</option>
          {spots.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={fetchInventory}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <InventoryTable
        items={items as never[]}
        total={total}
        page={page}
        onPageChange={setPage}
      />
    </div>
  )
}
