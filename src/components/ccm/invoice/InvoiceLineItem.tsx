import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from 'lucide-react';
import { ExcelDataItem } from './types';

interface InvoiceLineItemProps {
  lineItem: ExcelDataItem;
  lineNumber: number;
  onEdit: () => void;
}

const InvoiceLineItem: React.FC<InvoiceLineItemProps> = ({
  lineItem,
  lineNumber,
  onEdit
}) => {
  const renderFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  };

  const renderFields = () => {
    const rowData = typeof lineItem.row_data === 'object' && lineItem.row_data !== null 
      ? lineItem.row_data as Record<string, any>
      : {};
    
    const fields = Object.keys(rowData);
    
    if (fields.length === 0) {
      return (
        <div className="text-muted-foreground">
          No data available for this line item
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field} className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <p className="text-sm">
              {renderFieldValue(rowData[field])}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="outline">
                Line {lineNumber}
              </Badge>
              <div>
                <p className="text-sm font-medium">Sheet: {lineItem.sheet_name}</p>
                <p className="text-xs text-muted-foreground">
                  {lineItem.validated ? (
                    <Badge variant="default" className="text-xs">Validated</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Unvalidated</Badge>
                  )}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          {renderFields()}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceLineItem;