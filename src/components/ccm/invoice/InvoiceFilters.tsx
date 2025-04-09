
import React from 'react';
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceFiltersProps {
  selectedVendor: string;
  setSelectedVendor: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedFileType: string;
  setSelectedFileType: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  selectedVendor,
  setSelectedVendor,
  selectedStatus,
  setSelectedStatus,
  selectedFileType,
  setSelectedFileType,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <Input 
              type="search"
              placeholder="Search invoices..." 
              className="w-full md:w-[200px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor-filter">Vendor</Label>
          <Select 
            value={selectedVendor} 
            onValueChange={setSelectedVendor}
          >
            <SelectTrigger id="vendor-filter">
              <SelectValue placeholder="Select a vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              <SelectItem value="CCM">CCM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select 
            value={selectedStatus} 
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="review">Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="file-type-filter">File Type</Label>
          <Select 
            value={selectedFileType} 
            onValueChange={setSelectedFileType}
          >
            <SelectTrigger id="file-type-filter">
              <SelectValue placeholder="Select a file type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All File Types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel/CSV</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilters;
