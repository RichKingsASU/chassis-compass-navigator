
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ElementType;
  subItems?: { title: string; path: string }[];
}

const SidebarNavigation = () => {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const navItems: NavigationItem[] = [
    { title: "Dashboard", path: "/", icon: LayoutDashboard },
    { title: "Chassis Management", path: "/chassis", icon: Truck },
    
    { 
      title: "TMS Data", 
      path: "/tms", 
      icon: Database,
      subItems: [
        { title: "Mercury Gate", path: "/tms/mercury-gate" },
        { title: "Port Pro", path: "/tms/port-pro" },
      ]
    },
    { 
      title: "Yard Report", 
      path: "/yards", 
      icon: FileText,
      subItems: [
        { title: "PIER S", path: "/yards/pola" },
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

  const toggleGroup = (itemTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  const isGroupOpen = (itemTitle: string) => {
    // Auto-open if current route matches a sub-item
    const item = navItems.find(nav => nav.title === itemTitle);
    if (item?.subItems) {
      const hasActiveSubItem = item.subItems.some(sub => location.pathname === sub.path);
      if (hasActiveSubItem) return true;
    }
    return openGroups[itemTitle] || false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.subItems) {
              // Parent with children - collapsible
              return (
                <Collapsible
                  key={item.title}
                  open={isGroupOpen(item.title)}
                  onOpenChange={() => toggleGroup(item.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="group/collapsible">
                        <item.icon size={18} />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                to={subItem.path}
                                className={location.pathname === subItem.path ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                              >
                                {subItem.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            } else {
              // Regular item without children
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path} 
                      className={location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                    >
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarNavigation;
