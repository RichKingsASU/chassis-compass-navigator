
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

  // Get all keys (columns) from data - preserve original order from first row
  const allKeys: string[] = [];
  if (filteredData.length > 0) {
    // Use the first row's keys to preserve the original column order from CSV
    allKeys.push(...Object.keys(filteredData[0].row_data));
  }
  
  const columns = allKeys;

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
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table className="relative">
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
