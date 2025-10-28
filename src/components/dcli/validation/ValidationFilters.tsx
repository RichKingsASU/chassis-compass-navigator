import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidationFilters } from '@/pages/dcli/InvoiceValidation';

interface ValidationFiltersProps {
  filters: ValidationFilters;
  onFiltersChange: (filters: ValidationFilters) => void;
}

const ValidationFiltersComponent: React.FC<ValidationFiltersProps> = ({ 
  filters, 
  onFiltersChange 
}) => {
  const updateFilter = (key: keyof ValidationFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input
              id="customer_name"
              placeholder="Search customer..."
              value={filters.customer_name || ''}
              onChange={(e) => updateFilter('customer_name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ssl">SSL</Label>
            <Input
              id="ssl"
              placeholder="SSL code..."
              value={filters.ssl || ''}
              onChange={(e) => updateFilter('ssl', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="on_hire_start">On-Hire Start</Label>
            <Input
              id="on_hire_start"
              type="date"
              value={filters.on_hire_date_start || ''}
              onChange={(e) => updateFilter('on_hire_date_start', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="on_hire_end">On-Hire End</Label>
            <Input
              id="on_hire_end"
              type="date"
              value={filters.on_hire_date_end || ''}
              onChange={(e) => updateFilter('on_hire_date_end', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confidence">Min Confidence</Label>
            <Input
              id="confidence"
              type="number"
              step="0.1"
              min="0"
              max="1"
              placeholder="0.0 - 1.0"
              value={filters.confidence_min || ''}
              onChange={(e) => updateFilter('confidence_min', parseFloat(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationFiltersComponent;
