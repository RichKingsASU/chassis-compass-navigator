import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from 'lucide-react';
import { ExcelDataItem } from './types';

interface InvoiceLineEditorProps {
  lineItem: ExcelDataItem;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
}

const InvoiceLineEditor: React.FC<InvoiceLineEditorProps> = ({
  lineItem,
  onSave,
  onCancel
}) => {
  const [editedData, setEditedData] = useState<Record<string, any>>(
    typeof lineItem.row_data === 'object' && lineItem.row_data !== null 
      ? lineItem.row_data as Record<string, any>
      : {}
  );

  const handleFieldChange = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(editedData);
  };

  const renderEditableFields = () => {
    const fields = Object.keys(editedData);
    
    if (fields.length === 0) {
      return (
        <div className="text-muted-foreground">
          No editable fields available
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`field-${field}`} className="text-sm font-medium">
              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Label>
            <Input
              id={`field-${field}`}
              value={editedData[field]?.toString() || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="w-full"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Editing Line Item</h4>
              <p className="text-sm text-muted-foreground">
                Sheet: {lineItem.sheet_name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
          
          {renderEditableFields()}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceLineEditor;