
import React from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ExcelTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedSheet: string;
  setSelectedSheet: (sheet: string) => void;
  sheetNames: string[];
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
  invoiceId?: string;
}

const ExcelTableFilters: React.FC<ExcelTableFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedSheet,
  setSelectedSheet,
  sheetNames,
  handleRefresh,
  isRefreshing,
  invoiceId
}) => {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4">
      <div className="text-lg font-medium flex items-center">
        Excel Data
        {invoiceId && <Badge className="ml-2 bg-blue-500">Single Invoice</Badge>}
      </div>
      
      <div className="flex gap-2 items-center">
        <div className="relative w-60">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={selectedSheet} onValueChange={setSelectedSheet}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by sheet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sheets</SelectItem>
            {sheetNames.map(sheet => (
              <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </Button>
        
        <Button variant="outline" size="icon">
          <Download size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ExcelTableFilters;
