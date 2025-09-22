
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Truck, 
  Map, 
  FileCheck, 
  Upload, 
  Settings, 
  MapPin,
  Database,
  FileText,
  Sparkles
} from 'lucide-react';

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ElementType;
  subItems?: { title: string; path: string }[];
}

const SidebarNavigation = () => {
  const location = useLocation();

  const navItems: NavigationItem[] = [
    { title: "Dashboard", path: "/", icon: LayoutDashboard },
    { title: "Chassis Management", path: "/chassis", icon: Truck },
    
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
    { title: "Advanced Features", path: "/advanced-features", icon: Sparkles },
    { title: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link 
                  to={item.path} 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              
              {item.subItems && (
                <div className="pl-7 space-y-1 mt-1">
                  {item.subItems.map(subItem => (
                    <Link
                      key={subItem.title}
                      to={subItem.path}
                      className={`text-sm py-1.5 px-3 rounded-md block transition-colors 
                        ${location.pathname === subItem.path 
                          ? 'bg-sidebar-accent/30 text-sidebar-foreground' 
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/20'}`}
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarNavigation;
