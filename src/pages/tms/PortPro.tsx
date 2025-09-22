import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from 'lucide-react';

const PortPro = () => {
  return (
    <div className="dashboard-layout">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="dash-title">Port Pro TMS</h1>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Port Pro Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Port Pro TMS dashboard and data management will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortPro;