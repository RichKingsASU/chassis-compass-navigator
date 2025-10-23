import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FLEXIVANInvoiceTracker = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          FLEXIVAN invoice tables are not yet configured in the database.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoice Tracker</CardTitle>
          <Button onClick={() => navigate('/vendors/flexivan/invoice/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No invoice data available. Tables need to be configured.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FLEXIVANInvoiceTracker;
