
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";
import { TMSFiltersState, TMSSource, TMSType, TMSStatus } from './TMSDataModel';

interface TMSFiltersProps {
  selectedFilters: TMSFiltersState;
  setSelectedFilters: React.Dispatch<React.SetStateAction<TMSFiltersState>>;
}

const TMSFilters: React.FC<TMSFiltersProps> = ({ selectedFilters, setSelectedFilters }) => {
  // Array of available sources for type safety and maintainability
  const sources: TMSSource[] = ['McLeod', 'Trimble', 'MercuryGate', 'Oracle TMS'];
  
  // Array of available data types
  const dataTypes: TMSType[] = ['Order', 'Dispatch', 'Shipment', 'Invoice'];
  
  // Array of available statuses
  const statuses: TMSStatus[] = ['active', 'pending', 'completed'];

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
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
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
            <SelectItem value="all">All Types</SelectItem>
            {dataTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
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
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TMSFilters;
