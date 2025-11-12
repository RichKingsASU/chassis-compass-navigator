import { useState, useMemo, useEffect } from "react";
import { UnifiedGpsData } from "./useUnifiedGpsData";

export const useChassisSearch = (data: UnifiedGpsData[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState("all");

  // Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.chassisId.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const statusLower = item.status.toLowerCase();
        
        if (statusFilter === "available") {
          return statusLower.includes("available") || statusLower === "active";
        } else if (statusFilter === "in-use") {
          return statusLower.includes("in-use") || 
                 statusLower.includes("in use") || 
                 statusLower.includes("transit");
        } else if (statusFilter === "out-of-service") {
          return statusLower.includes("out of service") || 
                 statusLower.includes("maintenance");
        }
        
        return false;
      });
    }

    // Apply equipment type filter
    if (equipmentTypeFilter !== "all") {
      filtered = filtered.filter((item) => {
        const typeLower = item.equipmentType.toLowerCase();
        return typeLower.includes(equipmentTypeFilter);
      });
    }

    return filtered;
  }, [data, debouncedSearchTerm, statusFilter, equipmentTypeFilter]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    equipmentTypeFilter,
    setEquipmentTypeFilter,
    filteredData,
  };
};
