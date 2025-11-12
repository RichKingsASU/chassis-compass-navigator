import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, List } from "lucide-react";

interface MobileViewToggleProps {
  activeView: "map" | "list";
  onViewChange: (view: "map" | "list") => void;
  mapCount?: number;
  listCount?: number;
}

const MobileViewToggle = ({ 
  activeView, 
  onViewChange,
  mapCount,
  listCount 
}: MobileViewToggleProps) => {
  return (
    <Tabs value={activeView} onValueChange={(v) => onViewChange(v as "map" | "list")} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="map" className="gap-2">
          <Map className="h-4 w-4" />
          Map
          {mapCount !== undefined && (
            <span className="ml-1 text-xs text-muted-foreground">({mapCount})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-2">
          <List className="h-4 w-4" />
          List
          {listCount !== undefined && (
            <span className="ml-1 text-xs text-muted-foreground">({listCount})</span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default MobileViewToggle;
