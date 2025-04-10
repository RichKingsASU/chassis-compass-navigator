
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
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
      
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <ExcelTableHeader displayColumns={displayColumns} />
            <ExcelTableBody 
              loading={loading} 
              paginatedData={paginatedData} 
              displayColumns={displayColumns}
              searchTerm={searchTerm}
            />
          </Table>
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
