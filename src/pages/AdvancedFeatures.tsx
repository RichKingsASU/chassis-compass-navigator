import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import VisualEditor from '@/components/ui/visual-editor';
import TypedInterface from '@/components/advanced/TypedInterface';
import ModularBlocks from '@/components/advanced/ModularBlocks';
import { 
  Palette, 
  Code, 
  Blocks, 
  Sparkles, 
  Zap, 
  Database,
  Globe,
  Settings
} from 'lucide-react';

const AdvancedFeatures = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Advanced Features
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore cutting-edge development tools inspired by modern visual CMS and 
            block-based architectures for enhanced productivity
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary" className="gap-1">
              <Zap className="w-3 h-3" />
              TypeScript Powered
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Globe className="w-3 h-3" />
              Git-Based
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Database className="w-3 h-3" />
              Type-Safe
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="visual-editor" className="w-full">
          <TabsList className="grid w-full md:w-[800px] mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="visual-editor" className="gap-2">
              <Palette className="w-4 h-4" />
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="typed-interface" className="gap-2">
              <Code className="w-4 h-4" />
              Typed Interface
            </TabsTrigger>
            <TabsTrigger value="modular-blocks" className="gap-2">
              <Blocks className="w-4 h-4" />
              Modular Blocks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual-editor" className="space-y-6">
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Palette className="w-5 h-5" />
                  Visual Component Editor
                </CardTitle>
                <CardDescription>
                  Build UI components visually with drag-and-drop functionality and live preview.
                  Inspired by modern visual CMS tools for rapid prototyping and content creation.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <div className="border rounded-lg overflow-hidden">
              <VisualEditor 
                onSave={(components) => {
                  console.log('Saved components:', components);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="typed-interface" className="space-y-6">
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Code className="w-5 h-5" />
                  TypeScript Props to UI Generator
                </CardTitle>
                <CardDescription>
                  Automatically generate beautiful admin interfaces from TypeScript schemas.
                  Define your component props once, get a fully functional configuration UI.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Shelf Configuration</CardTitle>
                  <CardDescription>
                    Example inspired by Deco's component configuration system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TypedInterface 
                    title="Product Shelf Settings"
                    description="Configure your product display component"
                    onSave={(data) => {
                      console.log('Product shelf config:', data);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Settings className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Type Safety</div>
                        <div className="text-sm text-muted-foreground">
                          Ensure data integrity with compile-time type checking
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Auto-generated UI</div>
                        <div className="text-sm text-muted-foreground">
                          Save development time with automatically generated forms
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Code className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Developer Experience</div>
                        <div className="text-sm text-muted-foreground">
                          Write TypeScript interfaces, get beautiful UIs instantly
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="font-medium mb-2">Schema Example:</div>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto">
{`interface ProductShelfProps {
  title: string;
  products: Product[];
  layout?: {
    headerAlignment: 'center' | 'left';
    headerFontSize: 'Normal' | 'Large';
  };
  maxItems?: number;
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="modular-blocks" className="space-y-6">
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Blocks className="w-5 h-5" />
                  Modular Block System
                </CardTitle>
                <CardDescription>
                  Build complex workflows by connecting reusable blocks with type-safe interfaces.
                  Create powerful applications by composing pre-built components.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <ModularBlocks />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Separator className="mb-6" />
          <p className="text-muted-foreground">
            These features are inspired by modern development tools like Deco CMS, 
            bringing visual editing and type-safe development to your workflow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFeatures;