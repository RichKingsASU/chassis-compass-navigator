
import React, { useState } from 'react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Truck, 
  Map, 
  FileCheck, 
  Upload, 
  Users, 
  Settings, 
  Menu,
  MapPin,
  Bell,
  Database,
  FileText
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  const navItems = [
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
    { title: "Document Upload", path: "/documents", icon: Upload },
    { title: "Settings", path: "/settings", icon: Settings },
  ];

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
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b bg-background flex items-center justify-between px-4">
            <div className="flex items-center">
              <SidebarTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
              <h1 className="text-xl font-semibold ml-4">
                {navItems.find(item => 
                  item.path === location.pathname || 
                  (item.subItems && item.subItems.some(sub => sub.path === location.pathname))
                )?.title || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-auto">
                    <DropdownMenuItem className="cursor-pointer flex flex-col items-start py-3">
                      <div className="text-sm font-medium">Pending validation for DCLI</div>
                      <div className="text-xs text-muted-foreground mt-1">5 chassis require validation</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer flex flex-col items-start py-3">
                      <div className="text-sm font-medium">GPS signal lost</div>
                      <div className="text-xs text-muted-foreground mt-1">Chassis ID: ABCU1234567 has not reported in 24 hours</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer flex flex-col items-start py-3">
                      <div className="text-sm font-medium">Document uploaded</div>
                      <div className="text-xs text-muted-foreground mt-1">TRAC invoice uploaded by John Smith</div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Preferences</DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
