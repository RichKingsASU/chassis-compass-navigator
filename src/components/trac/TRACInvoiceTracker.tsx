import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const TRACInvoiceTracker = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoice Tracker</CardTitle>
        <Button onClick={() => navigate("/vendors/trac/invoices/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No invoices available yet.</p>
          <p className="text-sm mt-2">Upload your first TRAC invoice to get started.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TRACInvoiceTracker;
