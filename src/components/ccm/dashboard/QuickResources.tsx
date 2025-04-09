
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const QuickResources = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Quick Resources</CardTitle>
        <CardDescription>Helpful links and resources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded flex items-center justify-center">
                <ExternalLink className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium">CCM Customer Portal</h4>
                <p className="text-xs text-muted-foreground">Access your full CCM account</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 text-green-700 rounded flex items-center justify-center">
                <ExternalLink className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Service Bulletins</h4>
                <p className="text-xs text-muted-foreground">Latest operational updates</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-purple-100 text-purple-700 rounded flex items-center justify-center">
                <ExternalLink className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Chassis Location Guide</h4>
                <p className="text-xs text-muted-foreground">Find nearest drop-off locations</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-100 text-red-700 rounded flex items-center justify-center">
                <ExternalLink className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Dispute Resolution Guide</h4>
                <p className="text-xs text-muted-foreground">How to dispute incorrect charges</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickResources;
