import { cn } from "@/lib/utils";

interface FreshnessIndicatorProps {
  freshnessMinutes: number;
  showLabel?: boolean;
  className?: string;
}

export const getFreshnessColor = (minutes: number): string => {
  if (minutes < 5) return "bg-freshness-excellent";
  if (minutes < 30) return "bg-freshness-good";
  if (minutes < 1440) return "bg-freshness-stale"; // 24 hours
  return "bg-freshness-old";
};

export const getFreshnessLabel = (minutes: number): string => {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
};

const FreshnessIndicator = ({ 
  freshnessMinutes, 
  showLabel = false,
  className 
}: FreshnessIndicatorProps) => {
  const colorClass = getFreshnessColor(freshnessMinutes);
  const label = getFreshnessLabel(freshnessMinutes);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-2 w-2 rounded-full", colorClass)} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
};

export default FreshnessIndicator;
