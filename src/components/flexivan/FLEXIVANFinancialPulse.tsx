import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from '../ccm/KPICard';

const FLEXIVANFinancialPulse = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Outstanding"
          value="$0.00"
          description="Pending payment"
          icon="dollar"
          change={0}
        />
        <KPICard
          title="Total Invoices"
          value="0"
          description="All time"
          icon="file"
          change={0}
        />
        <KPICard
          title="Pending Review"
          value="0"
          description="Awaiting validation"
          icon="alert"
          change={0}
        />
        <KPICard
          title="This Month"
          value="$0.00"
          description="Invoiced this month"
          icon="chart"
          change={0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">No invoice data available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FLEXIVANFinancialPulse;
