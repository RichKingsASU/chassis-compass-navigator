import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GpsDashboardTab = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          GPS data tables are not yet configured in the database.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>GPS Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No GPS data available. Configure database tables to view data.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GpsDashboardTab;
