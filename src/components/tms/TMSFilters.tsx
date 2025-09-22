import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Search } from "lucide-react";
import { format } from "date-fns";

interface TMSFiltersState {
  source: string;
  type: string; 
  status: string;
}

interface TMSFiltersProps {
  selectedFilters: TMSFiltersState;
  setSelectedFilters: React.Dispatch<React.SetStateAction<TMSFiltersState>>;
}

const TMSFilters: React.FC<TMSFiltersProps> = ({ selectedFilters, setSelectedFilters }) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const addFilter = (filterType: string, value: string) => {
    const filterLabel = `${filterType}: ${value}`;
    if (!activeFilters.includes(filterLabel)) {
      setActiveFilters([...activeFilters, filterLabel]);
    }
    
    // Update state based on filter type
    if (filterType === 'Status') {
      setSelectedFilters(prev => ({ ...prev, status: value }));
    } else if (filterType === 'Source') {
      setSelectedFilters(prev => ({ ...prev, source: value }));
    } else if (filterType === 'Type') {
      setSelectedFilters(prev => ({ ...prev, type: value }));
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
    
    // Reset corresponding state
    const [filterType] = filter.split(': ');
    if (filterType === 'Status') {
      setSelectedFilters(prev => ({ ...prev, status: '' }));
    } else if (filterType === 'Source') {
      setSelectedFilters(prev => ({ ...prev, source: '' }));
    } else if (filterType === 'Type') {
      setSelectedFilters(prev => ({ ...prev, type: '' }));
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSelectedFilters({ source: '', type: '', status: '' });
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shipments, container numbers, BOL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Select onValueChange={(value) => addFilter('Status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending">Pending Pickup</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => addFilter('Carrier', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ABC Logistics">ABC Logistics</SelectItem>
              <SelectItem value="Swift Transport">Swift Transport</SelectItem>
              <SelectItem value="Express Freight">Express Freight</SelectItem>
              <SelectItem value="Premier Shipping">Premier Shipping</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => addFilter('Service Mode', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Service Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LTL">LTL</SelectItem>
              <SelectItem value="FTL">FTL</SelectItem>
              <SelectItem value="Intermodal">Intermodal</SelectItem>
              <SelectItem value="Drayage">Drayage</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => addFilter('Region', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="West">West</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="Central">Central</SelectItem>
              <SelectItem value="Southeast">Southeast</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex gap-4 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Filters:</span>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {filter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFilter(filter)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TMSFilters;