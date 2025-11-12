import DashboardLayout from "@/components/layout/DashboardLayout";
import { useUnifiedGpsData } from "@/hooks/useUnifiedGpsData";
import { useChassisSearch } from "@/hooks/useChassisSearch";
import ChassisLocatorMap from "@/components/chassis/ChassisLocatorMap";
import ChassisLocatorFilters from "@/components/chassis/ChassisLocatorFilters";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { UnifiedGpsData } from "@/hooks/useUnifiedGpsData";

const ChassisLocator = () => {
  const { data: gpsData = [], isLoading } = useUnifiedGpsData();
  const [selectedChassisId, setSelectedChassisId] = useState<string | null>(null);
  
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
  };

  return (
    <DashboardLayout>
      <div className="dashboard-layout">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chassis Locator</h1>
            <p className="text-muted-foreground mt-1">
              Real-time GPS tracking of chassis fleet
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Panel - Search & Filters (30%) */}
          <Card className="lg:col-span-4 p-4 overflow-y-auto">
            <div className="h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Search & Filters</h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ChassisLocatorFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  equipmentTypeFilter={equipmentTypeFilter}
                  onEquipmentTypeFilterChange={setEquipmentTypeFilter}
                  totalResults={filteredData.length}
                />
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
                selectedChassisId={selectedChassisId}
              />
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChassisLocator;
