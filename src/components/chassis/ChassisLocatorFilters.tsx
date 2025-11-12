import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface ChassisLocatorFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  equipmentTypeFilter: string;
  onEquipmentTypeFilterChange: (value: string) => void;
  totalResults: number;
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "in-use", label: "In-Use" },
  { value: "out-of-service", label: "Out of Service" },
];

const equipmentTypeOptions = [
  { value: "all", label: "All" },
  { value: "20", label: "20ft" },
  { value: "40", label: "40ft" },
  { value: "53", label: "53ft" },
];

const ChassisLocatorFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  equipmentTypeFilter,
  onEquipmentTypeFilterChange,
  totalResults,
}: ChassisLocatorFiltersProps) => {
  const hasActiveFilters = searchTerm || statusFilter !== "all" || equipmentTypeFilter !== "all";

  const clearAllFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onEquipmentTypeFilterChange("all");
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Search Chassis
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Enter chassis ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange(option.value)}
              className="flex-1 min-w-[80px]"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Equipment Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Equipment Type</Label>
        <div className="flex flex-wrap gap-2">
          {equipmentTypeOptions.map((option) => (
            <Button
              key={option.value}
              variant={equipmentTypeFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onEquipmentTypeFilterChange(option.value)}
              className="flex-1 min-w-[60px]"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalResults}</span> chassis found
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>
        
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onSearchChange("")}
                />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusOptions.find(o => o.value === statusFilter)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onStatusFilterChange("all")}
                />
              </Badge>
            )}
            {equipmentTypeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Type: {equipmentTypeOptions.find(o => o.value === equipmentTypeFilter)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onEquipmentTypeFilterChange("all")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChassisLocatorFilters;
