
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";

interface TMSFiltersProps {
  selectedFilters: {
    source: string;
    type: string;
    status: string;
  };
  setSelectedFilters: React.Dispatch<React.SetStateAction<{
    source: string;
    type: string;
    status: string;
  }>>;
}

const TMSFilters: React.FC<TMSFiltersProps> = ({ selectedFilters, setSelectedFilters }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <FormLabel>Source System</FormLabel>
        <Select 
          value={selectedFilters.source} 
          onValueChange={(value) => setSelectedFilters({...selectedFilters, source: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sources</SelectItem>
            <SelectItem value="McLeod">McLeod</SelectItem>
            <SelectItem value="Trimble">Trimble</SelectItem>
            <SelectItem value="MercuryGate">MercuryGate</SelectItem>
            <SelectItem value="Oracle TMS">Oracle TMS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <FormLabel>Data Type</FormLabel>
        <Select 
          value={selectedFilters.type} 
          onValueChange={(value) => setSelectedFilters({...selectedFilters, type: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="Order">Order</SelectItem>
            <SelectItem value="Dispatch">Dispatch</SelectItem>
            <SelectItem value="Shipment">Shipment</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <FormLabel>Status</FormLabel>
        <Select 
          value={selectedFilters.status} 
          onValueChange={(value) => setSelectedFilters({...selectedFilters, status: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TMSFilters;
