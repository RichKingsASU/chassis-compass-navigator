
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ExcelDataItem {
  id: string;
  invoice_id: string;
  sheet_name: string;
  row_data: Record<string, any>;
  created_at: string;
  validated: boolean;
}

interface ExcelDataTableProps {
  data: ExcelDataItem[];
  loading: boolean;
  invoiceId?: string;
  onRefresh?: () => Promise<void>;
}

const ExcelDataTable: React.FC<ExcelDataTableProps> = ({ 
  data, 
  loading, 
  invoiceId,
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const rowsPerPage = 10;

  // Reset page when data changes
  useEffect(() => {
    setPage(1);
  }, [data]);

  // Get unique sheet names
  const sheetNames = Array.from(new Set(data.map(item => item.sheet_name)));

  // Filter data
  const filteredData = data.filter(item => {
    // Filter by invoiceId if provided
    if (invoiceId && item.invoice_id !== invoiceId) {
      return false;
    }

    // Filter by sheet name
    if (selectedSheet !== 'all' && item.sheet_name !== selectedSheet) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      // Search in all row_data fields
      return Object.values(item.row_data).some(value => 
        String(value).toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Get all keys (columns) from data
  const allKeys = new Set<string>();
  filteredData.forEach(item => {
    Object.keys(item.row_data).forEach(key => allKeys.add(key));
  });
  
  // Convert to array and prioritize common column names
  const priorityColumns = ['id', 'invoice_number', 'date', 'amount', 'description'];
  const columns = Array.from(allKeys).sort((a, b) => {
    const indexA = priorityColumns.findIndex(col => a.toLowerCase().includes(col.toLowerCase()));
    const indexB = priorityColumns.findIndex(col => b.toLowerCase().includes(col.toLowerCase()));
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  // Display a maximum of 8 columns
  const displayColumns = columns.slice(0, 8);

  // Handle refresh button click
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Data Refreshed",
        description: "Excel data has been updated successfully.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh Excel data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="text-lg font-medium">
            Excel Data
            {invoiceId && <Badge className="ml-2 bg-blue-500">Single Invoice</Badge>}
          </CardTitle>
          
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
              disabled={isRefreshing || !onRefresh}
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
            
            <Button variant="outline" size="icon">
              <Download size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sheet</TableHead>
                {displayColumns.map(column => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
                <TableHead>Validated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length + 2} className="text-center py-10 text-muted-foreground">
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length + 2} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <FileSpreadsheet size={40} className="mb-2 text-muted-foreground" />
                      <p>No excel data found</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.sheet_name}</TableCell>
                    {displayColumns.map(column => (
                      <TableCell key={column}>
                        {item.row_data[column] !== undefined ? String(item.row_data[column]) : '—'}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Badge variant={item.validated ? "default" : "outline"}>
                        {item.validated ? "Validated" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                // Show relevant page numbers based on current page
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      isActive={page === pageNum}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelDataTable;
