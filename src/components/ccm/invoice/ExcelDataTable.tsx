import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ExcelDataItem } from './types';
import ExcelTableHeader from './excel/ExcelTableHeader';
import ExcelTableBody from './excel/ExcelTableBody';
import ExcelPagination from './excel/ExcelPagination';
import ExcelTableFilters from './excel/ExcelTableFilters';

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

  // Get column order from stored headers or fallback to first row keys
  const columns: string[] = [];
  if (filteredData.length > 0) {
    const firstItem = filteredData[0];
    
    // Try to use stored column_headers if available
    if (firstItem.column_headers && Array.isArray(firstItem.column_headers) && firstItem.column_headers.length > 0) {
      columns.push(...firstItem.column_headers);
    } else {
      // Fallback: Use the first row's keys to preserve the original column order from CSV
      columns.push(...Object.keys(firstItem.row_data));
    }
  }

  // Show ALL columns for review - users need to verify against original invoice
  const displayColumns = columns;

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
        <ExcelTableFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSheet={selectedSheet}
          setSelectedSheet={setSelectedSheet}
          sheetNames={sheetNames}
          handleRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          invoiceId={invoiceId}
        />
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="rounded-md border">
          <ScrollArea className="h-[600px] w-full">
            <Table className="relative">
              <ExcelTableHeader displayColumns={displayColumns} />
              <ExcelTableBody 
                loading={loading} 
                paginatedData={paginatedData} 
                displayColumns={displayColumns}
                searchTerm={searchTerm}
              />
            </Table>
            <ScrollBar orientation="horizontal" className="h-3 hover:bg-muted" />
          </ScrollArea>
        </div>
        
        <ExcelPagination 
          page={page} 
          totalPages={totalPages} 
          setPage={setPage} 
        />
      </CardContent>
    </Card>
  );
};

export default ExcelDataTable;