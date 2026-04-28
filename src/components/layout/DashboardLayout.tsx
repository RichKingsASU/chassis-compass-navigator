import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarProvider, Sidebar, SidebarContent } from '@/components/ui/sidebar'
import SidebarNavigation from './SidebarNavigation'
import DashboardHeader from './DashboardHeader'
import AIChatPanel from './AIChatPanel'
import { getPageTitle } from '@/utils/navigationHelpers'
import {
  LayoutDashboard,
  Truck,
  FileCheck,
  Settings,
  MapPin,
  Database,
  Warehouse,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Chassis Management', path: '/chassis', icon: Truck },
  { title: 'Utilization', path: '/utilization', icon: BarChart3 },
  { title: 'TMS Data', path: '/tms', icon: Database },
  { title: 'Yard Management', path: '/yard', icon: Warehouse },
  {
    title: 'GPS Providers',
    path: '/gps',
    icon: MapPin,
    subItems: [
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
      { title: 'DCLI', path: '/vendors/dcli' },
      { title: 'CCM', path: '/vendors/ccm' },
      { title: 'SCSPA', path: '/vendors/scspa' },
      { title: 'WCCP', path: '/vendors/wccp' },
      { title: 'TRAC', path: '/vendors/trac' },
      { title: 'FLEXIVAN', path: '/vendors/flexivan' },
    ],
  },
  { title: 'Settings', path: '/settings', icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const pageTitle = getPageTitle(
    location.pathname,
    navItems,
    location.state as { title?: string } | null
  )

  useEffect(() => {
    const handler = () => setIsChatOpen(true)
    window.addEventListener('ccn:open-ai-chat', handler)
    return () => window.removeEventListener('ccn:open-ai-chat', handler)
  }, [])

  const contextString =
    'Fleet summary: 12,168 chassis tracked, 951 unbilled loads at $987K risk, 9,217 dormant chassis burning $92K in idle lease costs, $3M revenue gap at 7.2%'

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <div className="flex items-center gap-2 px-4 py-4 border-b">
            <div className="bg-primary h-8 w-8 rounded-md flex items-center justify-center text-primary-foreground font-bold">
              CC
            </div>
            <div className="font-semibold text-lg">Chassis Compass</div>
          </div>
          <SidebarContent>
            <SidebarNavigation />
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
            pageTitle={pageTitle}
          />
          <main className="flex-1 bg-muted/30">{children}</main>
        </div>
      </div>
      <AIChatPanel
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={contextString}
      />
    </SidebarProvider>
  )
}
