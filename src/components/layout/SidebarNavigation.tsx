import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenuSub,
  SidebarMenuSubItem, SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  LayoutDashboard, Truck, FileCheck, Settings, MapPin, Database,
  ChevronRight, Warehouse, BarChart3, LayoutGrid, PlusCircle,
  FileText, Activity, TrendingUp, FolderOpen, DollarSign,
} from 'lucide-react'

interface SubItem { title: string; path: string }
interface NavigationItem {
  title: string; path: string; icon: React.ElementType
  subItems?: SubItem[]
}

interface VendorChildItem {
  key: string; title: string; relativePath: string
  icon: React.ElementType; isAction?: boolean
}
interface VendorNavConfig {
  label: string; basePath: string; children: VendorChildItem[]
}

const VENDOR_CONFIGS: VendorNavConfig[] = [
  {
    label: 'DCLI', basePath: '/vendors/dcli',
    children: [
      { key: 'dashboard',   title: 'Dashboard',       relativePath: '',              icon: LayoutGrid },
      { key: 'new-invoice', title: '+ New Invoice',   relativePath: '/invoices/new', icon: PlusCircle, isAction: true },
      { key: 'invoices',    title: 'Invoice Tracker', relativePath: '/invoices',     icon: FileText },
      { key: 'activity',    title: 'Activity',        relativePath: '/activity',     icon: Activity },
      { key: 'financials',  title: 'Financials',      relativePath: '/financials',   icon: TrendingUp },
      { key: 'documents',   title: 'Documents',       relativePath: '/documents',    icon: FolderOpen },
    ],
  },
  {
    label: 'CCM', basePath: '/vendors/ccm',
    children: [
      { key: 'dashboard',   title: 'Dashboard',       relativePath: '',              icon: LayoutGrid },
      { key: 'new-invoice', title: '+ New Invoice',   relativePath: '/invoices/new', icon: PlusCircle, isAction: true },
      { key: 'invoices',    title: 'Invoice Tracker', relativePath: '/invoices',     icon: FileText },
      { key: 'activity',    title: 'Activity',        relativePath: '/activity',     icon: Activity },
      { key: 'documents',   title: 'Documents',       relativePath: '/documents',    icon: FolderOpen },
    ],
  },
  {
    label: 'SCSPA', basePath: '/vendors/scspa',
    children: [
      { key: 'dashboard',   title: 'Dashboard',       relativePath: '',              icon: LayoutGrid },
      { key: 'new-invoice', title: '+ New Invoice',   relativePath: '/invoices/new', icon: PlusCircle, isAction: true },
      { key: 'invoices',    title: 'Invoice Tracker', relativePath: '/invoices',     icon: FileText },
      { key: 'activity',    title: 'Activity',        relativePath: '/activity',     icon: Activity },
      { key: 'documents',   title: 'Documents',       relativePath: '/documents',    icon: FolderOpen },
    ],
  },
  {
    label: 'TRAC', basePath: '/vendors/trac',
    children: [
      { key: 'dashboard',   title: 'Dashboard',       relativePath: '',              icon: LayoutGrid },
      { key: 'new-invoice', title: '+ New Invoice',   relativePath: '/invoices/new', icon: PlusCircle, isAction: true },
      { key: 'invoices',    title: 'Invoice Tracker', relativePath: '/invoices',     icon: FileText },
      { key: 'activity',    title: 'Activity',        relativePath: '/activity',     icon: Activity },
      { key: 'financials',  title: 'Financials',      relativePath: '/financials',   icon: TrendingUp },
      { key: 'documents',   title: 'Documents',       relativePath: '/documents',    icon: FolderOpen },
    ],
  },
  {
    label: 'FLEXIVAN', basePath: '/vendors/flexivan',
    children: [
      { key: 'dashboard',   title: 'Dashboard',       relativePath: '',              icon: LayoutGrid },
      { key: 'new-invoice', title: '+ New Invoice',   relativePath: '/invoices/new', icon: PlusCircle, isAction: true },
      { key: 'invoices',    title: 'Invoice Tracker', relativePath: '/invoices',     icon: FileText },
      { key: 'activity',    title: 'Activity',        relativePath: '/activity',     icon: Activity },
      { key: 'documents',   title: 'Documents',       relativePath: '/documents',    icon: FolderOpen },
    ],
  },
  {
    label: 'WCCP', basePath: '/vendors/wccp',
    children: [
      { key: 'dashboard',   title: 'Dashboard',       relativePath: '',              icon: LayoutGrid },
      { key: 'new-invoice', title: '+ New Invoice',   relativePath: '/invoices/new', icon: PlusCircle, isAction: true },
      { key: 'invoices',    title: 'Invoice Tracker', relativePath: '/invoices',     icon: FileText },
      { key: 'activity',    title: 'Activity',        relativePath: '/activity',     icon: Activity },
      { key: 'financials',  title: 'Financials',      relativePath: '/financials',   icon: TrendingUp },
      { key: 'documents',   title: 'Documents',       relativePath: '/documents',    icon: FolderOpen },
    ],
  },
]

const topNavItems: NavigationItem[] = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    title: 'Chassis Management', path: '/chassis', icon: Truck,
    subItems: [
      { title: 'Fleet List',      path: '/chassis' },
      { title: 'Overview',        path: '/chassis/overview' },
      { title: 'Long Term',       path: '/chassis/long-term' },
      { title: 'Short Term',      path: '/chassis/short-term' },
      { title: 'Chassis Locator', path: '/chassis/locator' },
    ],
  },
  {
    title: 'TMS Data', path: '/tms', icon: Database,
    subItems: [
      { title: 'Mercury Gate', path: '/tms/mercury-gate' },
      { title: 'Port Pro',     path: '/tms/port-pro' },
      { title: 'Active Loads', path: '/active-loads' },
      { title: 'Unbilled Loads', path: '/unbilled-loads' },
    ],
  },
  {
    title: 'Finance', path: '/perdiem-reconciliation', icon: DollarSign,
    subItems: [
      { title: 'Per Diem Reconciliation', path: '/perdiem-reconciliation' },
    ],
  },
  { title: 'Utilization',     path: '/utilization', icon: BarChart3 },
  { title: 'Yard Management', path: '/yard',         icon: Warehouse },
  {
    title: 'GPS Providers', path: '/gps', icon: MapPin,
    subItems: [
      { title: 'Overview',          path: '/gps' },
      { title: 'Samsara',           path: '/gps/samsara' },
      { title: 'BlackBerry Radar',  path: '/gps/blackberry' },
      { title: 'Fleetview',         path: '/gps/fleetview' },
      { title: 'Fleetlocate',       path: '/gps/fleetlocate' },
      { title: 'Anytrek',           path: '/gps/anytrek' },
    ],
  },
  { title: 'Settings', path: '/settings', icon: Settings },
]

function extractInvoiceId(pathname: string, basePath: string): string | null {
  const prefix = `${basePath}/invoices/`
  if (!pathname.startsWith(prefix)) return null
  const segment = pathname.slice(prefix.length).split('/')[0]
  if (!segment || segment === 'new') return null
  return segment
}

interface VendorNavItemProps {
  vendor: VendorNavConfig; isOpen: boolean
  onToggle: () => void; pathname: string
}

function VendorNavItem({ vendor, isOpen, onToggle, pathname }: VendorNavItemProps) {
  const isVendorActive = pathname.startsWith(vendor.basePath)
  const invoiceId = extractInvoiceId(pathname, vendor.basePath)
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className={isVendorActive ? 'font-semibold' : ''}>
            <FileCheck size={16} />
            <span>{vendor.label}</span>
            <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {vendor.children.map((child) => {
              const fullPath = `${vendor.basePath}${child.relativePath}`
              const isActive = child.key === 'invoices'
                ? pathname.startsWith(fullPath) && !pathname.endsWith('/new')
                : pathname === fullPath
              return (
                <SidebarMenuSubItem key={child.key}>
                  <SidebarMenuSubButton asChild>
                    <Link to={fullPath} className={[
                      'flex items-center gap-2',
                      child.isAction ? 'text-primary font-medium' : '',
                      isActive && !child.isAction ? 'bg-sidebar-accent text-sidebar-accent-foreground' : '',
                    ].filter(Boolean).join(' ')}>
                      <child.icon size={14} />
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                  {child.key === 'invoices' && invoiceId && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link
                            to={`${vendor.basePath}/invoices/${invoiceId}/detail`}
                            className={['flex items-center gap-2 text-xs',
                              pathname.includes(`/invoices/${invoiceId}/`)
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-muted-foreground',
                            ].join(' ')}>
                            <FileText size={12} />
                            <span>Invoice Details</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export default function SidebarNavigation() {
  const { pathname } = useLocation()
  const initialOpen: Record<string, boolean> = {}
  for (const v of VENDOR_CONFIGS) {
    if (pathname.startsWith(v.basePath)) initialOpen[v.label] = true
  }
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen)
  const toggleGroup = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
  const isTopGroupOpen = (item: NavigationItem) =>
    item.subItems?.some(s => pathname.startsWith(s.path)) || openGroups[item.title] || false

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {topNavItems.map(item => {
              if (item.subItems) {
                return (
                  <Collapsible key={item.title} open={isTopGroupOpen(item)}
                    onOpenChange={() => toggleGroup(item.title)}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon size={18} />
                          <span>{item.title}</span>
                          <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${isTopGroupOpen(item) ? 'rotate-90' : ''}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map(sub => (
                            <SidebarMenuSubItem key={sub.path}>
                              <SidebarMenuSubButton asChild>
                                <Link to={sub.path}
                                  className={pathname === sub.path ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}>
                                  {sub.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path}
                      className={pathname === item.path ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}>
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Equipment Vendor</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {VENDOR_CONFIGS.map(vendor => (
              <VendorNavItem key={vendor.label} vendor={vendor}
                isOpen={openGroups[vendor.label] ?? false}
                onToggle={() => toggleGroup(vendor.label)}
                pathname={pathname} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
