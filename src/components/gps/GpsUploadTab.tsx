
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileType, Upload, FileCheck, Info } from 'lucide-react';

const GpsUploadTab = ({ providerName }: { providerName: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Upload GPS Data File</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <FileType size={28} className="mb-2 text-primary" />
              <div className="font-medium">CSV File</div>
              <div className="text-xs text-muted-foreground">Most common format</div>
            </div>
            
            <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <FileType size={28} className="mb-2 text-primary" />
              <div className="font-medium">Excel File</div>
              <div className="text-xs text-muted-foreground">XLSX or XLS format</div>
            </div>
            
            <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <FileType size={28} className="mb-2 text-primary" />
              <div className="font-medium">PDF File</div>
              <div className="text-xs text-muted-foreground">For scanned documents</div>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2 text-gray-600">Drag and drop your {providerName} export file here</div>
            <div className="mt-1 text-sm text-muted-foreground">
              or
            </div>
            <div className="mt-2">
              <Input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls,.pdf"
                className="hidden"
              />
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                Select File
              </Button>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Upload Instructions</div>
                <div className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Log into your {providerName} dashboard</li>
                    <li>Navigate to the Reports or Exports section</li>
                    <li>Select "GPS Data Export" and choose the date range</li>
                    <li>Download the file and upload it here</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button size="lg" className="gap-2">
              <FileCheck size={18} />
              Process Upload
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsUploadTab;
