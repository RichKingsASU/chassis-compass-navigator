
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ExcelPaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

const ExcelPagination: React.FC<ExcelPaginationProps> = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;
  
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => setPage(Math.max(1, page - 1))}
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
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default ExcelPagination;
