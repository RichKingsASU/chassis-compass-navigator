import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

interface VendorData {
  name: string;
  id: string;
  totalValidations: number;
  pendingValidations: number;
  acceptedValidations: number;
  disputedValidations: number;
  acceptanceRate: number;
  disputeRate: number;
  avgUsageDays: number;
  trend: 'up' | 'down' | 'stable';
}

interface VendorBreakdownProps {
  vendors: VendorData[];
  onViewVendor: (vendorId: string) => void;
}

const VendorBreakdown: React.FC<VendorBreakdownProps> = ({ vendors, onViewVendor }) => {
  const getStatusBadge = (status: string, count: number) => {
    const colors = {
      accepted: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      disputed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {count}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Vendor Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium text-lg">{vendor.name}</h3>
                  {getTrendIcon(vendor.trend)}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewVendor(vendor.id)}
                  className="gap-1"
                >
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-primary">{vendor.totalValidations}</div>
                  <div className="text-xs text-muted-foreground">Total Validations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">{vendor.acceptanceRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Acceptance Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">{vendor.disputeRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Dispute Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-purple-600">{vendor.avgUsageDays}</div>
                  <div className="text-xs text-muted-foreground">Avg Usage Days</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Acceptance Progress</span>
                  <span className="text-sm font-medium">{vendor.acceptanceRate.toFixed(1)}%</span>
                </div>
                <Progress value={vendor.acceptanceRate} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge('accepted', vendor.acceptedValidations)}
                  {getStatusBadge('pending', vendor.pendingValidations)}
                  {getStatusBadge('disputed', vendor.disputedValidations)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorBreakdown;