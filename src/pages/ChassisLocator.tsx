import DashboardLayout from "@/components/layout/DashboardLayout";
import { useUnifiedGpsData } from "@/hooks/useUnifiedGpsData";
import { useChassisSearch } from "@/hooks/useChassisSearch";
import ChassisLocatorMap from "@/components/chassis/ChassisLocatorMap";
import ChassisLocatorFilters from "@/components/chassis/ChassisLocatorFilters";
import ChassisResultsList from "@/components/chassis/ChassisResultsList";
import ChassisInfoCard from "@/components/chassis/ChassisInfoCard";
import MobileViewToggle from "@/components/chassis/MobileViewToggle";
import CollapsibleFilters from "@/components/chassis/CollapsibleFilters";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { UnifiedGpsData } from "@/hooks/useUnifiedGpsData";
import { useSwipeable } from "react-swipeable";

const ChassisLocator = () => {
  const { data: gpsData = [], isLoading, refetch, isRefetching } = useUnifiedGpsData();
  const [selectedChassisId, setSelectedChassisId] = useState<string | null>(null);
  const [hoveredChassisId, setHoveredChassisId] = useState<string | null>(null);
  const [infoCardOpen, setInfoCardOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    equipmentTypeFilter,
    setEquipmentTypeFilter,
    filteredData,
  } = useChassisSearch(gpsData);

  const handleMarkerClick = (chassis: UnifiedGpsData) => {
    setSelectedChassisId(chassis.chassisId);
    setInfoCardOpen(true);
  };

  const handleChassisSelect = (chassisId: string) => {
    setSelectedChassisId(chassisId);
    setInfoCardOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const selectedChassis = gpsData.find(c => c.chassisId === selectedChassisId);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setMobileView("list"),
    onSwipedRight: () => setMobileView("map"),
    trackMouse: false,
    trackTouch: true,
  });

  return (
    <DashboardLayout>
      <div className="dashboard-layout">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Chassis Locator</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Real-time GPS tracking of chassis fleet
            </p>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="lg:hidden mb-4">
          <MobileViewToggle
            activeView={mobileView}
            onViewChange={setMobileView}
            mapCount={filteredData.length}
            listCount={filteredData.length}
          />
        </div>

        {/* Collapsible Filters (Mobile Only) */}
        <CollapsibleFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          equipmentTypeFilter={equipmentTypeFilter}
          onEquipmentTypeFilterChange={setEquipmentTypeFilter}
          totalResults={filteredData.length}
          onRefresh={handleRefresh}
          isRefreshing={isRefetching}
        />

        {/* Desktop Layout - Side by Side */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Panel - Search & Filters (30%) */}
          <Card className="lg:col-span-4 p-4 overflow-y-auto">
            <div className="h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Search & Filters</h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ChassisLocatorFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    equipmentTypeFilter={equipmentTypeFilter}
                    onEquipmentTypeFilterChange={setEquipmentTypeFilter}
                    totalResults={filteredData.length}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefetching}
                  />
                  <ChassisResultsList
                    data={filteredData}
                    selectedChassisId={selectedChassisId}
                    onChassisSelect={handleChassisSelect}
                    onChassisHover={setHoveredChassisId}
                  />
                </>
              )}
            </div>
          </Card>

          {/* Right Panel - Map (70%) */}
          <Card className="lg:col-span-8 p-0 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ChassisLocatorMap
                data={filteredData}
                onMarkerClick={handleMarkerClick}
                selectedChassisId={hoveredChassisId || selectedChassisId}
              />
            )}
          </Card>
        </div>

        {/* Mobile/Tablet Layout - Stacked with Swipe */}
        <div className="lg:hidden flex flex-col gap-4" {...swipeHandlers}>
          {/* Map View (60% height on mobile) */}
          <Card 
            className="p-0 overflow-hidden transition-all duration-300"
            style={{ 
              height: mobileView === "map" ? "60vh" : "0",
              opacity: mobileView === "map" ? 1 : 0,
              display: mobileView === "map" ? "block" : "none"
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ChassisLocatorMap
                data={filteredData}
                onMarkerClick={handleMarkerClick}
                selectedChassisId={hoveredChassisId || selectedChassisId}
              />
            )}
          </Card>

          {/* List View (fills remaining space on mobile) */}
          <Card 
            className="p-4 overflow-y-auto transition-all duration-300"
            style={{ 
              height: mobileView === "list" ? "calc(100vh - 280px)" : "0",
              opacity: mobileView === "list" ? 1 : 0,
              display: mobileView === "list" ? "block" : "none"
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ChassisResultsList
                data={filteredData}
                selectedChassisId={selectedChassisId}
                onChassisSelect={handleChassisSelect}
                onChassisHover={setHoveredChassisId}
              />
            )}
          </Card>
        </div>

        {/* Info Card */}
        <ChassisInfoCard
          chassis={selectedChassis || null}
          open={infoCardOpen}
          onOpenChange={setInfoCardOpen}
        />
      </div>
    </DashboardLayout>
  );
};

export default ChassisLocator;
