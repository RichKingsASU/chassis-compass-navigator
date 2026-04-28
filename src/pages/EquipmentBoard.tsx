import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Warehouse } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import InventoryTable from '@/features/yard/components/InventoryTable'
import { AddToYardModal, type YardInventoryRow, type YardOption } from '@/features/yard/components/YardModals'

export default function EquipmentBoard() {
  const [yardFilter, setYardFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const { data: yards } = useQuery({
    queryKey: ['yards_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yards')
        .select('id, name, short_code, capacity')
        .order('name')
      if (error) throw error
      return (data ?? []) as Array<YardOption & { capacity: number }>
    },
  })

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['yard_inventory', 'equipment_board'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('*')
        .is('actual_exit_at', null)
        .order('date_in', { ascending: false })
      if (error) throw error
      return (data ?? []) as YardInventoryRow[]
    },
  })

  const yardNameById = useMemo(() => {
    const map: Record<string, string> = {}
    ;(yards ?? []).forEach((y) => (map[y.id] = y.name))
    return map
  }, [yards])

  const yardSummary = useMemo(() => {
    const summary = (yards ?? []).map((y) => {
      const yardRows = (inventory ?? []).filter((r) => r.yard_id === y.id)
      const empty = yardRows.filter((r) => (r.status ?? '').toUpperCase() === 'EMPTY').length
      const loaded = yardRows.filter((r) => (r.status ?? '').toUpperCase() === 'LOADED').length
      const shop = yardRows.filter((r) => (r.status ?? '').toUpperCase() === 'SHOP').length
      const total = yardRows.length
      const availPct = y.capacity > 0 ? Math.round((empty / y.capacity) * 100) : 0
      return { yard: y, total, empty, loaded, shop, availPct }
    })
    return summary
  }, [yards, inventory])

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set((inventory ?? []).map((r) => r.chassis_type).filter((v): v is string => !!v))
      ).sort(),
    [inventory]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (inventory ?? []).filter((r) => {
      if (yardFilter !== 'all' && r.yard_id !== yardFilter) return false
      if (statusFilter !== 'all' && (r.status ?? '').toUpperCase() !== statusFilter)
        return false
      if (typeFilter !== 'all' && r.chassis_type !== typeFilter) return false
      if (q) {
        const haystack = `${r.chassis_number} ${r.container_number ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [inventory, yardFilter, statusFilter, typeFilter, search])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Warehouse className="h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold">Equipment Board</h1>
            <p className="text-muted-foreground mt-2">
              Live yard inventory — find and assign chassis
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add to Yard
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : yardSummary.map((s) => (
              <Card key={s.yard.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{s.yard.name}</div>
                    <span className="text-xs text-muted-foreground">
                      {s.yard.short_code}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Total</div>
                      <div className="text-xl font-bold">
                        {s.total}/{s.yard.capacity}
                      </div>
                    </div>
                    <div>
                      <div className="text-emerald-700 text-xs">EMPTY</div>
                      <div className="text-xl font-bold text-emerald-700">{s.empty}</div>
                    </div>
                    <div>
                      <div className="text-blue-700 text-xs">LOADED</div>
                      <div className="text-xl font-bold text-blue-700">{s.loaded}</div>
                    </div>
                    <div>
                      <div className="text-amber-700 text-xs">SHOP</div>
                      <div className="text-xl font-bold text-amber-700">{s.shop}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Available: {s.availPct}%
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chassis or container"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-[260px]"
          />
        </div>
        <Select value={yardFilter} onValueChange={setYardFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Yard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Yards</SelectItem>
            {(yards ?? []).map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="EMPTY">EMPTY</SelectItem>
            <SelectItem value="LOADED">LOADED</SelectItem>
            <SelectItem value="SHOP">SHOP</SelectItem>
            <SelectItem value="RESERVED">RESERVED</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chassis Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <InventoryTable
          rows={filteredRows}
          showYardColumn
          yardNameById={yardNameById}
        />
      )}

      <AddToYardModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
