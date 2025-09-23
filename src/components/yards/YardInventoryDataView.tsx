import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  MapPin,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck
} from "lucide-react";

// Mock chassis inventory data
const mockChassisData = [
  {
    id: "CMAU1234567",
    size: "40'",
    type: "Dry Van",
    location: "Section A-12",
    zone: "A",
    row: 12,
    status: "Available",
    condition: "Good",
    lastUpdated: "2024-12-20T10:30:00Z",
    lastInspection: "2024-12-15T09:00:00Z",
    daysInYard: 5,
    owner: "CAI",
    gpsEnabled: true,
    reservedBy: null,
    reservationDate: null,
    estimatedDeparture: null,
    maintenanceNotes: null,
    inspectionScore: 9.2,
    utilization: "High",
    yearBuilt: 2019,
    weight: 4500,
    maxCapacity: 67500
  },
  {
    id: "TCLU7654321",
    size: "20'",
    type: "Dry Van", 
    location: "Section B-05",
    zone: "B",
    row: 5,
    status: "Reserved",
    condition: "Good",
    lastUpdated: "2024-12-20T09:15:00Z",
    lastInspection: "2024-12-18T14:00:00Z",
    daysInYard: 2,
    owner: "TRAC",
    gpsEnabled: true,
    reservedBy: "ABC Logistics",
    reservationDate: "2024-12-20T08:00:00Z",
    estimatedDeparture: "2024-12-21T10:00:00Z",
    maintenanceNotes: null,
    inspectionScore: 8.8,
    utilization: "Medium",
    yearBuilt: 2020,
    weight: 3200,
    maxCapacity: 30480
  },
  {
    id: "FSCU5555123",
    size: "45'",
    type: "High Cube",
    location: "Section C-08",
    zone: "C",
    row: 8,
    status: "Maintenance",
    condition: "Needs Repair",
    lastUpdated: "2024-12-20T07:45:00Z",
    lastInspection: "2024-12-19T11:30:00Z",
    daysInYard: 8,
    owner: "Flexi-Van",
    gpsEnabled: false,
    reservedBy: null,
    reservationDate: null,
    estimatedDeparture: "2024-12-22T16:00:00Z",
    maintenanceNotes: "Brake system needs repair, tire replacement required",
    inspectionScore: 6.1,
    utilization: "Low",
    yearBuilt: 2017,
    weight: 5100,
    maxCapacity: 73000
  },
  {
    id: "NYKU9876543",
    size: "40'",
    type: "Refrigerated",
    location: "Section A-07",
    zone: "A",
    row: 7,
    status: "Available",
    condition: "Excellent",
    lastUpdated: "2024-12-20T11:00:00Z",
    lastInspection: "2024-12-19T16:00:00Z",
    daysInYard: 1,
    owner: "NYK",
    gpsEnabled: true,
    reservedBy: null,
    reservationDate: null,
    estimatedDeparture: null,
    maintenanceNotes: null,
    inspectionScore: 9.8,
    utilization: "High",
    yearBuilt: 2021,
    weight: 6200,
    maxCapacity: 67500
  },
  {
    id: "APHU1122334",
    size: "20'",
    type: "Flat Rack",
    location: "Section B-15",
    zone: "B",
    row: 15,
    status: "In Transit",
    condition: "Good",
    lastUpdated: "2024-12-20T08:30:00Z",
    lastInspection: "2024-12-17T10:15:00Z",
    daysInYard: 3,
    owner: "APL",
    gpsEnabled: true,
    reservedBy: "XYZ Shipping",
    reservationDate: "2024-12-19T14:00:00Z",
    estimatedDeparture: "2024-12-20T15:00:00Z",
    maintenanceNotes: null,
    inspectionScore: 8.5,
    utilization: "Medium",
    yearBuilt: 2018,
    weight: 4100,
    maxCapacity: 45000
  }
];

interface FilterState {
  search: string;
  status: string;
  condition: string;
  size: string;
  type: string;
  zone: string;
  owner: string;
  gpsEnabled: string;
  utilizationLevel: string;
  daysInYardMin: string;
  daysInYardMax: string;
  inspectionScoreMin: string;
  inspectionScoreMax: string;
  yearBuiltMin: string;
  yearBuiltMax: string;
}

const YardInventoryDataView = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    condition: 'all',
    size: 'all',
    type: 'all',
    zone: 'all',
    owner: 'all',
    gpsEnabled: 'all',
    utilizationLevel: 'all',
    daysInYardMin: '',
    daysInYardMax: '',
    inspectionScoreMin: '',
    inspectionScoreMax: '',
    yearBuiltMin: '',
    yearBuiltMax: ''
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filteredData = useMemo(() => {
    return mockChassisData.filter(chassis => {
      // Search filter
      if (filters.search && !chassis.id.toLowerCase().includes(filters.search.toLowerCase()) &&
          !chassis.location.toLowerCase().includes(filters.search.toLowerCase()) &&
          !chassis.owner.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && chassis.status.toLowerCase() !== filters.status) {
        return false;
      }

      // Condition filter  
      if (filters.condition !== 'all' && chassis.condition.toLowerCase() !== filters.condition.toLowerCase()) {
        return false;
      }

      // Size filter
      if (filters.size !== 'all' && chassis.size !== filters.size) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && chassis.type.toLowerCase() !== filters.type.toLowerCase()) {
        return false;
      }

      // Zone filter
      if (filters.zone !== 'all' && chassis.zone !== filters.zone) {
        return false;
      }

      // Owner filter
      if (filters.owner !== 'all' && chassis.owner.toLowerCase() !== filters.owner.toLowerCase()) {
        return false;
      }

      // GPS filter
      if (filters.gpsEnabled !== 'all') {
        const hasGps = filters.gpsEnabled === 'true';
        if (chassis.gpsEnabled !== hasGps) {
          return false;
        }
      }

      // Utilization filter
      if (filters.utilizationLevel !== 'all' && chassis.utilization.toLowerCase() !== filters.utilizationLevel.toLowerCase()) {
        return false;
      }

      // Days in yard filter
      if (filters.daysInYardMin && chassis.daysInYard < parseInt(filters.daysInYardMin)) {
        return false;
      }
      if (filters.daysInYardMax && chassis.daysInYard > parseInt(filters.daysInYardMax)) {
        return false;
      }

      // Inspection score filter
      if (filters.inspectionScoreMin && chassis.inspectionScore < parseFloat(filters.inspectionScoreMin)) {
        return false;
      }
      if (filters.inspectionScoreMax && chassis.inspectionScore > parseFloat(filters.inspectionScoreMax)) {
        return false;
      }

      // Year built filter
      if (filters.yearBuiltMin && chassis.yearBuilt < parseInt(filters.yearBuiltMin)) {
        return false;
      }
      if (filters.yearBuiltMax && chassis.yearBuilt > parseInt(filters.yearBuiltMax)) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      condition: 'all',
      size: 'all',
      type: 'all',
      zone: 'all',
      owner: 'all',
      gpsEnabled: 'all',
      utilizationLevel: 'all',
      daysInYardMin: '',
      daysInYardMax: '',
      inspectionScoreMin: '',
      inspectionScoreMax: '',
      yearBuiltMin: '',
      yearBuiltMax: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reserved': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'in transit': return <Truck className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      case 'in transit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Yard Inventory Data View</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive view and analysis of all chassis inventory in Pier S Yard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Chassis</p>
                <p className="text-2xl font-bold">{mockChassisData.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockChassisData.filter(c => c.status === 'Available').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mockChassisData.filter(c => c.status === 'Reserved').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold text-primary">{filteredData.length}</p>
              </div>
              <Filter className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Chassis ID, Location, Owner..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="in transit">In Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select value={filters.size} onValueChange={(value) => updateFilter('size', value)}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="20'">20'</SelectItem>
                  <SelectItem value="40'">40'</SelectItem>
                  <SelectItem value="45'">45'</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select value={filters.zone} onValueChange={(value) => updateFilter('zone', value)}>
                <SelectTrigger id="zone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  <SelectItem value="A">Zone A</SelectItem>
                  <SelectItem value="B">Zone B</SelectItem>
                  <SelectItem value="C">Zone C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={filters.condition} onValueChange={(value) => updateFilter('condition', value)}>
                    <SelectTrigger id="condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conditions</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="needs repair">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="dry van">Dry Van</SelectItem>
                      <SelectItem value="refrigerated">Refrigerated</SelectItem>
                      <SelectItem value="high cube">High Cube</SelectItem>
                      <SelectItem value="flat rack">Flat Rack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Select value={filters.owner} onValueChange={(value) => updateFilter('owner', value)}>
                    <SelectTrigger id="owner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Owners</SelectItem>
                      <SelectItem value="cai">CAI</SelectItem>
                      <SelectItem value="trac">TRAC</SelectItem>
                      <SelectItem value="flexi-van">Flexi-Van</SelectItem>
                      <SelectItem value="nyk">NYK</SelectItem>
                      <SelectItem value="apl">APL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days-min">Days in Yard (Min)</Label>
                  <Input
                    id="days-min"
                    type="number"
                    placeholder="0"
                    value={filters.daysInYardMin}
                    onChange={(e) => updateFilter('daysInYardMin', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days-max">Days in Yard (Max)</Label>
                  <Input
                    id="days-max"
                    type="number"
                    placeholder="365"
                    value={filters.daysInYardMax}
                    onChange={(e) => updateFilter('daysInYardMax', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score-min">Inspection Score (Min)</Label>
                  <Input
                    id="score-min"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={filters.inspectionScoreMin}
                    onChange={(e) => updateFilter('inspectionScoreMin', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score-max">Inspection Score (Max)</Label>
                  <Input
                    id="score-max"
                    type="number"
                    step="0.1"
                    placeholder="10"
                    value={filters.inspectionScoreMax}
                    onChange={(e) => updateFilter('inspectionScoreMax', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chassis Inventory ({filteredData.length} results)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis ID</TableHead>
                  <TableHead>Size/Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Days in Yard</TableHead>
                  <TableHead>Inspection Score</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead>Reserved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No chassis found matching the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((chassis) => (
                    <TableRow key={chassis.id}>
                      <TableCell className="font-medium">{chassis.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{chassis.size}</div>
                          <div className="text-sm text-muted-foreground">{chassis.type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {chassis.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(chassis.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(chassis.status)}
                            {chassis.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getConditionColor(chassis.condition)}>
                          {chassis.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>{chassis.owner}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {chassis.daysInYard}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-medium ${
                            chassis.inspectionScore >= 9 ? 'text-green-600' :
                            chassis.inspectionScore >= 7 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {chassis.inspectionScore}/10
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={chassis.gpsEnabled ? "default" : "secondary"}>
                          {chassis.gpsEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {chassis.reservedBy ? (
                          <div className="text-sm">
                            <div className="font-medium">{chassis.reservedBy}</div>
                            <div className="text-muted-foreground">
                              {chassis.estimatedDeparture && 
                                new Date(chassis.estimatedDeparture).toLocaleDateString()
                              }
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YardInventoryDataView;