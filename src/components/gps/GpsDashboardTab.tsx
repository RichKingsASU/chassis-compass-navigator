import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Activity } from "lucide-react";

interface ChassisTracking {
  chassisId: string;
  status: 'active' | 'idle' | 'offline';
  lastPing: string;
  location: string;
  coordinates: string;
  speed?: string;
}

interface GpsDashboardTabProps {
  providerName: string;
}

// Mock data generator for tracked chassis
const generateTrackedChassis = (providerName: string): ChassisTracking[] => {
  const statuses: ('active' | 'idle' | 'offline')[] = ['active', 'idle', 'offline'];
  const locations = [
    { name: 'Port of Los Angeles', coords: '33.7405° N, 118.2720° W' },
    { name: 'Port of Long Beach', coords: '33.7701° N, 118.1937° W' },
    { name: 'Oakland Terminal', coords: '37.7955° N, 122.2832° W' },
    { name: 'Seattle Port', coords: '47.5952° N, 122.3316° W' },
    { name: 'Houston Yard', coords: '29.7604° N, 95.3698° W' },
  ];

  return Array.from({ length: 12 }, (_, i) => {
    const location = locations[i % locations.length];
    const status = statuses[i % statuses.length];
    const minutesAgo = Math.floor(Math.random() * 60);
    
    return {
      chassisId: `${providerName.substring(0, 3).toUpperCase()}${String(1000 + i).padStart(4, '0')}`,
      status,
      lastPing: minutesAgo === 0 ? 'Just now' : `${minutesAgo} min ago`,
      location: location.name,
      coordinates: location.coords,
      speed: status === 'active' ? `${Math.floor(Math.random() * 60)}mph` : undefined,
    };
  });
};

const getStatusBadge = (status: string) => {
  const variants = {
    active: 'default',
    idle: 'secondary',
    offline: 'destructive',
  } as const;

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const GpsDashboardTab: React.FC<GpsDashboardTabProps> = ({ providerName }) => {
  const trackedChassis = generateTrackedChassis(providerName);
  
  const activeCount = trackedChassis.filter(c => c.status === 'active').length;
  const idleCount = trackedChassis.filter(c => c.status === 'idle').length;
  const offlineCount = trackedChassis.filter(c => c.status === 'offline').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Chassis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackedChassis.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Idle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{idleCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{offlineCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chassis Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Chassis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chassis ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Ping</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Speed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackedChassis.map((chassis) => (
                <TableRow key={chassis.chassisId}>
                  <TableCell className="font-medium">{chassis.chassisId}</TableCell>
                  <TableCell>{getStatusBadge(chassis.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {chassis.lastPing}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {chassis.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {chassis.coordinates}
                  </TableCell>
                  <TableCell>
                    {chassis.speed ? (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        {chassis.speed}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GpsDashboardTab;
