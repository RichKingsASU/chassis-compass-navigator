import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type VendorTabKey = 'dashboard' | 'invoices' | 'activity' | 'financials' | 'documents'

export interface VendorTabNavProps {
  vendorSlug: string
  activeTab: VendorTabKey
  onTabChange: (tab: VendorTabKey) => void
  onNewInvoice: () => void
  counts?: Partial<Record<VendorTabKey, number>>
}

const TABS: { key: VendorTabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'activity', label: 'Activity' },
  { key: 'financials', label: 'Financials' },
  { key: 'documents', label: 'Documents' },
]

export function VendorTabNav({ activeTab, onTabChange, onNewInvoice, counts }: VendorTabNavProps) {
  return (
    <div className="flex items-center border-b border-gray-200 mb-6">
      <div className="flex gap-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const count = counts?.[tab.key]
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              {tab.label}
              {typeof count === 'number' && <span className="ml-1 text-xs text-gray-400">({count})</span>}
            </button>
          )
        })}
      </div>
      <Button className="ml-auto mb-2" onClick={onNewInvoice}>+ New Invoice</Button>
    </div>
  )
}
