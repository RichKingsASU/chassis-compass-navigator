
import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface ExcelEmptyStateProps {
  searchTerm: string;
}

const ExcelEmptyState: React.FC<ExcelEmptyStateProps> = ({ searchTerm }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <FileSpreadsheet size={40} className="mb-2 text-muted-foreground" />
      <p>No excel data found</p>
      {searchTerm && <p className="text-sm">Try adjusting your search</p>}
    </div>
  );
};

export default ExcelEmptyState;
