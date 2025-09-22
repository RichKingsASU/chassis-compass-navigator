import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit3, Eye, Code, Save, Trash2, Plus } from 'lucide-react';

interface ComponentProps {
  [key: string]: any;
}

interface VisualComponent {
  id: string;
  type: string;
  props: ComponentProps;
  children?: VisualComponent[];
}

interface VisualEditorProps {
  initialComponents?: VisualComponent[];
  onSave?: (components: VisualComponent[]) => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({ 
  initialComponents = [], 
  onSave 
}) => {
  const [components, setComponents] = useState<VisualComponent[]>(initialComponents);
  const [selectedComponent, setSelectedComponent] = useState<VisualComponent | null>(null);
  const [mode, setMode] = useState<'design' | 'preview' | 'code'>('design');

  const addComponent = useCallback((type: string) => {
    const newComponent: VisualComponent = {
      id: `component-${Date.now()}`,
      type,
      props: getDefaultProps(type),
    };
    setComponents(prev => [...prev, newComponent]);
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<VisualComponent>) => {
    setComponents(prev => 
      prev.map(comp => comp.id === id ? { ...comp, ...updates } : comp)
    );
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  const handleSave = useCallback(() => {
    onSave?.(components);
  }, [components, onSave]);

  return (
    <div className="flex h-screen bg-background">
      {/* Component Library Sidebar */}
      <div className="w-64 border-r bg-card p-4">
        <h3 className="font-semibold mb-4">Components</h3>
        <div className="space-y-2">
          {COMPONENT_TYPES.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addComponent(type.id)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {type.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-4 flex items-center justify-between">
          <Tabs value={mode} onValueChange={(value: any) => setMode(value)}>
            <TabsList>
              <TabsTrigger value="design">
                <Edit3 className="w-4 h-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="w-4 h-4 mr-2" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 overflow-auto">
          {mode === 'design' && (
            <div className="space-y-4">
              {components.map((component) => (
                <ComponentRenderer
                  key={component.id}
                  component={component}
                  isSelected={selectedComponent?.id === component.id}
                  onSelect={() => setSelectedComponent(component)}
                  onDelete={() => deleteComponent(component.id)}
                />
              ))}
              {components.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No components added yet</p>
                  <p className="text-sm">Select a component from the sidebar to get started</p>
                </div>
              )}
            </div>
          )}
          
          {mode === 'preview' && (
            <div className="space-y-4">
              {components.map((component) => (
                <PreviewRenderer key={component.id} component={component} />
              ))}
            </div>
          )}
          
          {mode === 'code' && (
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(components, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedComponent && (
        <div className="w-80 border-l bg-card p-4">
          <PropertiesPanel
            component={selectedComponent}
            onUpdate={(updates) => updateComponent(selectedComponent.id, updates)}
          />
        </div>
      )}
    </div>
  );
};

const ComponentRenderer: React.FC<{
  component: VisualComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ component, isSelected, onSelect, onDelete }) => {
  return (
    <div
      className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary">{component.type}</Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <PreviewRenderer component={component} />
    </div>
  );
};

const PreviewRenderer: React.FC<{ component: VisualComponent }> = ({ component }) => {
  switch (component.type) {
    case 'card':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{component.props.title || 'Card Title'}</CardTitle>
            <CardDescription>{component.props.description || 'Card description'}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{component.props.content || 'Card content goes here'}</p>
          </CardContent>
        </Card>
      );
    case 'button':
      return (
        <Button variant={component.props.variant || 'default'}>
          {component.props.text || 'Button'}
        </Button>
      );
    case 'text':
      return (
        <div>
          <h3 className="font-semibold">{component.props.heading || 'Heading'}</h3>
          <p className="text-muted-foreground">{component.props.content || 'Text content'}</p>
        </div>
      );
    default:
      return <div>Unknown component type: {component.type}</div>;
  }
};

const PropertiesPanel: React.FC<{
  component: VisualComponent;
  onUpdate: (updates: Partial<VisualComponent>) => void;
}> = ({ component, onUpdate }) => {
  const updateProp = (key: string, value: any) => {
    onUpdate({
      props: { ...component.props, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Properties</h3>
      
      {component.type === 'card' && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={component.props.title || ''}
              onChange={(e) => updateProp('title', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={component.props.description || ''}
              onChange={(e) => updateProp('description', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={component.props.content || ''}
              onChange={(e) => updateProp('content', e.target.value)}
            />
          </div>
        </div>
      )}

      {component.type === 'button' && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="text">Button Text</Label>
            <Input
              id="text"
              value={component.props.text || ''}
              onChange={(e) => updateProp('text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="variant">Variant</Label>
            <Select
              value={component.props.variant || 'default'}
              onValueChange={(value) => updateProp('variant', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {component.type === 'text' && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="heading">Heading</Label>
            <Input
              id="heading"
              value={component.props.heading || ''}
              onChange={(e) => updateProp('heading', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={component.props.content || ''}
              onChange={(e) => updateProp('content', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const COMPONENT_TYPES = [
  { id: 'card', name: 'Card' },
  { id: 'button', name: 'Button' },
  { id: 'text', name: 'Text Block' },
];

const getDefaultProps = (type: string): ComponentProps => {
  switch (type) {
    case 'card':
      return { title: 'New Card', description: 'Card description', content: 'Card content' };
    case 'button':
      return { text: 'Click me', variant: 'default' };
    case 'text':
      return { heading: 'New Heading', content: 'Text content goes here' };
    default:
      return {};
  }
};

export default VisualEditor;