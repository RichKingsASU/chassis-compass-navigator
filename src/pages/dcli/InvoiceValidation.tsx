import React, { useState } from 'react';
import ValidationSummary from '@/components/dcli/validation/ValidationSummary';
import ValidationGrid from '@/components/dcli/validation/ValidationGrid';
import ValidationFilters from '@/components/dcli/validation/ValidationFilters';
import LineControlPanel from '@/components/dcli/validation/LineControlPanel';

export interface ValidationFilters {
  customer_name?: string;
  ssl?: string;
  on_hire_date_start?: string;
  on_hire_date_end?: string;
  confidence_min?: number;
  confidence_max?: number;
}

const InvoiceValidation = () => {
  const [filters, setFilters] = useState<ValidationFilters>({});
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Invoice Validation</h2>
      </div>

      <ValidationSummary filters={filters} />
      
      <ValidationFilters filters={filters} onFiltersChange={setFilters} />

      <ValidationGrid 
        filters={filters} 
        onRowClick={(lineId) => setSelectedLineId(lineId)} 
      />

      <LineControlPanel 
        lineId={selectedLineId}
        open={selectedLineId !== null}
        onClose={() => setSelectedLineId(null)}
      />
    </div>
  );
};

export default InvoiceValidation;
