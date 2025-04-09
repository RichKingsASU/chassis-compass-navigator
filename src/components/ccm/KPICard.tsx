
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, DollarSign, Users, FileText, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  description: string;
  icon: 'chart' | 'dollar' | 'users' | 'file' | 'alert';
  change?: number;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, description, icon, change }) => {
  const getIcon = () => {
    switch (icon) {
      case 'chart':
        return <BarChart className="h-5 w-5" />;
      case 'dollar':
        return <DollarSign className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'file':
        return <FileText className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <BarChart className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline mt-1">
              <h3 className="text-2xl font-bold">{value}</h3>
              {change !== undefined && (
                <span className={`ml-2 flex items-center text-xs font-medium ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(change)}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-2 rounded-full ${
            icon === 'dollar' ? 'bg-green-100 text-green-700' :
            icon === 'users' ? 'bg-blue-100 text-blue-700' :
            icon === 'file' ? 'bg-amber-100 text-amber-700' :
            icon === 'alert' ? 'bg-red-100 text-red-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {getIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
