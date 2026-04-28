import { Badge } from '@/components/ui/badge'

export type InventoryStatusValue = 'EMPTY' | 'LOADED' | 'SHOP' | 'RESERVED' | string

const STATUS_CLASSES: Record<string, string> = {
  EMPTY: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  LOADED: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  SHOP: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  RESERVED: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
}

export function YardStatusBadge({ status }: { status: InventoryStatusValue | null | undefined }) {
  const value = (status ?? '').toString().toUpperCase()
  const cls = STATUS_CLASSES[value] || 'bg-gray-100 text-gray-800 border-gray-200'
  return (
    <Badge variant="outline" className={cls}>
      {value || 'UNKNOWN'}
    </Badge>
  )
}

const CHASSIS_STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  OFFHIRED: 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-200',
  STOLEN: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
}

export function ChassisStatusBadge({ status }: { status: string | null | undefined }) {
  const value = (status ?? '').toString().toUpperCase()
  const cls = CHASSIS_STATUS_CLASSES[value] || 'bg-gray-100 text-gray-800 border-gray-200'
  return (
    <Badge variant="outline" className={cls}>
      {value || 'UNKNOWN'}
    </Badge>
  )
}

export function DirectionBadge({ direction }: { direction: string | null | undefined }) {
  const value = (direction ?? '').toString().toUpperCase()
  const isIn = value === 'IN' || value === 'INBOUND'
  const isOut = value === 'OUT' || value === 'OUTBOUND'
  const cls = isIn
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
    : isOut
    ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'
    : 'bg-gray-100 text-gray-800 border-gray-200'
  return (
    <Badge variant="outline" className={cls}>
      {value || 'N/A'}
    </Badge>
  )
}
