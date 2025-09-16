import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";

interface ValidationKPIsProps {
  data: {
    totalValidations: number;
    pendingValidations: number;
    acceptedValidations: number;
    disputedValidations: number;
    documentsUploaded: number;
    totalUsageDays: number;
    avgResolutionTime: number;
    disputeRate: number;
  };
}

const ValidationKPIs: React.FC<ValidationKPIsProps> = ({ data }) => {
  const acceptanceRate = ((data.acceptedValidations / data.totalValidations) * 100).toFixed(1);
  const documentationRate = ((data.documentsUploaded / data.totalValidations) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Validations</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="stats-value text-primary">{data.totalValidations}</div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">All Vendors</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="stats-value text-amber-600">{data.pendingValidations}</div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
              {((data.pendingValidations / data.totalValidations) * 100).toFixed(0)}% of total
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Acceptance Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="stats-value text-green-600">{acceptanceRate}%</div>
          <div className="flex items-center space-x-2 mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">+2.1% vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dispute Rate</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="stats-value text-red-600">{data.disputeRate.toFixed(1)}%</div>
          <div className="flex items-center space-x-2 mt-1">
            <TrendingDown className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">-1.2% vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Documentation Rate</CardTitle>
          <FileText className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="stats-value text-blue-600">{documentationRate}%</div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {data.documentsUploaded} of {data.totalValidations}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Usage Days</CardTitle>
          <Clock className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="stats-value text-purple-600">{data.totalUsageDays.toLocaleString()}</div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-muted-foreground">Across all chassis</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="stats-value text-indigo-600">{data.avgResolutionTime} days</div>
          <div className="flex items-center space-x-2 mt-1">
            <TrendingDown className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">-0.5 days vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Status Distribution</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-green-600">Accepted</span>
              <span className="text-xs font-medium">{data.acceptedValidations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-xs font-medium">{data.pendingValidations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-600">Disputed</span>
              <span className="text-xs font-medium">{data.disputedValidations}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationKPIs;