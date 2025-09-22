import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Layers, 
  Database, 
  Zap, 
  Eye, 
  ArrowRight, 
  Package, 
  Shuffle,
  Play
} from 'lucide-react';

// Inspired by Deco's Block system
interface Block {
  id: string;
  type: 'loader' | 'section' | 'action';
  name: string;
  description: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  category: string;
  icon: React.ComponentType<any>;
}

interface BlockConnection {
  fromBlock: string;
  fromOutput: string;
  toBlock: string;
  toInput: string;
}

const AVAILABLE_BLOCKS: Block[] = [
  {
    id: 'product-loader',
    type: 'loader',
    name: 'Product Loader',
    description: 'Fetches product data from external APIs',
    inputs: { query: 'string', limit: 'number' },
    outputs: { products: 'Product[]' },
    category: 'Data',
    icon: Database,
  },
  {
    id: 'product-shelf',
    type: 'section',
    name: 'Product Shelf',
    description: 'Displays products in a responsive grid',
    inputs: { products: 'Product[]', title: 'string' },
    outputs: { interactions: 'Analytics[]' },
    category: 'UI',
    icon: Layers,
  },
  {
    id: 'add-to-cart',
    type: 'action',
    name: 'Add to Cart',
    description: 'Handles product addition to cart',
    inputs: { product: 'Product', quantity: 'number' },
    outputs: { success: 'boolean', cartId: 'string' },
    category: 'Commerce',
    icon: Zap,
  },
  {
    id: 'analytics-tracker',
    type: 'action',
    name: 'Analytics Tracker',
    description: 'Tracks user interactions and events',
    inputs: { events: 'Analytics[]' },
    outputs: { tracked: 'boolean' },
    category: 'Analytics',
    icon: Eye,
  },
];

const ModularBlocks: React.FC = () => {
  const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);
  const [connections, setConnections] = useState<BlockConnection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(AVAILABLE_BLOCKS.map(b => b.category)))];

  const addBlock = useCallback((block: Block) => {
    const newBlock = { ...block, id: `${block.id}-${Date.now()}` };
    setSelectedBlocks(prev => [...prev, newBlock]);
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setSelectedBlocks(prev => prev.filter(b => b.id !== blockId));
    setConnections(prev => 
      prev.filter(c => c.fromBlock !== blockId && c.toBlock !== blockId)
    );
  }, []);

  const createConnection = useCallback((connection: BlockConnection) => {
    setConnections(prev => [...prev, connection]);
  }, []);

  const filteredBlocks = selectedCategory === 'all' 
    ? AVAILABLE_BLOCKS 
    : AVAILABLE_BLOCKS.filter(b => b.category === selectedCategory);

  const getCompatibleBlocks = (outputType: string) => {
    return selectedBlocks.filter(block => 
      Object.values(block.inputs).some(inputType => inputType === outputType)
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Modular Block System</h2>
        <p className="text-muted-foreground">
          Build complex workflows by connecting reusable blocks with type-safe interfaces
        </p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">
            <Package className="w-4 h-4 mr-2" />
            Block Builder
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Shuffle className="w-4 h-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Play className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Blocks */}
            <Card>
              <CardHeader>
                <CardTitle>Available Blocks</CardTitle>
                <CardDescription>
                  Choose from pre-built components to add to your workflow
                </CardDescription>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <block.icon className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">{block.name}</div>
                        <div className="text-xs text-muted-foreground">{block.description}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant={
                            block.type === 'loader' ? 'default' :
                            block.type === 'section' ? 'secondary' : 'destructive'
                          }>
                            {block.type}
                          </Badge>
                          <Badge variant="outline">{block.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => addBlock(block)}>
                      Add
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected Blocks */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Blocks</CardTitle>
                <CardDescription>
                  Blocks in your current workflow ({selectedBlocks.length})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedBlocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2" />
                    <p>No blocks added yet</p>
                    <p className="text-sm">Add blocks from the left panel to get started</p>
                  </div>
                ) : (
                  selectedBlocks.map((block, index) => (
                    <div key={block.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <block.icon className="w-4 h-4" />
                          <span className="font-medium">{block.name}</span>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => removeBlock(block.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="font-medium text-green-600">Inputs:</div>
                          {Object.entries(block.inputs).map(([key, type]) => (
                            <div key={key} className="text-muted-foreground">
                              {key}: <code>{type}</code>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="font-medium text-blue-600">Outputs:</div>
                          {Object.entries(block.outputs).map(([key, type]) => (
                            <div key={key} className="text-muted-foreground">
                              {key}: <code>{type}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Block Connections</CardTitle>
              <CardDescription>
                Connect block outputs to inputs based on matching types
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedBlocks.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shuffle className="w-8 h-8 mx-auto mb-2" />
                  <p>Add at least 2 blocks to create connections</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBlocks.map((fromBlock) => (
                    <div key={fromBlock.id} className="space-y-2">
                      <div className="font-medium">{fromBlock.name}</div>
                      {Object.entries(fromBlock.outputs).map(([outputKey, outputType]) => {
                        const compatibleBlocks = getCompatibleBlocks(outputType);
                        return compatibleBlocks.length > 0 ? (
                          <div key={outputKey} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{outputKey}: {outputType}</Badge>
                            <ArrowRight className="w-4 h-4" />
                            <Select onValueChange={(value) => {
                              const [toBlockId, toInputKey] = value.split('.');
                              createConnection({
                                fromBlock: fromBlock.id,
                                fromOutput: outputKey,
                                toBlock: toBlockId,
                                toInput: toInputKey
                              });
                            }}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Connect to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {compatibleBlocks.map((toBlock) =>
                                  Object.entries(toBlock.inputs)
                                    .filter(([, inputType]) => inputType === outputType)
                                    .map(([inputKey]) => (
                                      <SelectItem key={`${toBlock.id}.${inputKey}`} value={`${toBlock.id}.${inputKey}`}>
                                        {toBlock.name} → {inputKey}
                                      </SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Preview</CardTitle>
              <CardDescription>
                Visual representation of your block workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm font-medium">Workflow Summary:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedBlocks.filter(b => b.type === 'loader').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Data Loaders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedBlocks.filter(b => b.type === 'section').length}
                    </div>
                    <div className="text-sm text-muted-foreground">UI Sections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedBlocks.filter(b => b.type === 'action').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Actions</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Active Connections:</div>
                  {connections.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No connections established</p>
                  ) : (
                    connections.map((conn, index) => {
                      const fromBlock = selectedBlocks.find(b => b.id === conn.fromBlock);
                      const toBlock = selectedBlocks.find(b => b.id === conn.toBlock);
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{fromBlock?.name}</Badge>
                          <ArrowRight className="w-4 h-4" />
                          <Badge variant="secondary">{toBlock?.name}</Badge>
                          <span className="text-muted-foreground">
                            ({conn.fromOutput} → {conn.toInput})
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModularBlocks;