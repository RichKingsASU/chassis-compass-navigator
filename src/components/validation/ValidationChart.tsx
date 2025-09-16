import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ValidationChartProps {
  data: {
    vendorData: Array<{
      vendor: string;
      accepted: number;
      pending: number;
      disputed: number;
      total: number;
    }>;
    timeSeriesData: Array<{
      month: string;
      validations: number;
      disputes: number;
      acceptanceRate: number;
    }>;
    statusDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
}

const ValidationChart: React.FC<ValidationChartProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Vendor Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Validation Status by Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.vendorData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="vendor" 
                fontSize={12}
                className="text-muted-foreground"
              />
              <YAxis 
                fontSize={12}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="accepted" fill="hsl(142 76% 36%)" name="Accepted" />
              <Bar dataKey="pending" fill="hsl(45 93% 47%)" name="Pending" />
              <Bar dataKey="disputed" fill="hsl(0 84% 60%)" name="Disputed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Overall Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trend Analysis Line Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Validation Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="left"
                fontSize={12}
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                fontSize={12}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="validations" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total Validations"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="disputes" 
                stroke="hsl(0 84% 60%)" 
                strokeWidth={2}
                name="Disputes"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="acceptanceRate" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                name="Acceptance Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationChart;