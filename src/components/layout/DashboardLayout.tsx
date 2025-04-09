
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar";
import SidebarNavigation from './SidebarNavigation';
import DashboardHeader from './DashboardHeader';
import { getPageTitle } from '@/utils/navigationHelpers';
import { 
  LayoutDashboard, 
  Truck, 
  FileCheck, 
  Upload, 
  Settings, 
  MapPin,
  Database,
  FileText
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Chassis Management", path: "/chassis", icon: Truck },
  { title: "Document Upload", path: "/documents", icon: Upload },
  { title: "TMS Data", path: "/tms", icon: Database },
  { 
    title: "Yard Report", 
    path: "/yards", 
    icon: FileText,
    subItems: [
      { title: "POLA YARD", path: "/yards/pola" },
      { title: "JED YARD", path: "/yards/jed" },
    ] 
  },
  { 
    title: "GPS Providers", 
    path: "/gps", 
    icon: MapPin,
    subItems: [
      { title: "Samsara", path: "/gps/samsara" },
      { title: "BlackBerry Radar", path: "/gps/blackberry" },
      { title: "Fleetview", path: "/gps/fleetview" },
      { title: "Fleetlocate", path: "/gps/fleetlocate" },
      { title: "Anytrek", path: "/gps/anytrek" },
    ] 
  },
  { 
    title: "Vendor Validation", 
    path: "/validation", 
    icon: FileCheck,
    subItems: [
      { title: "DCLI", path: "/vendors/dcli" },
      { title: "CCM", path: "/vendors/ccm" },
      { title: "SCSPA", path: "/vendors/scspa" },
      { title: "WCCP", path: "/vendors/wccp" },
      { title: "TRAC", path: "/vendors/trac" },
      { title: "FLEXIVAN", path: "/vendors/flexivan" },
    ]
  },
  { title: "Settings", path: "/settings", icon: Settings },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  
  const pageTitle = getPageTitle(location.pathname, navItems);

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

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader 
            unreadNotifications={unreadNotifications} 
            pageTitle={pageTitle} 
          />
          
          <main className="flex-1 overflow-auto bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
