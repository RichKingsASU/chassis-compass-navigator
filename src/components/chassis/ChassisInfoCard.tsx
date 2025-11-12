import { UnifiedGpsData } from "@/hooks/useUnifiedGpsData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, History, Clock, Box, Radio } from "lucide-react";
import FreshnessIndicator, { getFreshnessLabel } from "./FreshnessIndicator";
import { useNavigate } from "react-router-dom";

interface ChassisInfoCardProps {
  chassis: UnifiedGpsData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
  if (status === "Available") return "default";
  if (status === "In-Use" || status === "In-Transit") return "secondary";
  if (status === "Out of Service" || status === "Maintenance") return "destructive";
  return "secondary";
};

const ChassisInfoCard = ({ chassis, open, onOpenChange }: ChassisInfoCardProps) => {
  const navigate = useNavigate();

  if (!chassis) return null;

  const handleGetDirections = () => {
    if (chassis.latitude && chassis.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${chassis.latitude},${chassis.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleViewHistory = () => {
    navigate(`/chassis/${chassis.chassisId}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{chassis.chassisId}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary/20" />
              <span className="text-sm text-muted-foreground">Status</span>
            </div>
            <Badge variant={getStatusVariant(chassis.status)} className="ml-auto">
              {chassis.status}
            </Badge>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Location</span>
            </div>
            <p className="text-sm font-medium pl-6">{chassis.location}</p>
          </div>

          {/* Last Update */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last Update</span>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <FreshnessIndicator freshnessMinutes={chassis.freshnessMinutes} />
              <span className="text-sm font-medium">
                {getFreshnessLabel(chassis.freshnessMinutes)}
              </span>
            </div>
          </div>

          {/* Equipment Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="h-4 w-4" />
              <span>Equipment Type</span>
            </div>
            <p className="text-sm font-medium pl-6">{chassis.equipmentType}</p>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radio className="h-4 w-4" />
              <span>GPS Provider</span>
            </div>
            <div className="space-y-1 pl-6">
              <Badge variant="outline">
                {chassis.provider}
              </Badge>
              {chassis.deviceLabel && (
                <p className="text-xs text-muted-foreground">
                  Device: {chassis.deviceLabel}
                </p>
              )}
            </div>
          </div>

          {/* Speed (if available) */}
          {chassis.speed !== undefined && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Navigation className="h-4 w-4" />
                  <span>Speed</span>
                </div>
                <p className="text-sm font-medium pl-6">{chassis.speed} mph</p>
              </div>
            </>
          )}

          {/* Notes (if available) */}
          {chassis.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{chassis.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleGetDirections}
              disabled={!chassis.latitude || !chassis.longitude}
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              size="lg"
              onClick={handleViewHistory}
            >
              <History className="h-4 w-4" />
              View Full History
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChassisInfoCard;
