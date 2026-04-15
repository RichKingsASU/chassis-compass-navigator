import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import {
  Eye,
  GripVertical,
  ArrowUp,
  ArrowDown,
  X,
  Search,
  SlidersHorizontal,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

export interface ColumnDef {
  key: string
  label: string
  visible?: boolean
  width?: number
  format?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
  align?: 'left' | 'right' | 'center'
}

interface ChassisTableProps {
  data: Record<string, unknown>[]
  columns: ColumnDef[]
  title: string
  loading: boolean
  onViewRow?: (row: Record<string, unknown>) => void
}

type SortDir = 'asc' | 'desc' | null

// Filter-capable columns
const FILTER_COLUMNS = ['status', 'chassis_type', 'chassis_description', 'lessor'] as const
const DATE_FILTER_COLUMN = 'pickup_actual_date'

// ── Sortable Header Cell ─────────────────────────────────────

function SortableHeaderCell({
  col,
  sortKey,
  sortDir,
  onSort,
  pinnedLeft,
  onContextMenu,
  leftOffset,
}: {
  col: ColumnDef
  sortKey: string | null
  sortDir: SortDir
  onSort: (key: string) => void
  pinnedLeft: boolean
  onContextMenu: (e: React.MouseEvent, key: string) => void
  leftOffset?: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col.key })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: col.width ? `${col.width}px` : undefined,
    minWidth: col.width ? `${col.width}px` : '100px',
    ...(pinnedLeft
      ? { position: 'sticky', left: leftOffset ?? 0, zIndex: 20, background: 'var(--background)' }
      : {}),
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        'px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-b select-none',
        pinnedLeft && 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
      )}
      onContextMenu={(e) => onContextMenu(e, col.key)}
    >
      <div className="flex items-center gap-1">
        <button
          className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground/50 hover:text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => onSort(col.key)}
        >
          <span>{col.label}</span>
          {sortKey === col.key && sortDir === 'asc' && <ArrowUp className="h-3 w-3" />}
          {sortKey === col.key && sortDir === 'desc' && <ArrowDown className="h-3 w-3" />}
        </button>
        {pinnedLeft && <Pin className="h-3 w-3 text-blue-500" />}
      </div>
    </th>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ChassisTable({
  data,
  columns,
  title,
  loading,
  onViewRow,
}: ChassisTableProps) {
  const storageKeyVis = `ccn_chassis_table_cols_${title}`
  const storageKeyOrder = `ccn_chassis_table_order_${title}`

  // ── Column visibility ──
  const [colVisibility, setColVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKeyVis)
      if (saved) return JSON.parse(saved)
    } catch {}
    const initial: Record<string, boolean> = {}
    columns.forEach((c) => {
      initial[c.key] = c.visible !== false
    })
    return initial
  })

  // ── Column order ──
  const [colOrder, setColOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyOrder)
      if (saved) return JSON.parse(saved)
    } catch {}
    return columns.map((c) => c.key)
  })

  // ── Column pinning ──
  const [pinnedCols, setPinnedCols] = useState<Set<string>>(new Set())

  // ── Sorting ──
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  // ── Pagination ──
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  // ── Filters ──
  const [globalSearch, setGlobalSearch] = useState('')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  // ── Context menu ──
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; colKey: string } | null>(null)
  const ctxRef = useRef<HTMLDivElement>(null)

  // Persist visibility
  useEffect(() => {
    localStorage.setItem(storageKeyVis, JSON.stringify(colVisibility))
  }, [colVisibility, storageKeyVis])

  // Persist order
  useEffect(() => {
    localStorage.setItem(storageKeyOrder, JSON.stringify(colOrder))
  }, [colOrder, storageKeyOrder])

  // Ensure new columns get added to order
  useEffect(() => {
    const allKeys = columns.map((c) => c.key)
    const missing = allKeys.filter((k) => !colOrder.includes(k))
    if (missing.length > 0) {
      setColOrder((prev) => [...prev, ...missing])
    }
  }, [columns, colOrder])

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null)
    }
    if (ctxMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ctxMenu])

  // Build column lookup
  const colMap = useMemo(() => {
    const m = new Map<string, ColumnDef>()
    columns.forEach((c) => m.set(c.key, c))
    return m
  }, [columns])

  // Ordered visible columns
  const visibleCols = useMemo(() => {
    return colOrder.filter((k) => colVisibility[k] !== false && colMap.has(k)).map((k) => colMap.get(k)!)
  }, [colOrder, colVisibility, colMap])

  // Distinct values for filter dropdowns
  const distinctValues = useMemo(() => {
    const result: Record<string, string[]> = {}
    for (const fc of FILTER_COLUMNS) {
      const vals = new Set<string>()
      data.forEach((row) => {
        const v = row[fc]
        if (v != null && String(v).trim()) vals.add(String(v).trim())
      })
      result[fc] = Array.from(vals).sort()
    }
    return result
  }, [data])

  // ── Filtering ──
  const filtered = useMemo(() => {
    let result = data

    // Global search
    if (globalSearch) {
      const q = globalSearch.toLowerCase()
      result = result.filter((row) =>
        visibleCols.some((col) => {
          const v = row[col.key]
          return v != null && String(v).toLowerCase().includes(q)
        })
      )
    }

    // Per-column filters
    for (const [key, val] of Object.entries(colFilters)) {
      if (val && val !== 'all') {
        result = result.filter((row) => String(row[key] ?? '').trim() === val)
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      result = result.filter((row) => {
        const raw = row[DATE_FILTER_COLUMN]
        if (!raw) return false
        const d = new Date(String(raw))
        if (isNaN(d.getTime())) return false
        if (dateFrom && d < dateFrom) return false
        if (dateTo) {
          const toEnd = new Date(dateTo)
          toEnd.setHours(23, 59, 59, 999)
          if (d > toEnd) return false
        }
        return true
      })
    }

    return result
  }, [data, globalSearch, colFilters, dateFrom, dateTo, visibleCols])

  // ── Sorting ──
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va)
      const sb = String(vb)
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [filtered, sortKey, sortDir])

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = useMemo(() => {
    const start = page * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [globalSearch, colFilters, dateFrom, dateTo, pageSize])

  // ── Handlers ──
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === 'asc') setSortDir('desc')
        else if (sortDir === 'desc') {
          setSortKey(null)
          setSortDir(null)
        }
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey, sortDir]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setColOrder((prev) => {
        const oldIndex = prev.indexOf(String(active.id))
        const newIndex = prev.indexOf(String(over.id))
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  function handleContextMenu(e: React.MouseEvent, colKey: string) {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, colKey })
  }

  function clearAllFilters() {
    setGlobalSearch('')
    setColFilters({})
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const hasActiveFilters =
    globalSearch ||
    Object.values(colFilters).some((v) => v && v !== 'all') ||
    dateFrom ||
    dateTo

  // Compute left offsets for pinned columns
  const pinnedLeftOffsets = useMemo(() => {
    const offsets: Record<string, number> = {}
    let offset = 0
    for (const col of visibleCols) {
      if (pinnedCols.has(col.key)) {
        offsets[col.key] = offset
        offset += col.width || 100
      }
    }
    return offsets
  }, [visibleCols, pinnedCols])

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Global search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search all columns..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background"
          />
        </div>

        {/* Per-column filter dropdowns */}
        {FILTER_COLUMNS.map((fc) => {
          const vals = distinctValues[fc] || []
          if (vals.length === 0) return null
          return (
            <Select
              key={fc}
              value={colFilters[fc] || 'all'}
              onValueChange={(v) => setColFilters((prev) => ({ ...prev, [fc]: v }))}
            >
              <SelectTrigger className="w-36 text-xs">
                <SelectValue placeholder={fc.replace(/_/g, ' ')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {fc.replace(/_/g, ' ')}</SelectItem>
                {vals.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        })}

        {/* Date range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, 'MM/dd') : 'From'}
              {' - '}
              {dateTo ? format(dateTo, 'MM/dd') : 'To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex gap-2 p-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Column visibility toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 max-h-80 overflow-y-auto" align="end">
            <p className="text-sm font-medium mb-2">Toggle columns</p>
            {columns.map((col) => (
              <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer">
                <Checkbox
                  checked={colVisibility[col.key] !== false}
                  onCheckedChange={(checked) =>
                    setColVisibility((prev) => ({ ...prev, [col.key]: !!checked }))
                  }
                />
                <span className="text-sm">{col.label}</span>
              </label>
            ))}
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={clearAllFilters}>
            <X className="h-3.5 w-3.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="border rounded-md overflow-x-auto relative">
        {data.length === 0 ? (
          <EmptyState
            title="No data available"
            description="There are no chassis records to display."
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No matching results"
            description="Try adjusting your filters or search term."
            actionLabel="Clear Filters"
            onAction={clearAllFilters}
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full text-sm">
              <thead>
                <SortableContext
                  items={visibleCols.map((c) => c.key)}
                  strategy={horizontalListSortingStrategy}
                >
                  <tr>
                    {visibleCols.map((col) => (
                      <SortableHeaderCell
                        key={col.key}
                        col={col}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                        pinnedLeft={pinnedCols.has(col.key)}
                        onContextMenu={handleContextMenu}
                        leftOffset={pinnedLeftOffsets[col.key]}
                      />
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-b w-16">
                      Actions
                    </th>
                  </tr>
                </SortableContext>
              </thead>
              <tbody>
                {paged.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onViewRow?.(row)}
                  >
                    {visibleCols.map((col) => {
                      const isPinned = pinnedCols.has(col.key)
                      const cellStyle: React.CSSProperties = isPinned
                        ? {
                            position: 'sticky',
                            left: pinnedLeftOffsets[col.key] ?? 0,
                            zIndex: 10,
                            background: 'var(--background)',
                          }
                        : {}
                      const raw = row[col.key]
                      const display = col.format
                        ? col.format(raw, row)
                        : raw != null
                          ? String(raw)
                          : 'N/A'
                      return (
                        <td
                          key={col.key}
                          style={{
                            ...cellStyle,
                            width: col.width ? `${col.width}px` : undefined,
                            minWidth: col.width ? `${col.width}px` : undefined,
                          }}
                          className={cn(
                            'px-3 py-2 whitespace-nowrap text-sm',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                            isPinned && 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                          )}
                        >
                          {display}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => { e.stopPropagation(); onViewRow?.(row) }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DndContext>
        )}
      </div>

      {/* ── Pagination ── */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Context Menu (right-click on column header) ── */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="fixed z-[100] bg-popover border rounded-md shadow-md py-1 min-w-[140px]"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          {pinnedCols.has(ctxMenu.colKey) ? (
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
              onClick={() => {
                setPinnedCols((prev) => {
                  const next = new Set(prev)
                  next.delete(ctxMenu.colKey)
                  return next
                })
                setCtxMenu(null)
              }}
            >
              <PinOff className="h-3.5 w-3.5" />
              Unpin
            </button>
          ) : (
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
              onClick={() => {
                setPinnedCols((prev) => new Set(prev).add(ctxMenu.colKey))
                setCtxMenu(null)
              }}
            >
              <Pin className="h-3.5 w-3.5" />
              Pin Left
            </button>
          )}
        </div>
      )}
    </div>
  )
}
