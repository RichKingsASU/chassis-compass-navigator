import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, LayoutDashboard, FileText, Activity, BarChart3, FolderOpen } from 'lucide-react'

export type VendorTabKey = 'dashboard' | 'invoices' | 'activity' | 'financials' | 'documents'

export interface VendorTabNavProps {
  vendorSlug: string
  activeTab: VendorTabKey
  onTabChange: (tab: VendorTabKey) => void
  onNewInvoice: () => void
  counts?: Partial<Record<VendorTabKey, number>>
}

const TABS: { key: VendorTabKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'financials', label: 'Financials', icon: BarChart3 },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
]

export function VendorTabNav({ activeTab, onTabChange, onNewInvoice, counts }: VendorTabNavProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-muted pb-4 mb-8">
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const count = counts?.[tab.key]
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon size={14} strokeWidth={isActive ? 3 : 2} />
              {tab.label}
              {typeof count === 'number' && count > 0 && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-md text-[9px]',
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <Button 
        className="gap-2 font-black text-[10px] uppercase tracking-widest px-8 h-10 shadow-xl shadow-primary/20" 
        onClick={onNewInvoice}
      >
        <Plus size={14} strokeWidth={3} />
        New Invoice
      </Button>
    </div>
  )
}
