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
  ChevronRight,
  Warehouse,
  BarChart3,
  DollarSign,
  Plug,
  Sparkles,
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
    title: 'Operations',
    path: '/unbilled-loads',
    icon: Database,
    subItems: [
      { title: 'Unbilled Loads', path: '/unbilled-loads' },
      { title: 'Active Loads', path: '/active-loads' },
      { title: 'Terminal Events', path: '/terminal-events' },
      { title: 'Mercury Gate', path: '/tms/mercury-gate' },
      { title: 'Port Pro', path: '/tms/port-pro' },
    ],
  },
  {
    title: 'Analytics',
    path: '/utilization',
    icon: BarChart3,
    subItems: [
      { title: 'Chassis Utilization', path: '/utilization' },
      { title: 'Revenue Gap', path: '/billing-exposure' },
      { title: 'Per Diem Recon', path: '/perdiem' },
    ],
  },

  {
    title: 'Chassis Management',
    path: '/chassis',
    icon: Truck,
    subItems: [
      { title: 'Fleet Overview', path: '/chassis/fleet-overview' },
      { title: 'Equipment Board', path: '/chassis/equipment-board' },
      { title: 'Chassis Tracker', path: '/chassis-tracker' },
      { title: 'Repair & Costs', path: '/chassis/repairs' },
    ],
  },
  {
    title: 'Yard Management',
    path: '/yard',
    icon: Warehouse,
    subItems: [
      { title: 'Yard Dashboard', path: '/yard/dashboard' },
      { title: '17th St Yard', path: '/yard/17th' },
      { title: 'JED Yard', path: '/yard/jed' },
      { title: 'Pier S', path: '/yard/pier-s' },
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
  { title: 'Provar', path: '/provar', icon: Plug },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    subItems: [
      { title: 'General', path: '/settings' },
      { title: 'BC Export Config', path: '/settings/bc-export-config' },
    ],
  },
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
        <div className="mt-auto pt-4 border-t">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('ccn:open-ai-chat'))
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
          >
            <Sparkles size={16} />
            Ask AI about your fleet
          </button>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
