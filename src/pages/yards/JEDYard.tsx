
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Map } from 'lucide-react';

const JEDYard = () => {
  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="dash-title">JED Yard Report</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Yard Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Chassis</span>
                <span className="font-medium">98</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Chassis</span>
                <span className="font-medium">52</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserved Chassis</span>
                <span className="font-medium">28</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Under Maintenance</span>
                <span className="font-medium">18</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Yard Map</CardTitle>
          </CardHeader>
          <CardContent className="h-60 bg-muted/30 flex items-center justify-center">
            <p className="text-muted-foreground">Yard map visualization would appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JEDYard;
