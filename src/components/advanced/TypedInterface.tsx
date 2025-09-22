import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// TypeScript-to-UI Schema Generator inspired by Deco
const generateFormSchema = (schemaDefinition: any) => {
  return z.object(schemaDefinition);
};

const createUIFromSchema = (schema: z.ZodObject<any>, data: any, onChange: (field: string, value: any) => void) => {
  const shape = schema.shape;
  
  return Object.entries(shape).map(([key, zodType]: [string, any]) => {
    const isOptional = zodType.isOptional();
    const type = zodType._def.typeName;
    
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="flex items-center gap-2">
          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
          {!isOptional && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </Label>
        
        {renderField(type, key, data[key], (value) => onChange(key, value), zodType)}
      </div>
    );
  });
};

const renderField = (type: string, key: string, value: any, onChange: (value: any) => void, zodType: any) => {
  switch (type) {
    case 'ZodString':
      if (key.includes('description') || key.includes('content')) {
        return (
          <Textarea
            id={key}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${key}...`}
          />
        );
      }
      return (
        <Input
          id={key}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${key}...`}
        />
      );
      
    case 'ZodNumber':
      return (
        <Input
          id={key}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={`Enter ${key}...`}
        />
      );
      
    case 'ZodBoolean':
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={key}
            checked={value || false}
            onCheckedChange={onChange}
          />
          <Label htmlFor={key}>Enable {key}</Label>
        </div>
      );
      
    case 'ZodEnum':
      const options = zodType._def.values;
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${key}...`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      
    case 'ZodArray':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Array items</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const newArray = [...(value || []), ''];
                onChange(newArray);
              }}
            >
              Add Item
            </Button>
          </div>
          {(value || []).map((item: any, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const newArray = [...value];
                  newArray[index] = e.target.value;
                  onChange(newArray);
                }}
                placeholder={`Item ${index + 1}`}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newArray = value.filter((_: any, i: number) => i !== index);
                  onChange(newArray);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      );
      
    default:
      return (
        <Input
          id={key}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${key}...`}
        />
      );
  }
};

// Product Shelf Example Schema (inspired by Deco's example)
const productShelfSchema = generateFormSchema({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  products: z.array(z.string()).min(1, "At least one product is required"),
  layout: z.object({
    headerAlignment: z.enum(['center', 'left']),
    headerFontSize: z.enum(['Normal', 'Large']),
    showDescription: z.boolean().optional(),
  }).optional(),
  cardLayout: z.enum(['grid', 'list', 'carousel']).optional(),
  maxItems: z.number().min(1).max(50).optional(),
  isVisible: z.boolean().default(true),
});

interface TypedInterfaceProps {
  title?: string;
  description?: string;
  schema?: z.ZodObject<any>;
  initialData?: any;
  onSave?: (data: any) => void;
}

const TypedInterface: React.FC<TypedInterfaceProps> = ({ 
  title = "Component Configuration",
  description = "Configure your component using TypeScript-generated UI",
  schema = productShelfSchema,
  initialData = {},
  onSave
}) => {
  const [formData, setFormData] = React.useState(initialData);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    try {
      const validatedData = schema.parse(formData);
      onSave?.(validatedData);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const fields = createUIFromSchema(schema, formData, handleFieldChange);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="secondary">TypeScript Powered</Badge>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields}
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setFormData({})}>
              Reset
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
          
          <div className="mt-6">
            <Label className="text-sm font-medium">Generated JSON:</Label>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypedInterface;