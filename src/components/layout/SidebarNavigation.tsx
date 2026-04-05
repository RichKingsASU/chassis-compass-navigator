import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  LayoutDashboard,
  Truck,
  FileCheck,
  Settings,
  MapPin,
  Database,
  FileText,
  ChevronRight,
  Warehouse,
  BarChart3,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'

interface NavigationItem {
  title: string
  path: string
  icon: React.ElementType
  subItems?: { title: string; path: string }[]
}

const navItems: NavigationItem[] = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    title: 'Chassis Management',
    path: '/chassis',
    icon: Truck,
    subItems: [
      { title: 'Overview', path: '/chassis' },
      { title: 'Chassis Locator', path: '/chassis/locator' },
    ],
  },
  {
    title: 'TMS Data',
    path: '/tms',
    icon: Database,
    subItems: [
      { title: 'Mercury Gate', path: '/tms/mercury-gate' },
      { title: 'Port Pro', path: '/tms/port-pro' },
      { title: 'Active Loads', path: '/active-loads' },
      { title: 'Unbilled Loads', path: '/unbilled-loads' },
    ],
  },
  {
    title: 'Finance',
    path: '/perdiem-reconciliation',
    icon: DollarSign,
    subItems: [
      { title: 'Per Diem Reconciliation', path: '/perdiem-reconciliation' },
    ],
  },
  {
    title: 'Yard Report',
    path: '/yards',
    icon: FileText,
    subItems: [
      { title: 'Overview', path: '/yards' },
      { title: 'PIER S', path: '/yards/pola' },
      { title: 'JED YARD', path: '/yards/jed' },
    ],
  },
  { title: 'Utilization', path: '/utilization', icon: BarChart3 },
  { title: 'Yard Management', path: '/yard', icon: Warehouse },
  {
    title: 'GPS Providers',
    path: '/gps',
    icon: MapPin,
    subItems: [
      { title: 'Overview', path: '/gps' },
      { title: 'Samsara', path: '/gps/samsara' },
      { title: 'BlackBerry Radar', path: '/gps/blackberry' },
      { title: 'Fleetview', path: '/gps/fleetview' },
      { title: 'Fleetlocate', path: '/gps/fleetlocate' },
      { title: 'Anytrek', path: '/gps/anytrek' },
    ],
  },
  {
    title: 'Equipment Vendor',
    path: '/validation',
    icon: FileCheck,
    subItems: [
      { title: 'Overview', path: '/vendor-validation' },
      { title: 'DCLI', path: '/vendors/dcli' },
      { title: 'CCM', path: '/vendors/ccm' },
      { title: 'SCSPA', path: '/vendors/scspa' },
      { title: 'TRAC', path: '/vendors/trac' },
      { title: 'FLEXIVAN', path: '/vendors/flexivan' },
      { title: 'WCCP', path: '/vendors/wccp' },
    ],
  },
  { title: 'Settings', path: '/settings', icon: Settings },
]

export default function SidebarNavigation() {
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const isGroupOpen = (item: NavigationItem) => {
    if (item.subItems?.some((sub) => location.pathname === sub.path)) return true
    return openGroups[item.title] || false
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.subItems) {
              return (
                <Collapsible
                  key={item.title}
                  open={isGroupOpen(item)}
                  onOpenChange={() => toggleGroup(item.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <item.icon size={18} />
                        <span>{item.title}</span>
                        <ChevronRight
                          className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                            isGroupOpen(item) ? 'rotate-90' : ''
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subItems.map((sub) => (
                          <SidebarMenuSubItem key={sub.path}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                to={sub.path}
                                className={
                                  location.pathname === sub.path
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : ''
                                }
                              >
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
                  <Link
                    to={item.path}
                    className={
                      location.pathname === item.path
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : ''
                    }
                  >
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
  )
}
