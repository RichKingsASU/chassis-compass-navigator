
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import KPICard from "@/components/ccm/KPICard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, FileX, Eye } from 'lucide-react';

const ChassisManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [chassisData, setChassisData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    chassisType: 'all',
    lessor: 'all',
    region: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchChassisData();
  }, []);

  const fetchChassisData = async () => {
    try {
      setLoading(true);
      
      // Fetch from MCL master chassis list
      const { data: mclData, error: mclError } = await supabase
        .from('mcl_master_chassis_list')
        .select('*')
        .order('forrest_chz', { ascending: true });

      if (mclError) {
        console.error('Error fetching MCL data:', mclError);
        toast({
          title: "Warning",
          description: "Failed to load MCL chassis data. Showing assets table only.",
          variant: "destructive",
        });
      }

      // Fetch from assets table
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .order('identifier', { ascending: true });

      if (assetsError) throw assetsError;

      // Combine and enrich data
      const enrichedData = (assetsData || []).map(asset => {
        const mclMatch = (mclData || []).find(
          mcl => mcl.forrest_chz === asset.identifier || 
                 mcl.serial === asset.identifier
        );
        return {
          ...asset,
          mcl_data: mclMatch || null,
        };
      });

      // Add MCL records that don't have matching assets
      const mclOnlyData = (mclData || [])
        .filter(mcl => !enrichedData.some(
          asset => asset.identifier === mcl.forrest_chz || asset.identifier === mcl.serial
        ))
        .map(mcl => ({
          id: `mcl-${mcl.id}`,
          identifier: mcl.forrest_chz,
          type: mcl.forrest_chassis_type,
          asset_class: mcl.chassis_category,
          mcl_data: mcl,
        }));

      setChassisData([...enrichedData, ...mclOnlyData]);
    } catch (error) {
      console.error('Error fetching chassis data:', error);
      toast({
        title: "Error",
        description: "Failed to load chassis data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredChassis = chassisData.filter(chassis => {
    // Search term filter
    if (searchTerm && 
        !chassis.identifier?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Dropdown filters
    if (selectedFilters.chassisType !== 'all' && chassis.type !== selectedFilters.chassisType) {
      return false;
    }
    
    return true;
  });

  const resetFilters = () => {
    setSelectedFilters({
      chassisType: 'all',
      lessor: 'all',
      region: 'all',
      status: 'all',
    });
    setSearchTerm('');
  };

  const metrics = useMemo(() => {
    const total = chassisData.length;
    
    // Count by status
    const byStatus = chassisData.reduce((acc, c) => {
      const status = c.mcl_data?.chassis_status || c.current_status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const outOfService = byStatus['Out of Service'] || 0;
    const active = byStatus['Active'] || 0;
    const available = byStatus['Available'] || 0;
    const maintenance = byStatus['Maintenance'] || 0;
    
    // Count by type
    const byType = chassisData.reduce((acc, c) => {
      const type = c.type || c.mcl_data?.forrest_chassis_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort types by count descending
    const typeBreakdown = Object.entries(byType)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 6); // Top 6 types

    return {
      total,
      outOfService,
      active,
      available,
      maintenance,
      operational: total - outOfService,
      byType: typeBreakdown,
      byStatus,
    };
  }, [chassisData]);

  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <h1 className="dash-title">Chassis Management</h1>
      </div>

      {/* Status Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard 
          title="Total Chassis" 
          value={metrics.total.toString()} 
          description="In fleet" 
          icon="chart" 
        />
        <KPICard 
          title="Operational" 
          value={metrics.operational.toString()} 
          description={`${((metrics.operational / metrics.total) * 100).toFixed(1)}% of fleet`}
          icon="users" 
        />
        <KPICard 
          title="Out of Service" 
          value={metrics.outOfService.toString()} 
          description={`${((metrics.outOfService / metrics.total) * 100).toFixed(1)}% of fleet`}
          icon="alert" 
        />
        <KPICard 
          title="Active" 
          value={metrics.active.toString()} 
          description={`${metrics.available} Available`}
          icon="file" 
        />
      </div>

      {/* Chassis Type Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chassis Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.byType.map(([type, count]) => {
              const countNum = count as number;
              return (
                <div key={type} className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{countNum}</div>
                  <div className="text-sm text-muted-foreground">{type}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {((countNum / metrics.total) * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-medium">Chassis List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Chassis ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" className="gap-2" onClick={resetFilters}>
                <FileX size={16} />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Chassis Type</Label>
              <Select
                value={selectedFilters.chassisType} 
                onValueChange={(value) => setSelectedFilters({...selectedFilters, chassisType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Array.from(new Set(chassisData.map(c => c.type).filter(Boolean))).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Lessor</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      Loading chassis data...
                    </TableCell>
                  </TableRow>
                ) : filteredChassis.length > 0 ? (
                  filteredChassis.map((chassis) => (
                    <TableRow key={chassis.id}>
                      <TableCell className="font-medium">{chassis.identifier || 'N/A'}</TableCell>
                      <TableCell>{chassis.type || chassis.mcl_data?.forrest_chassis_type || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{chassis.asset_class || chassis.mcl_data?.chassis_category || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{chassis.mcl_data?.lessor || 'N/A'}</TableCell>
                      <TableCell>{chassis.mcl_data?.region || 'N/A'}</TableCell>
                      <TableCell>
                        {chassis.mcl_data?.chassis_status ? (
                          <Badge variant={chassis.mcl_data.chassis_status === 'Active' ? 'default' : 'secondary'}>
                            {chassis.mcl_data.chassis_status}
                          </Badge>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{chassis.mcl_data?.daily_rate ? `$${chassis.mcl_data.daily_rate}` : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => navigate(`/chassis/${encodeURIComponent(chassis.identifier || chassis.id)}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No chassis found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChassisManagement;
