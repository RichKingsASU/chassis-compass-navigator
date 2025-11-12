import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import ChassisLocatorFilters from "./ChassisLocatorFilters";
import { cn } from "@/lib/utils";

interface CollapsibleFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  equipmentTypeFilter: string;
  onEquipmentTypeFilterChange: (value: string) => void;
  totalResults: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const CollapsibleFilters = (props: CollapsibleFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        variant="outline"
        className="w-full justify-between mb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters & Search</span>
          <span className="text-xs text-muted-foreground">
            ({props.totalResults} results)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[600px] opacity-100 mb-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="border rounded-lg p-4 bg-card">
          <ChassisLocatorFilters {...props} />
        </div>
      </div>
    </div>
  );
};

export default CollapsibleFilters;
