import { UnifiedGpsData } from "@/hooks/useUnifiedGpsData";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import FreshnessIndicator from "./FreshnessIndicator";
import { cn } from "@/lib/utils";

interface ChassisResultsListProps {
  data: UnifiedGpsData[];
  selectedChassisId: string | null;
  onChassisSelect: (chassisId: string) => void;
  onChassisHover: (chassisId: string | null) => void;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
  if (status === "Available") return "default";
  if (status === "In-Use" || status === "In-Transit") return "secondary";
  if (status === "Out of Service" || status === "Maintenance") return "destructive";
  return "secondary";
};

const ChassisResultsList = ({ 
  data, 
  selectedChassisId, 
  onChassisSelect,
  onChassisHover 
}: ChassisResultsListProps) => {
  return (
    <ScrollArea className="flex-1 mt-4">
      <div className="space-y-2">
        {data.map((chassis) => (
          <div
            key={chassis.chassisId}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
              selectedChassisId === chassis.chassisId && "bg-accent border-primary"
            )}
            onClick={() => onChassisSelect(chassis.chassisId)}
            onMouseEnter={() => onChassisHover(chassis.chassisId)}
            onMouseLeave={() => onChassisHover(null)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {chassis.chassisId}
                </span>
                <Badge variant={getStatusVariant(chassis.status)} className="text-xs">
                  {chassis.status}
                </Badge>
              </div>
              <FreshnessIndicator freshnessMinutes={chassis.freshnessMinutes} />
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium">{chassis.equipmentType}</span>
                <span>•</span>
                <span>{chassis.provider}</span>
              </div>
              <div className="truncate">{chassis.location}</div>
              <div className="flex items-center gap-2 text-xs">
                <FreshnessIndicator 
                  freshnessMinutes={chassis.freshnessMinutes} 
                  showLabel 
                />
              </div>
            </div>
          </div>
        ))}
        
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No chassis found matching your filters
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChassisResultsList;
