
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  unreadNotifications: number;
  pageTitle: string;
}

const DashboardHeader: React.FC<HeaderProps> = ({ unreadNotifications, pageTitle }) => {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center">
        <SidebarTrigger>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SidebarTrigger>
        <h1 className="text-xl font-semibold ml-4">
          {pageTitle}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationsDropdown unreadNotifications={unreadNotifications} />
        <UserDropdown />
      </div>
    </header>
  );
};

const NotificationsDropdown: React.FC<{ unreadNotifications: number }> = ({ unreadNotifications }) => {
  return (
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
  );
};

const UserDropdown: React.FC = () => {
  return (
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
  );
};

export default DashboardHeader;
